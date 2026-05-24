package com.pizzamaker.init;

import com.pizzamaker.entity.Role;
import com.pizzamaker.entity.User;
import com.pizzamaker.entity.UserType;
import com.pizzamaker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.existsByEmailId("admin@pizzamaker.com")) {
            return;
        }
        User admin = User.builder()
                .uid(UUID.randomUUID().toString())
                .firstName("Admin")
                .emailId("admin@pizzamaker.com")
                .passwordHash(passwordEncoder.encode("admin123"))
                .userType(UserType.ADMIN)
                .role(Role.ROLE_ADMIN)
                .build();
        userRepository.save(admin);
        log.info("Admin user seeded.");
    }
}
