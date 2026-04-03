package com.hotel.repository;

import com.hotel.model.Booking;
import com.hotel.model.BookingStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    Optional<Booking> findByRoomIdAndStatus(String roomId, BookingStatus status);

    List<Booking> findByRoomIdAndStatusIn(String roomId, List<BookingStatus> statuses);

    List<Booking> findByStatus(BookingStatus status);
}
