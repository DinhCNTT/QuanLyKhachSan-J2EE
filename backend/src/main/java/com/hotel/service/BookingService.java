package com.hotel.service;

import com.hotel.dto.BookingRequest;
import com.hotel.model.Booking;
import com.hotel.model.BookingStatus;
import com.hotel.model.Invoice;
import com.hotel.model.Room;
import com.hotel.model.RoomStatus;
import com.hotel.repository.BookingRepository;
import com.hotel.repository.InvoiceRepository;
import com.hotel.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final RoomRepository roomRepository;
    private final InvoiceRepository invoiceRepository;

    public Booking checkIn(BookingRequest request) {
        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (room.getStatus() != RoomStatus.AVAILABLE) {
            throw new RuntimeException("Room is not available");
        }

        LocalDate checkIn = request.getCheckInDate() != null ? request.getCheckInDate() : LocalDate.now();
        LocalDate checkOut = request.getCheckOutDate();
        String rentalType = request.getRentalType() != null ? request.getRentalType() : "DAILY";

        if ("HOURLY".equals(rentalType)) {
            if (checkOut.isBefore(checkIn)) {
                throw new RuntimeException("Check-out date cannot be before check-in date");
            }
        } else {
            if (!checkOut.isAfter(checkIn)) {
                throw new RuntimeException("Check-out date must be after check-in date");
            }
        }

        // Overbooking Check
        java.util.List<Booking> activeBookings = bookingRepository.findByRoomIdAndStatusIn(room.getId(),
                java.util.List.of(BookingStatus.ACTIVE));
        for (Booking b : activeBookings) {
            boolean isOverlap = checkIn.isBefore(b.getCheckOutDate()) && checkOut.isAfter(b.getCheckInDate());
            if (isOverlap) {
                throw new RuntimeException("Phòng đã có khách hoặc được đặt trong khoảng thời gian này!");
            }
        }

        double estimatedPrice = 0;
        long days = ChronoUnit.DAYS.between(checkIn, checkOut);
        int durationHours = request.getDurationHours() != null ? request.getDurationHours() : 1;

        if ("HOURLY".equals(rentalType)) {
            double pricePerHour = room.getPriceHourly() != null ? room.getPriceHourly() : room.getPrice();
            estimatedPrice = pricePerHour * durationHours;
        } else if ("OVERNIGHT".equals(rentalType)) {
            estimatedPrice = room.getPriceOvernight() != null ? room.getPriceOvernight() : room.getPrice();
            if (days > 1) {
                estimatedPrice += (days - 1) * room.getPrice(); // extra days use default price
            }
        } else {
            estimatedPrice = days * room.getPrice();
        }

        Booking booking = Booking.builder()
                .roomId(room.getId())
                .roomNumber(room.getRoomNumber())
                .guestName(request.getGuestName())
                .cccd(request.getCccd())
                .phone(request.getPhone())
                .checkInDate(checkIn)
                .checkOutDate(checkOut)
                .rentalType(rentalType)
                .durationHours("HOURLY".equals(rentalType) ? durationHours : null)
                .estimatedPrice(estimatedPrice)
                .status(BookingStatus.ACTIVE)
                .build();

        bookingRepository.save(booking);

        room.setStatus(RoomStatus.OCCUPIED);
        roomRepository.save(room);

        return booking;
    }

    public Booking getActiveBookingForRoom(String roomId) {
        return bookingRepository.findByRoomIdAndStatus(roomId, BookingStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("No active booking for this room"));
    }

    public Booking cancelBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(BookingStatus.CANCELLED);
        return bookingRepository.save(booking);
    }

    public Booking addServiceCharge(String bookingId, com.hotel.model.ServiceCharge charge) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (booking.getStatus() != BookingStatus.ACTIVE) {
            throw new RuntimeException("Can only add services to ACTIVE bookings");
        }
        booking.getServiceCharges().add(charge);
        return bookingRepository.save(booking);
    }

    public Booking removeServiceCharge(String bookingId, int index) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (booking.getStatus() != BookingStatus.ACTIVE) {
            throw new RuntimeException("Can only modify services of ACTIVE bookings");
        }
        if (index >= 0 && index < booking.getServiceCharges().size()) {
            booking.getServiceCharges().remove(index);
        }
        return bookingRepository.save(booking);
    }

    public Invoice checkOut(String bookingId, com.hotel.dto.CheckoutRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() == BookingStatus.COMPLETED) {
            throw new RuntimeException("Booking already completed");
        }

        // Calculate final price with services
        double servicesTotal = booking.getServiceCharges().stream()
                .mapToDouble(s -> s.getAmount() * s.getQuantity()).sum();

        booking.setStatus(BookingStatus.COMPLETED);
        booking.setFinalPrice(booking.getEstimatedPrice() + servicesTotal);
        bookingRepository.save(booking);

        // Update room status
        Room room = roomRepository.findById(booking.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));
        room.setStatus(RoomStatus.CLEANING);
        roomRepository.save(room);

        // Generate invoice
        Invoice invoice = Invoice.builder()
                .bookingId(booking.getId())
                .roomNumber(booking.getRoomNumber())
                .guestName(booking.getGuestName())
                .totalAmount(booking.getFinalPrice())
                .paymentMethod(
                        request != null && request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH")
                .build();

        return invoiceRepository.save(invoice);
    }
}
