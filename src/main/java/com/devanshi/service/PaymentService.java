package com.devanshi.service;

import com.devanshi.dto.PaymentDTO;
import com.devanshi.entity.Payment;
import com.devanshi.entity.PaymentStatus;
import com.devanshi.entity.User;
import com.devanshi.exception.ExpenseNotFoundException;
import com.devanshi.repo.PaymentRepo;
import com.devanshi.repo.UserRepo;
import org.springframework.stereotype.Service;
import com.devanshi.dto.UPIPaymentDTO;
import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDateTime;


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

    public PaymentDTO getPaymentDTOById(Integer id) {

        Payment payment = getPaymentById(id);

        return convertToDTO(payment);
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

    public UPIPaymentDTO generateUPIPaymentLink(Integer paymentId) {

        Payment payment = getPaymentById(paymentId);

        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new RuntimeException("Payment is already completed");
        }

        User fromUser = payment.getFromUser();
        User toUser = payment.getToUser();

        if (toUser.getUpiId() == null || toUser.getUpiId().isBlank()) {
            throw new RuntimeException(
                    "Receiver does not have a UPI ID"
            );
        }

        String upiLink = "upi://pay"
                + "?pa=" + toUser.getUpiId()
                + "&pn=" + toUser.getName()
                + "&am=" + payment.getAmount()
                + "&cu=INR";

        return new UPIPaymentDTO(
                payment.getId(),
                fromUser.getName(),
                toUser.getName(),
                toUser.getUpiId(),
                payment.getAmount(),
                upiLink
        );
    }

    public Payment createPaymentFromSettlement(
            Integer fromUserId,
            Integer toUserId,
            BigDecimal amount) {

        List<Payment> existingPayments =
                paymentRepo.findByFromUserIdAndToUserIdAndStatus(
                        fromUserId,
                        toUserId,
                        PaymentStatus.PENDING
                );

        if (!existingPayments.isEmpty()) {
            return existingPayments.get(0);
        }

        User fromUser = userRepo.findById(fromUserId)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "User not found with id: " + fromUserId
                        ));

        User toUser = userRepo.findById(toUserId)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "User not found with id: " + toUserId
                        ));

        Payment payment = new Payment();

        payment.setFromUser(fromUser);
        payment.setToUser(toUser);
        payment.setAmount(amount);
        payment.setStatus(PaymentStatus.PENDING);

        return paymentRepo.save(payment);
    }
    private PaymentDTO convertToDTO(Payment payment) {

        String upiLink = null;

        if (payment.getToUser().getUpiId() != null
                && !payment.getToUser().getUpiId().isBlank()
                && payment.getStatus() == PaymentStatus.PENDING) {

            upiLink = "upi://pay"
                    + "?pa=" + payment.getToUser().getUpiId()
                    + "&pn=" + payment.getToUser().getName()
                    + "&am=" + payment.getAmount()
                    + "&cu=INR";
        }

        return new PaymentDTO(
                payment.getId(),
                payment.getFromUser().getId(),
                payment.getFromUser().getName(),
                payment.getToUser().getId(),
                payment.getToUser().getName(),
                payment.getToUser().getUpiId(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getPaidAt(),
                upiLink
        );
    }

    public List<PaymentDTO> getPendingPaymentDTOs() {

        return paymentRepo.findByStatus(PaymentStatus.PENDING)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<PaymentDTO> getAllPaymentDTOs() {

        return paymentRepo.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }
}