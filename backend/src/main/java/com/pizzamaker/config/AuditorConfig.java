package com.pizzamaker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

// Supplies the principal for @CreatedBy/@LastModifiedBy. Returns empty for
// unauthenticated/system writes (e.g. the DataSeeder), which leaves the audit
// columns null rather than inventing an author.
@Configuration
public class AuditorConfig {

    @Bean
    public AuditorAware<String> auditorProvider() {
        return () -> {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
                return Optional.empty();
            }
            return Optional.ofNullable(auth.getName());
        };
    }
}
