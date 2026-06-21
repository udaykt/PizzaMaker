package com.pizzamaker.dto.response;

import com.pizzamaker.entity.Payment;

import java.math.BigDecimal;

// What the client needs to drive the payment: the intent id, the client secret
// it would confirm with, and the current status.
public record PaymentResponse(
        String intentId,
        String clientSecret,
        BigDecimal amount,
        String currency,
        String status
) {
    public static PaymentResponse of(Payment payment, String clientSecret) {
        return new PaymentResponse(
                payment.getIntentId(),
                clientSecret,
                payment.getAmount(),
                payment.getCurrency(),
                payment.getStatus().name());
    }
}
