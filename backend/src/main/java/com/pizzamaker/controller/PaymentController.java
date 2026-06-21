package com.pizzamaker.controller;

import com.pizzamaker.dto.response.PaymentResponse;
import com.pizzamaker.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders/{oid}/pay")
@RequiredArgsConstructor
@Tag(name = "Payments")
@SecurityRequirement(name = "BearerAuth")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a payment intent for an order")
    public PaymentResponse pay(@AuthenticationPrincipal UserDetails user, @PathVariable String oid) {
        return paymentService.createIntent(user.getUsername(), oid);
    }
}
