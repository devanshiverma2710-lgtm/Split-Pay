package com.devanshi.service;

import com.devanshi.entity.Payment;
import com.devanshi.entity.PaymentStatus;
import com.devanshi.entity.User;
import com.devanshi.exception.ExpenseNotFoundException;
import com.devanshi.repo.PaymentRepo;
import com.devanshi.repo.UserRepo;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepo paymentRepo;
    private final UserRepo userRepo;

    public PaymentService(PaymentRepo paymentRepo, UserRepo userRepo) {
        this.paymentRepo = paymentRepo;
        this.userRepo = userRepo;
    }

    public List<Payment> getAllPayments() {
        return paymentRepo.findAll();
    }

    public Payment getPaymentById(Integer id) {
        return paymentRepo.findById(id)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "Payment not found with id: " + id
                        ));
    }

    public Payment createPayment(
            Integer fromUserId,
            Integer toUserId,
            Payment payment) {

        User fromUser = userRepo.findById(fromUserId)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "From user not found with id: " + fromUserId
                        ));

        User toUser = userRepo.findById(toUserId)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "To user not found with id: " + toUserId
                        ));

        payment.setFromUser(fromUser);
        payment.setToUser(toUser);
        payment.setStatus(PaymentStatus.PENDING);

        return paymentRepo.save(payment);
    }

    public Payment markPaymentAsPaid(Integer id) {

        Payment payment = getPaymentById(id);

        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(LocalDateTime.now());

        return paymentRepo.save(payment);
    }

    public List<Payment> getPendingPayments() {
        return paymentRepo.findByStatus(PaymentStatus.PENDING);
    }
}