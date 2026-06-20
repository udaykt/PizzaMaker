package com.pizzamaker.event;

import com.pizzamaker.entity.OrderStatus;

// Published after an order's status transition is persisted. The real-time push
// to the owning user is delivered only on commit (see OrderEventListener).
public record OrderStatusChangedEvent(String email, String oid, String uid, OrderStatus status) {}
