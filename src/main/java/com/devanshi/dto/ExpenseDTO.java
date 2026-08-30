package com.devanshi.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenseDTO {

    private Integer id;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "title is required")
    private String title;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than 0")
    private BigDecimal amount;

    private String note;


    private LocalDate date;

    private boolean groupExpense;
    private Integer groupId;
    private BigDecimal userShare;

    public String getCategory() {
        return category;
    }
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }
    public boolean isGroupExpense() {
        return groupExpense;
    }

    public void setGroupExpense(boolean groupExpense) {
        this.groupExpense = groupExpense;
    }

    public Integer getGroupId() {
        return groupId;
    }

    public void setGroupId(Integer groupId) {
        this.groupId = groupId;
    }

    public BigDecimal getUserShare() {
        return userShare;
    }

    public void setUserShare(BigDecimal userShare) {
        this.userShare = userShare;
    }
}

