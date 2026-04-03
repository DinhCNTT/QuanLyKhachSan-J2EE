package com.hotel.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    private String roomId;
    private String roomNumber; // Denormalized for easier query

    private String guestName;
    private String cccd;
    private String phone;

    private LocalDate checkInDate;
    private LocalDate checkOutDate;

    private String rentalType; // HOURLY, OVERNIGHT, DAILY
    private Integer durationHours; // Số giờ thuê (chỉ dùng khi rentalType = HOURLY)

    private Double estimatedPrice;
    private Double finalPrice; // Cho trường hợp có phụ thu

    @Builder.Default
    private java.util.List<ServiceCharge> serviceCharges = new java.util.ArrayList<>();

    private BookingStatus status;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
