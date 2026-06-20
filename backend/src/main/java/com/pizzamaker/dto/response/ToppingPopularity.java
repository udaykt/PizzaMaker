package com.pizzamaker.dto.response;

import java.math.BigDecimal;

// How often a topping has been ordered and the revenue it has driven, ranked
// across all orders' line items.
public record ToppingPopularity(
        String toppingId,
        long timesOrdered,
        BigDecimal revenue
) {}
