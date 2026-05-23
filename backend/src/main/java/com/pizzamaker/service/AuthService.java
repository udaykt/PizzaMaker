package com.pizzamaker.service;

import com.pizzamaker.dto.request.GuestRegisterRequest;
import com.pizzamaker.dto.request.LoginRequest;
import com.pizzamaker.dto.request.RegisterRequest;
import com.pizzamaker.dto.response.AuthResponse;
import com.pizzamaker.entity.Role;
import com.pizzamaker.entity.User;
import com.pizzamaker.entity.UserType;
import com.pizzamaker.exception.DuplicateResourceException;
import com.pizzamaker.exception.ResourceNotFoundException;
import com.pizzamaker.repository.UserRepository;
import com.pizzamaker.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailId(request.emailId())) {
            throw new DuplicateResourceException("Email already registered: " + request.emailId());
        }
        User user = User.builder()
                .uid(UUID.randomUUID().toString())
                .firstName(request.firstName())
                .emailId(request.emailId())
                .passwordHash(passwordEncoder.encode(request.password()))
                .userType(UserType.STANDARD)
                .role(Role.ROLE_USER)
                .build();
        userRepository.save(user);
        String token = jwtTokenProvider.generateToken(user.getEmailId());
        return new AuthResponse(token, user.getUid(), user.getFirstName(), user.getUserType());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailId(request.emailId())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid credentials"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new ResourceNotFoundException("Invalid credentials");
        }
        String token = jwtTokenProvider.generateToken(user.getEmailId());
        return new AuthResponse(token, user.getUid(), user.getFirstName(), user.getUserType());
    }

    public AuthResponse guestRegister(GuestRegisterRequest request) {
        if (userRepository.existsByEmailId(request.emailId())) {
            throw new DuplicateResourceException("Email already registered: " + request.emailId());
        }
        User user = User.builder()
                .uid(UUID.randomUUID().toString())
                .firstName(request.firstName())
                .emailId(request.emailId())
                .userType(UserType.GUEST)
                .role(Role.ROLE_USER)
                .build();
        userRepository.save(user);
        String token = jwtTokenProvider.generateToken(user.getEmailId());
        return new AuthResponse(token, user.getUid(), user.getFirstName(), user.getUserType());
    }
}
