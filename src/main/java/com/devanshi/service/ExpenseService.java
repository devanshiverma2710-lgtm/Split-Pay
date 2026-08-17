package com.devanshi.service;

import com.devanshi.dto.ExpenseDTO;
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

    public List<ExpenseDTO> getAllExpenses() {
        return expenseRepo.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    public ExpenseDTO getExpenseById(Integer id) {

        Expense expense = expenseRepo.findById(id)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "Expense not found with id: " + id
                        ));

        return convertToDTO(expense);
    }
    public ExpenseDTO addExpense(ExpenseDTO dto) {

        Expense expense = convertToEntity(dto);

        Expense savedExpense = expenseRepo.save(expense);

        return convertToDTO(savedExpense);
    }

    public ExpenseDTO updateExpense(Integer id, ExpenseDTO dto) {

        Expense existingExpense = expenseRepo.findById(id)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "Expense not found with id: " + id
                        ));

        existingExpense.setTitle(dto.getTitle());
        existingExpense.setCategory(dto.getCategory());
        existingExpense.setAmount(dto.getAmount());
        existingExpense.setNote(dto.getNote());
        existingExpense.setDate(dto.getDate());

        Expense updatedExpense = expenseRepo.save(existingExpense);

        return convertToDTO(updatedExpense);
    }

    public void deleteExpense(Integer id) {

        if (!expenseRepo.existsById(id)) {
            throw new ExpenseNotFoundException(
                    "Expense not found with id: " + id
            );
        }

        expenseRepo.deleteById(id);
    }

    public List<Expense> getExpensesByCategory(String category){
        return expenseRepo.findByCategory(category);
    }

    private Expense convertToEntity(ExpenseDTO dto) {

        Expense expense = new Expense();

        expense.setTitle(dto.getTitle());
        expense.setCategory(dto.getCategory());
        expense.setAmount(dto.getAmount());
        expense.setNote(dto.getNote());
        expense.setDate(dto.getDate());

        return expense;
    }

    private ExpenseDTO convertToDTO(Expense expense) {

        ExpenseDTO dto = new ExpenseDTO();

        dto.setTitle(expense.getTitle());
        dto.setCategory(expense.getCategory());
        dto.setAmount(expense.getAmount());
        dto.setNote(expense.getNote());
        dto.setDate(expense.getDate());

        return dto;
    }
}
