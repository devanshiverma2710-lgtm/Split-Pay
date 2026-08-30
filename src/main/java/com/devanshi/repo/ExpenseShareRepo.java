package com.devanshi.repo;

import com.devanshi.entity.ExpenseShare;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExpenseShareRepo extends JpaRepository<ExpenseShare, Integer> {

    List<ExpenseShare> findByExpenseGroupId(Integer groupId);

    Optional<ExpenseShare> findByExpenseIdAndUserId(
            Integer expenseId,
            Integer userId
    );
}