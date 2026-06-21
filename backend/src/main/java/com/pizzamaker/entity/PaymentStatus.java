package com.pizzamaker.entity;

// Mirrors the slice of Stripe's PaymentIntent lifecycle this app cares about.
public enum PaymentStatus {
    REQUIRES_PAYMENT, SUCCEEDED, FAILED
}
