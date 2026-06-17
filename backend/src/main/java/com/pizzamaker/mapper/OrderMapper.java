package com.pizzamaker.mapper;

import com.pizzamaker.dto.response.OrderResponse;
import com.pizzamaker.entity.Order;

public final class OrderMapper {

    private OrderMapper() {}

    public static OrderResponse toResponse(Order order) {
        var ingredients = new OrderResponse.Ingredients(
                order.getSauceType(),
                order.isMozzarella(),
                order.isProvolone(),
                order.isFeta(),
                order.isVeganCheese(),
                order.getToppings()
        );
        return new OrderResponse(
                order.getOid(),
                order.getUser().getEmailId(),
                ingredients,
                order.getPizzaSize(),
                order.getCrustStyle(),
                order.getBakeLevel(),
                order.getDeliveryMethod(),
                order.getPrice(),
                order.getStatus(),
                order.getCreatedAt()
        );
    }
}
