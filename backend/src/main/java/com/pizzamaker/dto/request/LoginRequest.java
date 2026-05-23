package com.pizzamaker.dto.request;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String emailId,
        @NotBlank String password
) {}
