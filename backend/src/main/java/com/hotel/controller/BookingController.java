package com.hotel.controller;

import com.hotel.dto.BookingRequest;
import com.hotel.model.Booking;
import com.hotel.model.Invoice;
import com.hotel.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/checkin")
    public ResponseEntity<Booking> checkIn(@RequestBody BookingRequest request) {
        return ResponseEntity.ok(bookingService.checkIn(request));
    }

    @PostMapping("/{bookingId}/checkout")
    public ResponseEntity<Invoice> checkOut(@PathVariable String bookingId,
            @RequestBody(required = false) com.hotel.dto.CheckoutRequest request) {
        return ResponseEntity.ok(bookingService.checkOut(bookingId, request));
    }

    @PostMapping("/{bookingId}/services")
    public ResponseEntity<Booking> addServiceCharge(@PathVariable String bookingId,
            @RequestBody com.hotel.model.ServiceCharge serviceCharge) {
        return ResponseEntity.ok(bookingService.addServiceCharge(bookingId, serviceCharge));
    }

    @DeleteMapping("/{bookingId}/services/{index}")
    public ResponseEntity<Booking> removeServiceCharge(@PathVariable String bookingId, @PathVariable int index) {
        return ResponseEntity.ok(bookingService.removeServiceCharge(bookingId, index));
    }

    @PatchMapping("/{bookingId}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable String bookingId) {
        return ResponseEntity.ok(bookingService.cancelBooking(bookingId));
    }

    @GetMapping("/active/{roomId}")
    public ResponseEntity<Booking> getActiveBookingForRoom(@PathVariable String roomId) {
        return ResponseEntity.ok(bookingService.getActiveBookingForRoom(roomId));
    }
}
