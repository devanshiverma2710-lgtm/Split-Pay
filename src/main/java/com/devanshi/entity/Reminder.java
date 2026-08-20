package com.devanshi.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "reminders")
public class Reminder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @ManyToOne
    @JoinColumn(name = "reminded_user_id", nullable = false)
    private User remindedUser;

    private LocalDateTime createdAt;

    private LocalDateTime nextReminderAt;

    private LocalDateTime lastReminderAt;

    private boolean sent;

    public Reminder() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Payment getPayment() {
        return payment;
    }

    public void setPayment(Payment payment) {
        this.payment = payment;
    }

    public User getRemindedUser() {
        return remindedUser;
    }

    public void setRemindedUser(User remindedUser) {
        this.remindedUser = remindedUser;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isSent() {
        return sent;
    }

    public void setSent(boolean sent) {
        this.sent = sent;
    }

    public LocalDateTime getNextReminderAt() {
        return nextReminderAt;
    }

    public void setNextReminderAt(LocalDateTime nextReminderAt) {
        this.nextReminderAt = nextReminderAt;
    }

    public LocalDateTime getLastReminderAt() {
        return lastReminderAt;
    }

    public void setLastReminderAt(LocalDateTime lastReminderAt) {
        this.lastReminderAt = lastReminderAt;
    }
}