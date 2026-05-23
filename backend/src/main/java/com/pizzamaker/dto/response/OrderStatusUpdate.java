package com.pizzamaker.dto.response;

import com.pizzamaker.entity.OrderStatus;

public record OrderStatusUpdate(String oid, String userUid, OrderStatus status) {}
