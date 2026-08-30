package com.devanshi.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPaymentReminder(
            String email,
            String userName,
            String fromUserName,
            String amount) {

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo(email);
        message.setSubject("SplitPay - Payment Reminder");

        message.setText(
                "Hi " + userName + ",\n\n"
                        + fromUserName
                        + " has requested a payment of ₹"
                        + amount
                        + ".\n\n"
                        + "Please settle your pending payment on SplitPay.\n\n"
                        + "Regards,\n"
                        + "SplitPay"
        );

        mailSender.send(message);
    }
}