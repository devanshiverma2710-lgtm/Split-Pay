package com.devanshi.controller;

import com.devanshi.entity.Expense;
import com.devanshi.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.devanshi.dto.ExpenseDTO;

import java.util.List;

@RestController
@RequestMapping("/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseDTO> getExpenseById(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                expenseService.getExpenseById(id)
        );
    }

    @GetMapping
    public ResponseEntity<List<ExpenseDTO>> getAllExpenses() {

        return ResponseEntity.ok(
                expenseService.getAllExpenses()
        );
    }

    @PostMapping
    public ResponseEntity<ExpenseDTO> addExpense(
            @Valid @RequestBody ExpenseDTO expenseDTO) {

        return new ResponseEntity<>(
                expenseService.addExpense(expenseDTO),
                HttpStatus.CREATED
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseDTO> updateExpense(
            @PathVariable Integer id,
            @Valid @RequestBody ExpenseDTO expenseDTO) {

        return ResponseEntity.ok(
                expenseService.updateExpense(id, expenseDTO)
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