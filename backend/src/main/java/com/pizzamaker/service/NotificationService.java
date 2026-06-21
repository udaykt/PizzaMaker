package com.pizzamaker.service;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

// Sends the order confirmation. Called synchronously by the outbox dispatcher —
// the relay already runs on a background scheduler, so this no longer needs its
// own @Async. A throw here is retried inline a few times (transient blips), and a
// circuit breaker opens if the downstream is consistently down; once retries are
// exhausted the exception propagates to the relay, which schedules the durable,
// longer-horizon retry. In a real system the body would call an email/SMS
// provider behind a timeout.
@Service
@Slf4j
public class NotificationService {

    @Retry(name = "notification")
    @CircuitBreaker(name = "notification")
    public void sendOrderConfirmation(String email, String oid) {
        log.info("Sending order confirmation to {} for order {}", email, oid);
    }
}
