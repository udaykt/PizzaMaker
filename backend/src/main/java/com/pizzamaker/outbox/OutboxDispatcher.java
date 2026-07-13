package com.pizzamaker.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pizzamaker.entity.OutboxEvent;
import com.pizzamaker.event.OrderPlacedEvent;
import com.pizzamaker.event.OrderStatusChangedEvent;
import com.pizzamaker.messaging.OrderEventPublisher;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

// Turns a stored outbox row back into its typed payload and hands it to the
// publisher. Any exception propagates to the relay, which records the failure and
// schedules a retry.
//
// This class used to perform the side effect itself (notification + STOMP push).
// It now delegates to an OrderEventPublisher, which is either:
//
//   KafkaOrderEventPublisher     — publishes to Kafka (app.kafka.enabled=true)
//   InProcessOrderEventPublisher — does the side effect inline (the default)
//
// The outbox row remains the atomic write inside placeOrder's transaction. Kafka
// changed where the event GOES, not how it is produced — there is still no point
// at which the database and the event log can disagree.
@Component
@RequiredArgsConstructor
public class OutboxDispatcher {

    private final OrderEventPublisher publisher;
    private final ObjectMapper objectMapper;

    public void dispatch(OutboxEvent event) throws Exception {
        switch (event.getEventType()) {
            case OutboxService.ORDER_PLACED -> publisher.publishOrderPlaced(
                    objectMapper.readValue(event.getPayload(), OrderPlacedEvent.class));

            case OutboxService.ORDER_STATUS_CHANGED -> publisher.publishStatusChanged(
                    objectMapper.readValue(event.getPayload(), OrderStatusChangedEvent.class));

            default -> throw new IllegalArgumentException("Unknown outbox event type: " + event.getEventType());
        }
    }
}