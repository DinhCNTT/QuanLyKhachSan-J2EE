package com.hotel.service;

import com.hotel.dto.RoomRequest;
import com.hotel.model.Room;
import com.hotel.model.RoomStatus;
import com.hotel.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public Room createRoom(RoomRequest request) {
        Room room = Room.builder()
                .roomNumber(request.getRoomNumber())
                .type(request.getType())
                .price(request.getPrice())
                .priceHourly(request.getPriceHourly())
                .priceOvernight(request.getPriceOvernight())
                .status(RoomStatus.AVAILABLE)
                .build();
        return roomRepository.save(room);
    }

    public Room updateRoom(String id, RoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        room.setRoomNumber(request.getRoomNumber());
        room.setType(request.getType());
        room.setPrice(request.getPrice());
        room.setPriceHourly(request.getPriceHourly());
        room.setPriceOvernight(request.getPriceOvernight());

        return roomRepository.save(room);
    }

    public void deleteRoom(String id) {
        roomRepository.deleteById(id);
    }

    public Room updateRoomStatus(String id, RoomStatus status) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Room not found"));
        room.setStatus(status);
        return roomRepository.save(room);
    }
}
