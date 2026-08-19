package com.devanshi.repo;

import com.devanshi.entity.ExpenseShare;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseShareRepo extends JpaRepository<ExpenseShare, Integer> {

    List<ExpenseShare> findByExpenseId(Integer expenseId);

    List<ExpenseShare> findByUserId(Integer userId);
}