package com.pizzamaker.event;

// Outbox payload for a placed order. Serialized into outbox_event within the
// order's transaction (see OrderService.placeOrder) and turned back into the
// confirmation side effect by OutboxDispatcher once the order has committed, so
// a failed notification can never roll back a placed order.
public record OrderPlacedEvent(String email, String oid) {}
