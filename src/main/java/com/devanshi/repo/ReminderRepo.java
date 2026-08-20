package com.devanshi.repo;

import com.devanshi.entity.Reminder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReminderRepo extends JpaRepository<Reminder, Integer> {

    List<Reminder> findByRemindedUserId(Integer userId);

    List<Reminder> findByPaymentId(Integer paymentId);

    boolean existsByPaymentId(Integer paymentId);
}