package com.devanshi.repo;

import com.devanshi.entity.Payment;
import com.devanshi.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepo extends JpaRepository<Payment, Integer> {

    List<Payment> findByStatus(PaymentStatus status);

    List<Payment> findByFromUserIdAndToUserIdAndStatus(
            Integer fromUserId,
            Integer toUserId,
            PaymentStatus status
    );

    List<Payment> findByGroupIdAndStatus(
            Integer groupId,
            PaymentStatus status
    );
    List<Payment> findByGroupIdAndFromUserIdAndToUserIdAndStatus(
            Integer groupId,
            Integer fromUserId,
            Integer toUserId,
            PaymentStatus status
    );
}