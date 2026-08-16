package com.devanshi.repo;

import com.devanshi.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpenseRepo extends JpaRepository<Expense,Integer> {
    List<Expense> findByCategory(String category);
}
