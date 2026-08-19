package com.devanshi.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public class ExpenseShareRequest {

    @NotNull
    private Integer userId;

    @NotNull
    @Positive
    private BigDecimal amount;

    public ExpenseShareRequest() {
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}