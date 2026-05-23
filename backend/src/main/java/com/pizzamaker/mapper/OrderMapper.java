package com.pizzamaker.mapper;

import com.pizzamaker.dto.response.OrderResponse;
import com.pizzamaker.entity.Order;

public final class OrderMapper {

    private OrderMapper() {}

    public static OrderResponse toResponse(Order order) {
        var ingredients = new OrderResponse.Ingredients(
                order.isSauce(),
                order.isMozzarella(),
                order.isCheese(),
                order.isPepperoni(),
                order.isPepperoniMedium(),
                order.isSausage(),
                order.isSausageMedium(),
                order.isPeppers(),
                order.isPeppersMedium(),
                order.isOlives(),
                order.isOlivesMedium()
        );
        return new OrderResponse(
                order.getOid(),
                order.getUser().getEmailId(),
                ingredients,
                order.getPizzaSize(),
                order.getStatus(),
                order.getCreatedAt()
        );
    }
}
