package com.devanshi.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class SplitExpenseRequest {

    @NotNull
    private String title;

    @NotNull
    private BigDecimal amount;

    @NotNull
    private String category;

    private String note;

    @NotNull
    private LocalDate date;

    @NotNull
    private Integer groupId;

    @NotNull
    private Integer paidBy;

    @Valid
    private List<ExpenseShareRequest> shares;

    public SplitExpenseRequest() {
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

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
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

    public Integer getGroupId() {
        return groupId;
    }

    public void setGroupId(Integer groupId) {
        this.groupId = groupId;
    }

    public Integer getPaidBy() {
        return paidBy;
    }

    public void setPaidBy(Integer paidBy) {
        this.paidBy = paidBy;
    }

    public List<ExpenseShareRequest> getShares() {
        return shares;
    }

    public void setShares(List<ExpenseShareRequest> shares) {
        this.shares = shares;
    }
}