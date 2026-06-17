package com.pizzamaker.dto.request;

import com.pizzamaker.entity.BakeLevel;
import com.pizzamaker.entity.CrustStyle;
import com.pizzamaker.entity.DeliveryMethod;
import com.pizzamaker.entity.PizzaSize;
import com.pizzamaker.entity.SauceType;
import com.pizzamaker.entity.ToppingSelection;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record OrderRequest(
        SauceType sauceType,
        boolean mozzarella,
        boolean provolone,
        boolean feta,
        boolean veganCheese,
        @Valid List<ToppingSelection> toppings,
        @NotNull PizzaSize pizzaSize,
        CrustStyle crustStyle,
        BakeLevel bakeLevel,
        DeliveryMethod deliveryMethod
) {}
