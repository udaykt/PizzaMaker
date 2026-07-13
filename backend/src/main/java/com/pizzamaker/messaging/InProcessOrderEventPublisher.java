package com.pizzamaker.messaging;

import com.pizzamaker.dto.response.OrderStatusUpdateResponse;
import com.pizzamaker.event.OrderPlacedEvent;
import com.pizzamaker.event.OrderStatusChangedEvent;
import com.pizzamaker.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

// The no-broker fallback, and the behaviour this app had before Kafka: the relay
// performs the side effect directly on its own scheduler thread.
//
// Note this path has no automated kitchen pipeline — the lifecycle auto-advance
// (PENDING -> CONFIRMED -> PREPARING -> READY) is a property of the Kafka
// consumer, so with Kafka off an order sits in PENDING until an admin moves it
// via PUT /orders/{oid}/status. That keeps every pre-Kafka test valid.
@Component
@ConditionalOnProperty(prefix = "app.kafka", name = "enabled", havingValue = "false", matchIfMissing = true)
@RequiredArgsConstructor
public class InProcessOrderEventPublisher implements OrderEventPublisher {

    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public void publishOrderPlaced(OrderPlacedEvent event) {
        notificationService.sendOrderConfirmation(event.email(), event.oid());
    }

    @Override
    public void publishStatusChanged(OrderStatusChangedEvent event) {
        // Route only to the owning user's session.
        messagingTemplate.convertAndSendToUser(
                event.email(),
                "/queue/orders",
                new OrderStatusUpdateResponse(event.oid(), event.uid(), event.status()));
    }
}