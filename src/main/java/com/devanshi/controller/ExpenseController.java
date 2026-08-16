package com.devanshi.controller;

import com.devanshi.entity.Expense;
import com.devanshi.exception.ExpenseNotFoundException;
import com.devanshi.repo.ExpenseRepo;
import com.devanshi.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Expense> getExpenseById(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                expenseService.getExpenseById(id)
        );
    }

    @GetMapping
    public ResponseEntity<List<Expense>> getAllExpenses() {

        return ResponseEntity.ok(
                expenseService.getAllExpenses()
        );
    }

    @PostMapping
    public ResponseEntity<Expense> addExpense(
            @Valid @RequestBody Expense expense) {

        return new ResponseEntity<>(
                expenseService.addExpense(expense),
                HttpStatus.CREATED
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Expense> updateExpense(
            @PathVariable Integer id,
            @Valid @RequestBody Expense expense) {

        expense.setId(id);

        return ResponseEntity.ok(
                expenseService.updateExpense(expense)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteExpense(
            @PathVariable Integer id) {

        expenseService.deleteExpense(id);

        return ResponseEntity.ok(
                "Expense deleted successfully"
        );
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<Expense>> getExpensesByCategory(
            @PathVariable String category) {

        return ResponseEntity.ok(
                expenseService.getExpensesByCategory(category)
        );
    }
}