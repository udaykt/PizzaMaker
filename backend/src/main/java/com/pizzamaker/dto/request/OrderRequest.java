package com.pizzamaker.dto.request;

import com.pizzamaker.entity.PizzaSize;
import jakarta.validation.constraints.NotNull;

public record OrderRequest(
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
        boolean olivesMedium,
        @NotNull PizzaSize pizzaSize
) {}
