package com.pizzamaker.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank String firstName,
        @NotBlank @Email String emailId,
        @NotBlank @Size(min = 6) String password
) {}
