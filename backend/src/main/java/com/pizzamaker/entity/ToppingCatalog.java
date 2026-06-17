package com.pizzamaker.entity;

import java.util.Set;

// The toppings the kitchen can actually make. Server-side allow-list so a
// tampered request can't inject unknown toppings. Adding a topping is one entry
// here (plus the matching art entry in the frontend) — this is the backend seed
// that a future catalog table would replace.
public final class ToppingCatalog {

    private ToppingCatalog() {}

    public static final Set<String> IDS = Set.of("pepperoni", "sausage", "peppers", "olives");
}
