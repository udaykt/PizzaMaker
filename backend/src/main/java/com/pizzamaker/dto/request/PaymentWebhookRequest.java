package com.pizzamaker.dto.request;

// Minimal payment webhook envelope: the event type and the intent it concerns.
public record PaymentWebhookRequest(String type, String intentId) {}
