package com.devanshi.service;

import com.devanshi.dto.ExpenseDTO;
import com.devanshi.entity.Expense;
import com.devanshi.exception.ExpenseNotFoundException;
import com.devanshi.repo.ExpenseRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

import com.devanshi.dto.ExpenseShareRequest;
import com.devanshi.dto.SplitExpenseRequest;
import com.devanshi.entity.ExpenseShare;
import com.devanshi.entity.Group;
import com.devanshi.entity.User;
import com.devanshi.repo.ExpenseShareRepo;
import com.devanshi.repo.GroupRepo;
import com.devanshi.repo.UserRepo;

import java.math.BigDecimal;

@Service
public class ExpenseService {
    private final ExpenseRepo expenseRepo;

    @Autowired
    private ExpenseShareRepo expenseShareRepo;

    @Autowired
    private GroupRepo groupRepo;

    @Autowired
    private UserRepo userRepo;

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

    public Expense createSplitExpense(SplitExpenseRequest request) {

        // Find group
        Group group = groupRepo.findById(request.getGroupId())
                .orElseThrow(() ->
                        new RuntimeException("Group not found"));

        // Find payer
        User paidBy = userRepo.findById(request.getPaidBy())
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // Create expense
        Expense expense = new Expense();

        expense.setTitle(request.getTitle());
        expense.setAmount(request.getAmount());
        expense.setCategory(request.getCategory());
        expense.setNote(request.getNote());
        expense.setDate(request.getDate());
        expense.setGroup(group);
        expense.setPaidBy(paidBy);

        Expense savedExpense = expenseRepo.save(expense);

        // Save shares
        for (ExpenseShareRequest shareRequest : request.getShares()) {

            User user = userRepo.findById(shareRequest.getUserId())
                    .orElseThrow(() ->
                            new RuntimeException("User not found"));

            ExpenseShare share = new ExpenseShare();

            share.setExpense(savedExpense);
            share.setUser(user);
            share.setAmount(shareRequest.getAmount());

            expenseShareRepo.save(share);
        }

        return savedExpense;
    }
}
