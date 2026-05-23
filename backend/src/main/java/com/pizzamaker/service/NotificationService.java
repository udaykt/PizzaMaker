package com.pizzamaker.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class NotificationService {

    @Async("notificationExecutor")
    public CompletableFuture<Void> sendOrderConfirmation(String email, String oid) {
        log.info("[ASYNC] Sending order confirmation to {} for order {}", email, oid);
        // Simulate email send latency
        try {
            Thread.sleep(200);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        log.info("[ASYNC] Order confirmation sent to {} for order {}", email, oid);
        return CompletableFuture.completedFuture(null);
    }
}
