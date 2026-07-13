package com.pizzamaker.dto.request;

import com.pizzamaker.entity.BakeLevel;
import com.pizzamaker.entity.CrustStyle;
import com.pizzamaker.entity.DeliveryMethod;
import com.pizzamaker.entity.PizzaSize;
import com.pizzamaker.entity.SauceType;
import com.pizzamaker.entity.ToppingSelection;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record OrderRequest(
        // Optional — the customer's own name for their pizza. When absent, the
        // client derives a name from the composition instead. Bounded so a title
        // can't be used to smuggle in an essay.
        @Size(max = 40, message = "Pizza name must be 40 characters or fewer")
        String pizzaName,

        SauceType sauceType,
        boolean mozzarella,
        boolean cheddar,
        boolean parmesanAsiago,
        boolean feta,
        boolean ricotta,
        boolean veganCheese,
        @Valid List<ToppingSelection> toppings,
        @NotNull PizzaSize pizzaSize,
        CrustStyle crustStyle,
        BakeLevel bakeLevel,
        DeliveryMethod deliveryMethod
) {}
