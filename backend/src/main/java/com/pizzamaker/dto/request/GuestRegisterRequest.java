package com.pizzamaker.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record GuestRegisterRequest(
        @NotBlank String firstName,
        @NotBlank @Email String emailId
) {}
