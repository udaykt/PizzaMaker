package com.pizzamaker.entity;

import jakarta.validation.constraints.NotNull;

// One selected topping on an order: which topping (id, matching the frontend
// catalog and ToppingCatalog.IDS) and how much of it. Persisted as part of the
// order's JSON toppings list, so adding a topping needs no schema change.
public record ToppingSelection(
        @NotNull String id,
        ToppingQuantity quantity
) {}
