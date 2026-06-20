package com.pizzamaker.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

// Sends the order confirmation. Called synchronously by the outbox dispatcher —
// the relay already runs on a background scheduler, so this no longer needs its
// own @Async, and a throw here propagates to the relay to drive a retry. In a
// real system this would call an email/SMS provider behind a timeout + circuit
// breaker.
@Service
@Slf4j
public class NotificationService {

    public void sendOrderConfirmation(String email, String oid) {
        log.info("Sending order confirmation to {} for order {}", email, oid);
    }
}
