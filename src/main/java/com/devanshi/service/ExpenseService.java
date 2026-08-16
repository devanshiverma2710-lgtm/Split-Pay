package com.devanshi.service;

import com.devanshi.entity.Expense;
import com.devanshi.repo.ExpenseRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ExpenseService {
    @Autowired
    ExpenseRepo expenseRepo;

    public List<Expense> getAllExpenses(){
        return expenseRepo.findAll();
    }

    public Expense getExpenseById(Integer id) {
        return expenseRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id: " + id));
    }

    public Expense addExpense(Expense expense){
        return expenseRepo.save(expense);
    }

    public Expense updateExpense(Expense expense) {

        Expense existingExpense = expenseRepo.findById(expense.getId())
                .orElseThrow(() -> new RuntimeException("Expense not found"));

        existingExpense.setCategory(expense.getCategory());
        existingExpense.setAmount(expense.getAmount());
        existingExpense.setNote(expense.getNote());
        existingExpense.setDate(expense.getDate());

        return expenseRepo.save(existingExpense);
    }

    public void deleteExpense(Integer id) {
        if (expenseRepo.existsById(id)) {
            expenseRepo.deleteById(id);
        } else {
            throw new RuntimeException("Expense not found with id: " + id);
        }

    }

    public List<Expense> getExpensesByCategory(String category){
        return expenseRepo.findByCategory(category);
    }
}
