package com.pizzamaker.dto.response;

import com.pizzamaker.entity.BakeLevel;
import com.pizzamaker.entity.CrustStyle;
import com.pizzamaker.entity.DeliveryMethod;
import com.pizzamaker.entity.OrderStatus;
import com.pizzamaker.entity.PizzaSize;
import com.pizzamaker.entity.SauceType;
import com.pizzamaker.entity.ToppingSelection;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        String oid,
        String userEmail,
        Ingredients ingredients,
        PizzaSize pizzaSize,
        CrustStyle crustStyle,
        BakeLevel bakeLevel,
        DeliveryMethod deliveryMethod,
        BigDecimal price,
        OrderStatus status,
        LocalDateTime createdAt
) {
    public record Ingredients(
            SauceType sauceType,
            boolean mozzarella,
            boolean cheddar,
            boolean parmesanAsiago,
            boolean feta,
            boolean ricotta,
            boolean veganCheese,
            List<ToppingSelection> toppings
    ) {}
}
