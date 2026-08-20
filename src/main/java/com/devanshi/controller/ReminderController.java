package com.devanshi.controller;

import com.devanshi.entity.Reminder;
import com.devanshi.service.ReminderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.devanshi.dto.ReminderDTO;
import java.util.List;

@RestController
@RequestMapping("/reminders")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @PostMapping("/payment/{paymentId}")
    public ResponseEntity<ReminderDTO> createReminder(
            @PathVariable Integer paymentId) {

        return new ResponseEntity<>(
                reminderService.createReminder(paymentId),
                HttpStatus.CREATED
        );
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ReminderDTO>> getRemindersForUser(
            @PathVariable Integer userId) {

        return ResponseEntity.ok(
                reminderService.getRemindersForUser(userId)
        );
    }

    @GetMapping("/payment/{paymentId}")
    public ResponseEntity<List<ReminderDTO>> getRemindersForPayment(
            @PathVariable Integer paymentId) {

        return ResponseEntity.ok(
                reminderService.getRemindersForPayment(paymentId)
        );
    }
}