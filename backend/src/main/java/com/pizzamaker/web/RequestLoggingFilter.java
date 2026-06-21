package com.pizzamaker.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// One structured access-log line per request, emitted after the chain completes
// so it carries the final status and total latency. The fields go into the MDC
// too, so in prod they become first-class JSON keys (http_method, http_status,
// duration_ms) you can filter and chart on. Runs just after RequestIdFilter so
// the correlation id is already present, and before the security chain so even
// rejected requests are logged.
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@Slf4j
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        // Skip infrastructure noise that would drown the signal.
        return uri.startsWith("/actuator")
                || uri.startsWith("/swagger-ui")
                || uri.startsWith("/v3/api-docs")
                || uri.startsWith("/h2-console");
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        long start = System.nanoTime();
        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = (System.nanoTime() - start) / 1_000_000;
            MDC.put("http_method", request.getMethod());
            MDC.put("http_path", request.getRequestURI());
            MDC.put("http_status", Integer.toString(response.getStatus()));
            MDC.put("duration_ms", Long.toString(durationMs));
            try {
                log.info("{} {} -> {} ({}ms)",
                        request.getMethod(), request.getRequestURI(), response.getStatus(), durationMs);
            } finally {
                MDC.remove("http_method");
                MDC.remove("http_path");
                MDC.remove("http_status");
                MDC.remove("duration_ms");
            }
        }
    }
}
