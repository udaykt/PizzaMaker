package com.pizzamaker.dto.response;

import com.pizzamaker.entity.OrderStatus;

public record OrderStatusUpdateResponse(String oid, String userUid, OrderStatus status) {}
