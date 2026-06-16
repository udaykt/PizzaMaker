package com.pizzamaker.dto.response;

import com.pizzamaker.entity.BakeLevel;
import com.pizzamaker.entity.CrustStyle;
import com.pizzamaker.entity.DeliveryMethod;
import com.pizzamaker.entity.OrderStatus;
import com.pizzamaker.entity.PizzaSize;
import com.pizzamaker.entity.SauceType;
import com.pizzamaker.entity.ToppingQuantity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

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
            ToppingQuantity olivesQuantity
    ) {}
}
