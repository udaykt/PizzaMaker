package com.pizzamaker.controller;

import com.pizzamaker.dto.request.GuestRegisterRequest;
import com.pizzamaker.dto.request.LoginRequest;
import com.pizzamaker.dto.request.RegisterRequest;
import com.pizzamaker.dto.response.AuthResponse;
import com.pizzamaker.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a new standard user")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    @Operation(summary = "Login and receive JWT")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/guest")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a guest user (no password)")
    public AuthResponse guestRegister(@Valid @RequestBody GuestRegisterRequest request) {
        return authService.guestRegister(request);
    }
}
