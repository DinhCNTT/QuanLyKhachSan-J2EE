package com.hotel.dto;

import com.hotel.model.RoomType;
import lombok.Data;

@Data
public class RoomRequest {
    private String roomNumber;
    private RoomType type;
    private Double price;
    private Double priceHourly;
    private Double priceOvernight;
}
