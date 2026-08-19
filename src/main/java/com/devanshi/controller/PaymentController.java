package com.devanshi.controller;

import com.devanshi.entity.Payment;
import com.devanshi.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<List<Payment>> getAllPayments() {
        return ResponseEntity.ok(
                paymentService.getAllPayments()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getPaymentById(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                paymentService.getPaymentById(id)
        );
    }

    @PostMapping("/{fromUserId}/{toUserId}")
    public ResponseEntity<Payment> createPayment(
            @PathVariable Integer fromUserId,
            @PathVariable Integer toUserId,
            @Valid @RequestBody Payment payment) {

        return new ResponseEntity<>(
                paymentService.createPayment(
                        fromUserId,
                        toUserId,
                        payment
                ),
                HttpStatus.CREATED
        );
    }

    @PutMapping("/{id}/paid")
    public ResponseEntity<Payment> markPaymentAsPaid(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                paymentService.markPaymentAsPaid(id)
        );
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Payment>> getPendingPayments() {
        return ResponseEntity.ok(
                paymentService.getPendingPayments()
        );
    }
}