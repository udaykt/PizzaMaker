package com.pizzamaker.payment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

// Default provider: mints Stripe-shaped intent ids locally so the full flow
// (create intent -> webhook -> order confirmed) is exercisable without external
// credentials. A real StripePaymentProvider would implement this same interface
// by calling PaymentIntent.create(...) and would be selected via @Primary/profile.
@Component
@Slf4j
public class StubPaymentProvider implements PaymentProvider {

    @Override
    public String name() {
        return "stub";
    }

    @Override
    public PaymentIntent createIntent(String orderOid, BigDecimal amount, String currency) {
        String intentId = "pi_" + UUID.randomUUID().toString().replace("-", "");
        String clientSecret = intentId + "_secret_" + UUID.randomUUID().toString().substring(0, 8);
        log.info("Created {} payment intent {} for order {} ({} {})",
                name(), intentId, orderOid, amount, currency);
        return new PaymentIntent(intentId, clientSecret);
    }
}
