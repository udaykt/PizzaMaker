package com.pizzamaker.event;

// Published after an order is persisted. Side effects (sending the confirmation)
// run only once the transaction commits — see OrderEventListener — so a failed
// notification can never roll back a placed order, and we never notify a
// customer about an order that didn't actually commit.
public record OrderPlacedEvent(String email, String oid) {}
