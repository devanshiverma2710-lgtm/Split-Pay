package com.devanshi.dto;

import java.math.BigDecimal;

public class BalanceDTO {

    private Integer userId;
    private String userName;
    private BigDecimal balance;

    public BalanceDTO() {
    }

    public BalanceDTO(Integer userId, String userName, BigDecimal balance) {
        this.userId = userId;
        this.userName = userName;
        this.balance = balance;
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

    public BigDecimal getBalance() {
        return balance;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }
}