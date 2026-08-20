package com.devanshi.dto;

import com.devanshi.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentDTO {

    private Integer paymentId;

    private Integer fromUserId;
    private String fromUserName;

    private Integer toUserId;
    private String toUserName;
    private String upiId;

    private BigDecimal amount;

    private PaymentStatus status;

    private LocalDateTime paidAt;

    private String upiLink;

    public PaymentDTO() {
    }

    public PaymentDTO(Integer paymentId,
                      Integer fromUserId,
                      String fromUserName,
                      Integer toUserId,
                      String toUserName,
                      String upiId,
                      BigDecimal amount,
                      PaymentStatus status,
                      LocalDateTime paidAt,
                      String upiLink) {

        this.paymentId = paymentId;
        this.fromUserId = fromUserId;
        this.fromUserName = fromUserName;
        this.toUserId = toUserId;
        this.toUserName = toUserName;
        this.upiId = upiId;
        this.amount = amount;
        this.status = status;
        this.paidAt = paidAt;
        this.upiLink = upiLink;
    }

    public Integer getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Integer paymentId) {
        this.paymentId = paymentId;
    }

    public Integer getFromUserId() {
        return fromUserId;
    }

    public void setFromUserId(Integer fromUserId) {
        this.fromUserId = fromUserId;
    }

    public String getFromUserName() {
        return fromUserName;
    }

    public void setFromUserName(String fromUserName) {
        this.fromUserName = fromUserName;
    }

    public Integer getToUserId() {
        return toUserId;
    }

    public void setToUserId(Integer toUserId) {
        this.toUserId = toUserId;
    }

    public String getToUserName() {
        return toUserName;
    }

    public void setToUserName(String toUserName) {
        this.toUserName = toUserName;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
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

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public String getUpiLink() {
        return upiLink;
    }

    public void setUpiLink(String upiLink) {
        this.upiLink = upiLink;
    }
}