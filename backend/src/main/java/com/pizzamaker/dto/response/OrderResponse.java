package com.pizzamaker.dto.response;

import com.pizzamaker.entity.BakeLevel;
import com.pizzamaker.entity.CrustStyle;
import com.pizzamaker.entity.OrderStatus;
import com.pizzamaker.entity.PizzaSize;

import java.time.LocalDateTime;

public record OrderResponse(
        String oid,
        String userEmail,
        Ingredients ingredients,
        PizzaSize pizzaSize,
        CrustStyle crustStyle,
        BakeLevel bakeLevel,
        OrderStatus status,
        LocalDateTime createdAt
) {
    public record Ingredients(
            boolean sauce,
            boolean mozzarella,
            boolean cheese,
            boolean pepperoni,
            boolean pepperoniMedium,
            boolean sausage,
            boolean sausageMedium,
            boolean peppers,
            boolean peppersMedium,
            boolean olives,
            boolean olivesMedium
    ) {}
}
