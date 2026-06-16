package com.pizzamaker.dto.request;

import com.pizzamaker.entity.BakeLevel;
import com.pizzamaker.entity.CrustStyle;
import com.pizzamaker.entity.DeliveryMethod;
import com.pizzamaker.entity.PizzaSize;
import com.pizzamaker.entity.SauceType;
import com.pizzamaker.entity.ToppingQuantity;
import jakarta.validation.constraints.NotNull;

public record OrderRequest(
        SauceType sauceType,
        boolean mozzarella,
        boolean provolone,
        boolean feta,
        boolean veganCheese,
        boolean pepperoni,
        ToppingQuantity pepperoniQuantity,
        boolean sausage,
        ToppingQuantity sausageQuantity,
        boolean peppers,
        ToppingQuantity peppersQuantity,
        boolean olives,
        ToppingQuantity olivesQuantity,
        @NotNull PizzaSize pizzaSize,
        CrustStyle crustStyle,
        BakeLevel bakeLevel,
        DeliveryMethod deliveryMethod
) {}
