package com.devanshi.service;

import com.devanshi.dto.PaymentDTO;
import com.devanshi.dto.UPIPaymentDTO;
import com.devanshi.entity.Group;
import com.devanshi.entity.Payment;
import com.devanshi.entity.PaymentStatus;
import com.devanshi.entity.User;
import com.devanshi.exception.ExpenseNotFoundException;
import com.devanshi.repo.GroupRepo;
import com.devanshi.repo.PaymentRepo;
import com.devanshi.repo.UserRepo;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepo paymentRepo;
    private final UserRepo userRepo;
    private final GroupRepo groupRepo;

    public PaymentService(
            PaymentRepo paymentRepo,
            UserRepo userRepo,
            GroupRepo groupRepo) {

        this.paymentRepo = paymentRepo;
        this.userRepo = userRepo;
        this.groupRepo = groupRepo;
    }

    // Get all payments
    public List<Payment> getAllPayments() {
        return paymentRepo.findAll();
    }

    // Get payment by ID
    public Payment getPaymentById(Integer id) {

        return paymentRepo.findById(id)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "Payment not found with id: " + id
                        ));
    }

    // Get payment DTO by ID
    public PaymentDTO getPaymentDTOById(Integer id) {

        Payment payment = getPaymentById(id);

        return convertToDTO(payment);
    }

    // Create normal payment
    public Payment createPayment(
            Integer groupId,
            Integer fromUserId,
            Integer toUserId,
            Payment payment) {

        Group group = groupRepo.findById(groupId)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "Group not found with id: " + groupId
                        ));

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

        payment.setGroup(group);
        payment.setFromUser(fromUser);
        payment.setToUser(toUser);
        payment.setStatus(PaymentStatus.PENDING);

        return paymentRepo.save(payment);
    }

    // Mark payment as paid
    public Payment markPaymentAsPaid(Integer id) {

        Payment payment = getPaymentById(id);

        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(LocalDateTime.now());

        return paymentRepo.save(payment);
    }

    // Get pending payments
    public List<Payment> getPendingPayments() {

        return paymentRepo.findByStatus(
                PaymentStatus.PENDING
        );
    }

    // Generate UPI payment link
    public UPIPaymentDTO generateUPIPaymentLink(
            Integer paymentId) {

        Payment payment = getPaymentById(paymentId);

        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new RuntimeException(
                    "Payment is already completed"
            );
        }

        User fromUser = payment.getFromUser();
        User toUser = payment.getToUser();

        if (toUser.getUpiId() == null
                || toUser.getUpiId().isBlank()) {

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

    // Create payment from a group settlement
    public Payment createPaymentFromSettlement(
            Integer groupId,
            Integer fromUserId,
            Integer toUserId,
            BigDecimal amount) {

        // Check whether a pending payment already exists
        List<Payment> existingPayments =
                paymentRepo
                        .findByGroupIdAndFromUserIdAndToUserIdAndStatus(
                                groupId,
                                fromUserId,
                                toUserId,
                                PaymentStatus.PENDING
                        );

        if (!existingPayments.isEmpty()) {
            return existingPayments.get(0);
        }

        // Find group
        Group group = groupRepo.findById(groupId)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "Group not found with id: "
                                        + groupId
                        ));

        // Find payer
        User fromUser = userRepo.findById(fromUserId)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "User not found with id: "
                                        + fromUserId
                        ));

        // Find receiver
        User toUser = userRepo.findById(toUserId)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "User not found with id: "
                                        + toUserId
                        ));

        // Create payment
        Payment payment = new Payment();

        payment.setGroup(group);
        payment.setFromUser(fromUser);
        payment.setToUser(toUser);
        payment.setAmount(amount);
        payment.setStatus(PaymentStatus.PENDING);

        return paymentRepo.save(payment);
    }

    // Convert Payment entity to PaymentDTO
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

                payment.getGroup().getId(),
                payment.getGroup().getName(),

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

    // Get pending payment DTOs
    public List<PaymentDTO> getPendingPaymentDTOs() {

        return paymentRepo
                .findByStatus(PaymentStatus.PENDING)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    // Get all payment DTOs
    public List<PaymentDTO> getAllPaymentDTOs() {

        return paymentRepo.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }


}