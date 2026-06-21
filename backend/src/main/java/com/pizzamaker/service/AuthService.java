package com.pizzamaker.service;

import com.pizzamaker.dto.request.GuestRegisterRequest;
import com.pizzamaker.dto.request.LoginRequest;
import com.pizzamaker.dto.request.RegisterRequest;
import com.pizzamaker.dto.response.AuthResponse;
import com.pizzamaker.entity.Role;
import com.pizzamaker.entity.User;
import com.pizzamaker.entity.UserType;
import com.pizzamaker.exception.DuplicateResourceException;
import com.pizzamaker.exception.InvalidCredentialsException;
import com.pizzamaker.repository.UserRepository;
import com.pizzamaker.security.JwtTokenProvider;
import com.pizzamaker.util.LogSanitizer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.emailId());
        if (userRepository.existsByEmailId(email)) {
            throw new DuplicateResourceException("Email already registered");
        }
        User user = User.builder()
                .uid(UUID.randomUUID().toString())
                .firstName(request.firstName().trim())
                .emailId(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .userType(UserType.STANDARD)
                .role(Role.ROLE_USER)
                .build();
        userRepository.save(user);
        log.info("User registered uid={}", user.getUid());
        String token = jwtTokenProvider.generateToken(user.getEmailId());
        return new AuthResponse(token, user.getUid(), user.getFirstName(), user.getUserType());
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.emailId());
        User user = userRepository.findByEmailId(email)
                .orElseThrow(() -> {
                    // Security event — masked email, never the password or whether the
                    // account exists (the caller gets a generic "Invalid credentials").
                    log.warn("Failed login attempt for {}", LogSanitizer.maskEmail(email));
                    return new InvalidCredentialsException("Invalid credentials");
                });
        // Guest users have no password hash — reject login attempt before BCrypt call
        if (user.getPasswordHash() == null
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            log.warn("Failed login attempt for {}", LogSanitizer.maskEmail(email));
            throw new InvalidCredentialsException("Invalid credentials");
        }
        log.info("User logged in uid={}", user.getUid());
        String token = jwtTokenProvider.generateToken(user.getEmailId());
        return new AuthResponse(token, user.getUid(), user.getFirstName(), user.getUserType());
    }

    @Transactional
    public AuthResponse guestRegister(GuestRegisterRequest request) {
        String email = normalizeEmail(request.emailId());
        if (userRepository.existsByEmailId(email)) {
            throw new DuplicateResourceException("Email already registered");
        }
        User user = User.builder()
                .uid(UUID.randomUUID().toString())
                .firstName(request.firstName().trim())
                .emailId(email)
                .userType(UserType.GUEST)
                .role(Role.ROLE_USER)
                .build();
        userRepository.save(user);
        String token = jwtTokenProvider.generateToken(user.getEmailId());
        return new AuthResponse(token, user.getUid(), user.getFirstName(), user.getUserType());
    }

    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
