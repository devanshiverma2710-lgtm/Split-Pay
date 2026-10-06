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
import com.devanshi.security.CurrentUserService;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {

    private final PaymentRepo paymentRepo;
    private final UserRepo userRepo;
    private final GroupRepo groupRepo;
    private final CurrentUserService currentUserService;

    public PaymentService(
            PaymentRepo paymentRepo,
            UserRepo userRepo,
            GroupRepo groupRepo,
            CurrentUserService currentUserService
    ) {
        this.paymentRepo = paymentRepo;
        this.userRepo = userRepo;
        this.groupRepo = groupRepo;
        this.currentUserService = currentUserService;
    }


    // Get all payments involving the logged-in user
    public List<Payment> getAllPayments() {

        User currentUser =
                currentUserService.getCurrentUser();

        return paymentRepo.findAll()
                .stream()
                .filter(payment ->
                        payment.getFromUser()
                                .getId()
                                .equals(currentUser.getId())
                                ||
                                payment.getToUser()
                                        .getId()
                                        .equals(currentUser.getId())
                )
                .toList();
    }


    // Get payment by ID
    public Payment getPaymentById(Integer id) {

        Payment payment =
                paymentRepo.findById(id)
                        .orElseThrow(() ->
                                new ExpenseNotFoundException(
                                        "Payment not found with id: " + id
                                ));

        checkPaymentAccess(payment);

        return payment;
    }


    // Get payment DTO by ID
    public PaymentDTO getPaymentDTOById(Integer id) {

        Payment payment =
                getPaymentById(id);

        return convertToDTO(payment);
    }


    // Create normal payment
    public Payment createPayment(
            Integer groupId,
            Integer fromUserId,
            Integer toUserId,
            Payment payment
    ) {

        // Get logged-in user from JWT
        User currentUser =
                currentUserService.getCurrentUser();

        // Validate amount
        if (payment.getAmount() == null ||
                payment.getAmount().compareTo(BigDecimal.ZERO) <= 0) {

            throw new RuntimeException(
                    "Payment amount must be greater than zero"
            );
        }

        // Find group
        Group group =
                groupRepo.findById(groupId)
                        .orElseThrow(() ->
                                new ExpenseNotFoundException(
                                        "Group not found with id: "
                                                + groupId
                                ));


        // Logged-in user becomes the sender
        User fromUser = currentUser;


        // Find receiver
        User toUser =
                userRepo.findById(toUserId)
                        .orElseThrow(() ->
                                new ExpenseNotFoundException(
                                        "To user not found with id: "
                                                + toUserId
                                ));


        // Make sure sender belongs to group
        if (!group.getUsers().contains(fromUser)) {

            throw new RuntimeException(
                    "You are not a member of this group"
            );
        }


        // Make sure receiver belongs to group
        if (!group.getUsers().contains(toUser)) {

            throw new RuntimeException(
                    "Receiver is not a member of this group"
            );
        }


        // Prevent paying yourself
        if (fromUser.getId().equals(toUser.getId())) {

            throw new RuntimeException(
                    "You cannot create a payment to yourself"
            );
        }


        payment.setGroup(group);
        payment.setFromUser(fromUser);
        payment.setToUser(toUser);
        payment.setStatus(PaymentStatus.PENDING);

        return paymentRepo.save(payment);
    }


    // Mark payment as paid
    public Payment markPaymentAsPaid(Integer id) {

        Payment payment =
                getPaymentById(id);

        User currentUser =
                currentUserService.getCurrentUser();


        // Only receiver can mark payment as received
        if (!payment.getToUser()
                .getId()
                .equals(currentUser.getId())) {

            throw new RuntimeException(
                    "Only the receiver can mark this payment as paid"
            );
        }


        payment.setStatus(PaymentStatus.PAID);
        payment.setPaidAt(LocalDateTime.now());

        return paymentRepo.save(payment);
    }


    // Get pending payments involving current user
    public List<Payment> getPendingPayments() {

        User currentUser =
                currentUserService.getCurrentUser();

        return paymentRepo
                .findByStatus(PaymentStatus.PENDING)
                .stream()
                .filter(payment ->
                        payment.getFromUser()
                                .getId()
                                .equals(currentUser.getId())
                                ||
                                payment.getToUser()
                                        .getId()
                                        .equals(currentUser.getId())
                )
                .toList();
    }


    // Generate UPI payment link
    public UPIPaymentDTO generateUPIPaymentLink(
            Integer paymentId
    ) {

        Payment payment =
                getPaymentById(paymentId);


        if (payment.getStatus() == PaymentStatus.PAID) {

            throw new RuntimeException(
                    "Payment is already completed"
            );
        }


        User fromUser =
                payment.getFromUser();

        User toUser =
                payment.getToUser();


        if (toUser.getUpiId() == null
                || toUser.getUpiId().isBlank()) {

            throw new RuntimeException(
                    "Receiver does not have a UPI ID"
            );
        }


        String upiLink =
                "upi://pay"
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


    // Create payment from group settlement
    public Payment createPaymentFromSettlement(
            Integer groupId,
            Integer fromUserId,
            Integer toUserId,
            BigDecimal amount
    ) {

        // Logged-in user is always the sender
        User currentUser =
                currentUserService.getCurrentUser();


        // Find group FIRST
        Group group =
                groupRepo.findById(groupId)
                        .orElseThrow(() ->
                                new ExpenseNotFoundException(
                                        "Group not found with id: "
                                                + groupId
                                ));


        // Current user is sender
        User fromUser =
                currentUser;


        // Check group membership BEFORE
        // checking existing payments
        if (!group.getUsers().contains(fromUser)) {

            throw new RuntimeException(
                    "You are not a member of this group"
            );
        }


        // Find receiver
        User toUser =
                userRepo.findById(toUserId)
                        .orElseThrow(() ->
                                new ExpenseNotFoundException(
                                        "User not found with id: "
                                                + toUserId
                                ));


        // Receiver must belong to group
        if (!group.getUsers().contains(toUser)) {

            throw new RuntimeException(
                    "Receiver is not a member of this group"
            );
        }


        // Prevent self-payment
        if (fromUser.getId().equals(toUser.getId())) {

            throw new RuntimeException(
                    "You cannot create a payment to yourself"
            );
        }


        // Validate amount
        if (amount == null
                || amount.compareTo(BigDecimal.ZERO) <= 0) {

            throw new RuntimeException(
                    "Payment amount must be greater than zero"
            );
        }


        // Check whether pending payment already exists
        List<Payment> existingPayments =
                paymentRepo
                        .findByGroupIdAndFromUserIdAndToUserIdAndStatus(
                                groupId,
                                fromUser.getId(),
                                toUserId,
                                PaymentStatus.PENDING
                        );


        if (!existingPayments.isEmpty()) {

            return existingPayments.get(0);
        }


        // Create payment
        Payment payment =
                new Payment();

        payment.setGroup(group);
        payment.setFromUser(fromUser);
        payment.setToUser(toUser);
        payment.setAmount(amount);
        payment.setStatus(PaymentStatus.PENDING);

        return paymentRepo.save(payment);
    }


    // Convert Payment entity to DTO
    private PaymentDTO convertToDTO(
            Payment payment
    ) {

        String upiLink = null;


        if (payment.getToUser().getUpiId() != null
                && !payment.getToUser().getUpiId().isBlank()
                && payment.getStatus() == PaymentStatus.PENDING) {

            upiLink =
                    "upi://pay"
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

        return getPendingPayments()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }


    // Get all payment DTOs
    public List<PaymentDTO> getAllPaymentDTOs() {

        return getAllPayments()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }


    // Check whether current user is involved in payment
    private void checkPaymentAccess(
            Payment payment
    ) {

        User currentUser =
                currentUserService.getCurrentUser();


        Integer currentUserId =
                currentUser.getId();


        boolean isSender =
                payment.getFromUser()
                        .getId()
                        .equals(currentUserId);


        boolean isReceiver =
                payment.getToUser()
                        .getId()
                        .equals(currentUserId);


        if (!isSender && !isReceiver) {

            throw new RuntimeException(
                    "You are not authorized to access this payment"
            );
        }
    }
}