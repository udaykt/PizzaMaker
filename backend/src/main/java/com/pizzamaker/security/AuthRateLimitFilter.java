package com.pizzamaker.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class AuthRateLimitFilter extends OncePerRequestFilter {

    // 10 login/register attempts per minute per IP
    private static final int CAPACITY = 10;
    private static final Duration REFILL_PERIOD = Duration.ofMinutes(1);

    // Set to the direct IP of your trusted reverse proxy to honour X-Forwarded-For.
    // Leave empty (default) to always use RemoteAddr and ignore XFF.
    @Value("${app.rate-limit.trusted-proxy:}")
    private String trustedProxy;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private Bucket newBucket() {
        return Bucket.builder()
                .addLimit(Bandwidth.simple(CAPACITY, REFILL_PERIOD))
                .build();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/api/v1/auth/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String ip = clientIp(request);
        Bucket bucket = buckets.computeIfAbsent(ip, k -> newBucket());

        if (bucket.tryConsume(1)) {
            chain.doFilter(request, response);
        } else {
            // Security event: a client is hitting the auth endpoints past the limit.
            log.warn("Rate limit exceeded for {} on {}", ip, request.getRequestURI());
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write("{\"error\":\"Too many requests. Please wait before trying again.\"}");
        }
    }

    private String clientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        // Only trust X-Forwarded-For when the direct connection comes from the configured proxy.
        if (!trustedProxy.isBlank() && trustedProxy.equals(remoteAddr)) {
            String xff = request.getHeader("X-Forwarded-For");
            if (xff != null && !xff.isBlank()) {
                return xff.split(",")[0].trim();
            }
        }
        return remoteAddr;
    }

    // Sweep buckets that have been fully refilled (no active limiting) every minute.
    // This bounds heap growth from long-lived idle IP entries.
    @Scheduled(fixedRate = 60_000)
    public void evictInactiveBuckets() {
        buckets.entrySet().removeIf(entry ->
            entry.getValue().getAvailableTokens() >= CAPACITY
        );
    }
}
