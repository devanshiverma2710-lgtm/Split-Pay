package com.devanshi.service;

import com.devanshi.entity.Expense;
import com.devanshi.exception.ExpenseNotFoundException;
import com.devanshi.repo.ExpenseRepo;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ExpenseService {
    private final ExpenseRepo expenseRepo;

    public ExpenseService(ExpenseRepo expenseRepo) {
        this.expenseRepo = expenseRepo;
    }

    public List<Expense> getAllExpenses(){
        return expenseRepo.findAll();
    }

    public Expense getExpenseById(Integer id) {
        return expenseRepo.findById(id)
                .orElseThrow(() -> new ExpenseNotFoundException("Expense not found with id: " + id));
    }

    public Expense addExpense(Expense expense){
        return expenseRepo.save(expense);
    }

    public Expense updateExpense(Expense expense) {

        Expense existingExpense = expenseRepo.findById(expense.getId())
                .orElseThrow(() -> new ExpenseNotFoundException("Expense not found"));

        existingExpense.setTitle(expense.getTitle());
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
            throw new ExpenseNotFoundException("Expense not found with id: " + id);
        }

    }

    public List<Expense> getExpensesByCategory(String category){
        return expenseRepo.findByCategory(category);
    }
}
