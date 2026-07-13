package com.pizzamaker.messaging;

import com.pizzamaker.entity.OrderStatus;
import com.pizzamaker.event.OrderLifecycleEvent;
import com.pizzamaker.event.OrderPlacedEvent;
import com.pizzamaker.service.NotificationService;
import com.pizzamaker.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

// The kitchen. Consumes a placed order and walks it through the lifecycle, one
// Kafka message per stage.
//
// Both listeners share one consumer group, so across N pods each message is
// handled exactly once — these are competing consumers doing work, unlike the
// broadcast listener that fans WebSocket pushes out to every pod.
@Component
@ConditionalOnProperty(prefix = "app.kafka", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class OrderLifecycleListener {

    private final OrderService orderService;
    private final NotificationService notificationService;
    private final KafkaOrderEventPublisher publisher;
    private final KafkaEventProperties props;

    @KafkaListener(
            topics = "${app.kafka.topics.order-placed}",
            groupId = "${app.kafka.work-group}",
            containerFactory = "workListenerContainerFactory")
    public void onOrderPlaced(OrderPlacedEvent event) {
        log.info("Consumed order-placed oid={}", event.oid());

        notificationService.sendOrderConfirmation(event.email(), event.oid());

        // Start the pipeline. PENDING -> CONFIRMED is hop 1; CONFIRMED is this
        // codebase's name for "received by the kitchen".
        publisher.emitNextStage(new OrderLifecycleEvent(event.oid(), OrderStatus.CONFIRMED, 1));
    }

    @KafkaListener(
            topics = "${app.kafka.topics.order-lifecycle}",
            groupId = "${app.kafka.work-group}",
            containerFactory = "workListenerContainerFactory")
    public void onLifecycleStage(OrderLifecycleEvent event) {
        // Loop fuse. If nextStage() ever grew a cycle, this stops the message
        // rather than letting it circulate forever. Non-retryable: replaying it
        // would just hit the same cap, so it goes straight to the DLT where a
        // human can see it.
        if (event.hop() > props.getMaxHops()) {
            throw new NonRetryableEventException(
                    "Lifecycle hop cap (" + props.getMaxHops() + ") exceeded for order " + event.oid()
                    + " at hop " + event.hop() + " targeting " + event.target());
        }

        // The idempotency guard, and the reason at-least-once delivery is safe
        // here. advanceStatusIfPossible() re-reads the order and consults
        // OrderStatus.canTransitionTo(); it returns false — rather than throwing —
        // when the transition is no longer legal. That covers both real cases:
        //
        //   1. Kafka redelivered this message (the consumer crashed after doing
        //      the work but before committing its offset). The order is already in
        //      `target`, PENDING -> CONFIRMED is no longer valid from CONFIRMED,
        //      so we skip instead of double-writing history rows and re-pushing.
        //   2. An admin raced us via PUT /orders/{oid}/status and moved the order
        //      forward first. The admin wins; our hop becomes a no-op.
        //
        // Skipping ends the pipeline for this order. That's intended — whoever
        // advanced it past us has taken ownership of the lifecycle.
        boolean advanced = orderService.advanceStatusIfPossible(event.oid(), event.target());
        if (!advanced) {
            log.info("Lifecycle hop {} for order {} skipped: {} is no longer a legal transition "
                     + "(redelivery, or an admin advanced it first)",
                    event.hop(), event.oid(), event.target());
            return;
        }

        OrderStatus next = nextStage(event.target());
        if (next != null) {
            publisher.emitNextStage(new OrderLifecycleEvent(event.oid(), next, event.hop() + 1));
        } else {
            log.info("Order {} reached {} — automated pipeline complete", event.oid(), event.target());
        }
    }

    // READY is where the automated kitchen stops. DELIVERED is a real-world act by
    // a courier, so it stays admin-driven via PUT /orders/{oid}/status.
    private static OrderStatus nextStage(OrderStatus current) {
        return switch (current) {
            case CONFIRMED -> OrderStatus.PREPARING;
            case PREPARING -> OrderStatus.READY;
            default -> null;
        };
    }
}