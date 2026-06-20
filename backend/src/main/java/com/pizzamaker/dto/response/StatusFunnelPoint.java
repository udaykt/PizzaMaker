package com.pizzamaker.dto.response;

import com.pizzamaker.entity.OrderStatus;

// Count of orders currently sitting in each status — the kitchen funnel.
public record StatusFunnelPoint(
        OrderStatus status,
        long count
) {}
