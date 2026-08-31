package com.devanshi.service;

import com.devanshi.dto.ReminderDTO;
import com.devanshi.entity.Payment;
import com.devanshi.entity.PaymentStatus;
import com.devanshi.entity.Reminder;
import com.devanshi.entity.User;
import com.devanshi.exception.ExpenseNotFoundException;
import com.devanshi.repo.PaymentRepo;
import com.devanshi.repo.ReminderRepo;
import com.devanshi.repo.UserRepo;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReminderService {

    private final ReminderRepo reminderRepo;
    private final PaymentRepo paymentRepo;
    private final UserRepo userRepo;
    private final EmailService emailService;

    public ReminderService(
            ReminderRepo reminderRepo,
            PaymentRepo paymentRepo,
            UserRepo userRepo, EmailService emailService) {

        this.reminderRepo = reminderRepo;
        this.paymentRepo = paymentRepo;
        this.userRepo = userRepo;
        this.emailService = emailService;
    }
    public ReminderDTO createReminder(Integer paymentId) {

        Payment payment = paymentRepo.findById(paymentId)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "Payment not found with id: " + paymentId
                        ));

        // Cannot create a reminder for a paid payment
        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new RuntimeException(
                    "Cannot remind user because payment is already paid"
            );
        }

        // Only one reminder per payment
        if (reminderRepo.existsByPaymentId(paymentId)) {
            throw new RuntimeException(
                    "Reminder already exists for this payment"
            );
        }

        // The FROM user is the person who owes the payment
        User user = payment.getFromUser();

        Reminder reminder = new Reminder();

        reminder.setPayment(payment);
        reminder.setRemindedUser(user);

        LocalDateTime now = LocalDateTime.now();

        reminder.setCreatedAt(now);

        // Reminder is due immediately
        reminder.setNextReminderAt(now);

        // No reminder has been sent yet
        reminder.setLastReminderAt(null);
        reminder.setSent(false);

        Reminder savedReminder = reminderRepo.save(reminder);

        emailService.sendPaymentReminder(
                user.getEmail(),
                user.getName(),
                payment.getToUser().getName(),
                payment.getAmount().toString()
        );

        return convertToDTO(savedReminder);
    }

    public List<ReminderDTO> getRemindersForUser(Integer userId) {

        if (!userRepo.existsById(userId)) {
            throw new ExpenseNotFoundException(
                    "User not found with id: " + userId
            );
        }

        return reminderRepo.findByRemindedUserId(userId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    public List<ReminderDTO> getRemindersForPayment(Integer paymentId) {

        return reminderRepo.findByPaymentId(paymentId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    private ReminderDTO convertToDTO(Reminder reminder) {

        Payment payment = reminder.getPayment();

        return new ReminderDTO(
                reminder.getId(),
                payment.getId(),
                reminder.getRemindedUser().getId(),
                reminder.getRemindedUser().getName(),
                payment.getAmount(),
                payment.getStatus(),
                reminder.getCreatedAt()
        );
    }
}