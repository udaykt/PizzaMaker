package com.pizzamaker.config;

import com.pizzamaker.security.AuthRateLimitFilter;
import com.pizzamaker.security.JwtAuthenticationFilter;
import com.pizzamaker.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final UserDetailsServiceImpl userDetailsService;
    private final AuthRateLimitFilter rateLimitFilter;
    private final Environment environment;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");

        var auth = http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(h -> h.frameOptions(fo -> fo.sameOrigin()))
                .authorizeHttpRequests(req -> {
                    req.requestMatchers("/api/v1/auth/**").permitAll();
                    req.requestMatchers(HttpMethod.GET, "/api/v1/menu/**").permitAll();
                    req.requestMatchers("/actuator/health", "/actuator/info").permitAll();
                    req.requestMatchers("/actuator/**").hasRole("ADMIN");
                    req.requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll();
                    // H2 console is only open in non-prod profiles
                    if (!isProd) {
                        req.requestMatchers("/h2-console/**").permitAll();
                    }
                    req.requestMatchers("/ws/**").permitAll();
                    req.requestMatchers(HttpMethod.GET, "/api/v1/orders").hasRole("ADMIN");
                    req.requestMatchers(HttpMethod.PUT, "/api/v1/orders/*/status").hasRole("ADMIN");
                    req.anyRequest().authenticated();
                });

        return http
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, exc) ->
                                res.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized")))
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        var provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Prevent Spring Boot from registering AuthRateLimitFilter as a raw servlet filter —
    // it is already wired into the security chain above.
    @Bean
    public FilterRegistrationBean<AuthRateLimitFilter> rateLimitFilterRegistration() {
        var reg = new FilterRegistrationBean<>(rateLimitFilter);
        reg.setEnabled(false);
        return reg;
    }

    // Prevent Spring Boot from registering JwtAuthenticationFilter as a raw servlet filter —
    // it is already wired into the security chain above.
    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> jwtFilterRegistration() {
        var reg = new FilterRegistrationBean<>(jwtFilter);
        reg.setEnabled(false);
        return reg;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        var config = new CorsConfiguration();
        String allowedOriginsEnv = System.getenv("ALLOWED_ORIGINS");
        List<String> origins = (allowedOriginsEnv != null && !allowedOriginsEnv.isBlank())
                ? List.of(allowedOriginsEnv.split(","))
                : List.of("http://localhost:3000");
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "Authorization"));
        config.setAllowCredentials(true);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        source.registerCorsConfiguration("/ws/**", config);
        return source;
    }
}
