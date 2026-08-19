package com.devanshi.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "group_id")
    private Group group;

    @ManyToOne
    @JoinColumn(name = "paid_by")
    private User paidBy;

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than 0")
    private BigDecimal amount;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "note is required")
    private String note;

    @NotNull(message = "Date is required")
    private LocalDate date;
}
