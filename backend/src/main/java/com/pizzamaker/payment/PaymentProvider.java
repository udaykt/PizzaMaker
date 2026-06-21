package com.pizzamaker.payment;

import java.math.BigDecimal;

// Abstraction over the payment gateway. The app codes against this; swapping the
// StubPaymentProvider for a StripePaymentProvider (calling the Stripe API) is a
// single-bean change with no impact on PaymentService.
public interface PaymentProvider {

    String name();

    // Creates a payment intent and returns its id plus the client secret the
    // frontend would use to confirm the charge.
    PaymentIntent createIntent(String orderOid, BigDecimal amount, String currency);

    record PaymentIntent(String intentId, String clientSecret) {}
}
