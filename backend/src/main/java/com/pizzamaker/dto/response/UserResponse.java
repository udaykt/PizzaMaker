package com.pizzamaker.dto.response;

import com.pizzamaker.entity.UserType;

import java.time.LocalDateTime;

public record UserResponse(
        String uid,
        String firstName,
        String emailId,
        UserType userType,
        LocalDateTime createdAt
) {}
