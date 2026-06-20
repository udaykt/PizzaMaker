package com.pizzamaker.mapper;

import com.pizzamaker.dto.response.OrderResponse;
import com.pizzamaker.entity.Order;
import com.pizzamaker.entity.OrderLineItem;

import java.util.List;

public final class OrderMapper {

    private OrderMapper() {}

    public static OrderResponse toResponse(Order order) {
        return toResponse(order, null);
    }

    public static OrderResponse toResponse(Order order, List<OrderLineItem> lineItems) {
        var ingredients = new OrderResponse.Ingredients(
                order.getSauceType(),
                order.isMozzarella(),
                order.isCheddar(),
                order.isParmesanAsiago(),
                order.isFeta(),
                order.isRicotta(),
                order.isVeganCheese(),
                order.getToppings()
        );
        List<OrderResponse.LineItem> items = lineItems == null ? null : lineItems.stream()
                .map(li -> new OrderResponse.LineItem(li.getLineType().name(), li.getLabel(), li.getAmount()))
                .toList();
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
                order.getCreatedAt(),
                items
        );
    }
}
