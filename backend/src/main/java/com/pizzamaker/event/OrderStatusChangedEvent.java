package com.pizzamaker.event;

import com.pizzamaker.entity.OrderStatus;

// Outbox payload for an order status transition. Persisted to outbox_event in
// the same transaction as the status change and delivered as a real-time push
// to the owning user by OutboxDispatcher.
public record OrderStatusChangedEvent(String email, String oid, String uid, OrderStatus status) {}
