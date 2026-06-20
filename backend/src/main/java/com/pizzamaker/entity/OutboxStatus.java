package com.pizzamaker.entity;

// Lifecycle of an outbox row. PENDING rows are picked up by the relay; PROCESSED
// rows have been delivered; FAILED rows exhausted their retry budget and need
// operator attention.
public enum OutboxStatus {
    PENDING, PROCESSED, FAILED
}
