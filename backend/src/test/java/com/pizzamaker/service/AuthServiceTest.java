package com.pizzamaker.service;

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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock JwtTokenProvider jwtTokenProvider;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks AuthService authService;

    @Test
    void register_success() {
        var req = new RegisterRequest("Alice", "alice@example.com", "secret123");
        when(userRepository.existsByEmailId("alice@example.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jwtTokenProvider.generateToken("alice@example.com")).thenReturn("token123");

        AuthResponse resp = authService.register(req);

        assertThat(resp.token()).isEqualTo("token123");
        assertThat(resp.firstName()).isEqualTo("Alice");
        assertThat(resp.userType()).isEqualTo(UserType.STANDARD);
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        var req = new RegisterRequest("Alice", "alice@example.com", "secret123");
        when(userRepository.existsByEmailId("alice@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("alice@example.com");
    }

    @Test
    void login_success() {
        User user = User.builder()
                .uid(UUID.randomUUID().toString())
                .firstName("Alice")
                .emailId("alice@example.com")
                .passwordHash("hashed")
                .userType(UserType.STANDARD)
                .role(Role.ROLE_USER)
                .build();
        when(userRepository.findByEmailId("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret123", "hashed")).thenReturn(true);
        when(jwtTokenProvider.generateToken("alice@example.com")).thenReturn("token456");

        AuthResponse resp = authService.login(new LoginRequest("alice@example.com", "secret123"));

        assertThat(resp.token()).isEqualTo("token456");
    }

    @Test
    void login_wrongPassword_throws() {
        User user = User.builder()
                .uid(UUID.randomUUID().toString())
                .firstName("Alice")
                .emailId("alice@example.com")
                .passwordHash("hashed")
                .userType(UserType.STANDARD)
                .role(Role.ROLE_USER)
                .build();
        when(userRepository.findByEmailId("alice@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest("alice@example.com", "wrong")))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
