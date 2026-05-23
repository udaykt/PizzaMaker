package com.pizzamaker.dto.request;

import com.pizzamaker.entity.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(@NotNull OrderStatus status) {}
