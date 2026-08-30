package com.devanshi.controller;

import com.devanshi.dto.PaymentDTO;
import com.devanshi.dto.UPIPaymentDTO;
import com.devanshi.entity.Payment;
import com.devanshi.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/payments")
public class PaymentController {

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @GetMapping
    public ResponseEntity<List<PaymentDTO>> getAllPayments() {
        return ResponseEntity.ok(
                paymentService.getAllPaymentDTOs()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentDTO> getPaymentById(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                paymentService.getPaymentDTOById(id)
        );
    }

    @PostMapping("/{groupId}/{fromUserId}/{toUserId}")
    public ResponseEntity<Payment> createPayment(
            @PathVariable Integer groupId,
            @PathVariable Integer fromUserId,
            @PathVariable Integer toUserId,
            @Valid @RequestBody Payment payment) {

        return new ResponseEntity<>(
                paymentService.createPayment(
                        groupId,
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
    public ResponseEntity<List<PaymentDTO>> getPendingPayments() {

        return ResponseEntity.ok(
                paymentService.getPendingPaymentDTOs()
        );
    }
    @GetMapping("/{id}/upi")
    public ResponseEntity<UPIPaymentDTO> generateUPIPaymentLink(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                paymentService.generateUPIPaymentLink(id)
        );
    }
    @PostMapping("/from-settlement")
    public ResponseEntity<Payment> createPaymentFromSettlement(
            @RequestParam Integer groupId,
            @RequestParam Integer fromUserId,
            @RequestParam Integer toUserId,
            @RequestParam BigDecimal amount) {

        return new ResponseEntity<>(
                paymentService.createPaymentFromSettlement(
                        groupId,
                        fromUserId,
                        toUserId,
                        amount
                ),
                HttpStatus.CREATED
        );
    }

}