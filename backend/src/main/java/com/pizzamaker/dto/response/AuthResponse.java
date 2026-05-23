package com.pizzamaker.dto.response;

import com.pizzamaker.entity.UserType;

public record AuthResponse(
        String token,
        String type,
        String uid,
        String firstName,
        UserType userType
) {
    public AuthResponse(String token, String uid, String firstName, UserType userType) {
        this(token, "Bearer", uid, firstName, userType);
    }
}
