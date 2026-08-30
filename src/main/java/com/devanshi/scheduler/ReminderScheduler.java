package com.devanshi.scheduler;

import com.devanshi.entity.Payment;
import com.devanshi.entity.PaymentStatus;
import com.devanshi.entity.Reminder;
import com.devanshi.repo.PaymentRepo;
import com.devanshi.repo.ReminderRepo;
import com.devanshi.service.EmailService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class ReminderScheduler {

    private final ReminderRepo reminderRepo;
    private final PaymentRepo paymentRepo;
    private final EmailService emailService;

    public ReminderScheduler(
            ReminderRepo reminderRepo,
            PaymentRepo paymentRepo,
            EmailService emailService) {

        this.reminderRepo = reminderRepo;
        this.paymentRepo = paymentRepo;
        this.emailService = emailService;
    }

    @Scheduled(fixedRate = 60000)
    public void processReminders() {

        LocalDateTime now = LocalDateTime.now();

        List<Reminder> reminders =
                reminderRepo.findAll();

        for (Reminder reminder : reminders) {

            Payment payment = reminder.getPayment();

            // Don't remind someone who has already paid
            if (payment.getStatus() == PaymentStatus.PAID) {
                continue;
            }

            // Check whether reminder is due
            if (reminder.getNextReminderAt() != null
                    && !reminder.getNextReminderAt().isAfter(now)) {

                emailService.sendPaymentReminder(
                        reminder.getRemindedUser().getEmail(),
                        reminder.getRemindedUser().getName(),
                        payment.getFromUser().getName(),
                        payment.getAmount().toString()
                );
                reminder.setLastReminderAt(now);
                reminder.setNextReminderAt(
                        now.plusDays(1)
                );

                reminderRepo.save(reminder);
            }
        }
    }
}