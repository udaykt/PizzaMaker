package com.pizzamaker.mapper;

import com.pizzamaker.dto.response.UserResponse;
import com.pizzamaker.entity.User;

public final class UserMapper {

    private UserMapper() {}

    public static UserResponse toResponse(User user) {
        return new UserResponse(
                user.getUid(),
                user.getFirstName(),
                user.getEmailId(),
                user.getUserType(),
                user.getCreatedAt()
        );
    }
}
