package com.devanshi.dto;

import com.devanshi.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ReminderDTO {

    private Integer reminderId;
    private Integer paymentId;

    private Integer userId;
    private String userName;

    private BigDecimal amount;
    private PaymentStatus status;

    private LocalDateTime createdAt;

    public ReminderDTO() {
    }

    public ReminderDTO(
            Integer reminderId,
            Integer paymentId,
            Integer userId,
            String userName,
            BigDecimal amount,
            PaymentStatus status,
            LocalDateTime createdAt) {

        this.reminderId = reminderId;
        this.paymentId = paymentId;
        this.userId = userId;
        this.userName = userName;
        this.amount = amount;
        this.status = status;
        this.createdAt = createdAt;
    }

    public Integer getReminderId() {
        return reminderId;
    }

    public void setReminderId(Integer reminderId) {
        this.reminderId = reminderId;
    }

    public Integer getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Integer paymentId) {
        this.paymentId = paymentId;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}