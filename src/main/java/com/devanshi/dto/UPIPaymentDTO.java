package com.devanshi.dto;

import java.math.BigDecimal;

public class UPIPaymentDTO {

    private Integer paymentId;
    private String fromUserName;
    private String toUserName;
    private String upiId;
    private BigDecimal amount;
    private String upiLink;

    public UPIPaymentDTO() {
    }

    public UPIPaymentDTO(Integer paymentId,
                         String fromUserName,
                         String toUserName,
                         String upiId,
                         BigDecimal amount,
                         String upiLink) {
        this.paymentId = paymentId;
        this.fromUserName = fromUserName;
        this.toUserName = toUserName;
        this.upiId = upiId;
        this.amount = amount;
        this.upiLink = upiLink;
    }

    public Integer getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(Integer paymentId) {
        this.paymentId = paymentId;
    }

    public String getFromUserName() {
        return fromUserName;
    }

    public void setFromUserName(String fromUserName) {
        this.fromUserName = fromUserName;
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

    public String getUpiLink() {
        return upiLink;
    }

    public void setUpiLink(String upiLink) {
        this.upiLink = upiLink;
    }
}