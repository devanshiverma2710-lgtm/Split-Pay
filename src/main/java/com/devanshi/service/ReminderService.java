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

    public ReminderService(
            ReminderRepo reminderRepo,
            PaymentRepo paymentRepo,
            UserRepo userRepo) {

        this.reminderRepo = reminderRepo;
        this.paymentRepo = paymentRepo;
        this.userRepo = userRepo;
    }

    public ReminderDTO createReminder(Integer paymentId) {

        Payment payment = paymentRepo.findById(paymentId)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "Payment not found with id: " + paymentId
                        ));

        if (payment.getStatus() == PaymentStatus.PAID) {
            throw new RuntimeException(
                    "Cannot remind user because payment is already paid"
            );
        }

        if (reminderRepo.existsByPaymentId(paymentId)) {
            throw new RuntimeException(
                    "Reminder already exists for this payment"
            );
        }

        User user = payment.getFromUser();

        Reminder reminder = new Reminder();

        reminder.setPayment(payment);
        reminder.setRemindedUser(user);
        reminder.setCreatedAt(LocalDateTime.now());
        reminder.setSent(true);

        Reminder savedReminder = reminderRepo.save(reminder);

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