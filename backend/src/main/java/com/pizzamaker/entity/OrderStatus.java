package com.pizzamaker.entity;

import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public enum OrderStatus {
    PENDING, CONFIRMED, PREPARING, READY, DELIVERED;

    // Explicit transition table instead of relying on enum ordinal order, which
    // would silently break if the constants were reordered and can't express
    // branches (e.g. a future CANCELLED reachable from several states). Today
    // the lifecycle is strictly linear and forward-only.
    private static final Map<OrderStatus, Set<OrderStatus>> ALLOWED = Map.of(
            PENDING,   EnumSet.of(CONFIRMED),
            CONFIRMED, EnumSet.of(PREPARING),
            PREPARING, EnumSet.of(READY),
            READY,     EnumSet.of(DELIVERED),
            DELIVERED, EnumSet.noneOf(OrderStatus.class)
    );

    public boolean canTransitionTo(OrderStatus next) {
        return next != null && ALLOWED.getOrDefault(this, Set.of()).contains(next);
    }
}
