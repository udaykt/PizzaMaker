package com.pizzamaker.messaging;

import com.pizzamaker.event.OrderPlacedEvent;
import com.pizzamaker.event.OrderStatusChangedEvent;

// What OutboxDispatcher hands a committed outbox row to. Two implementations:
//
//   KafkaOrderEventPublisher     (app.kafka.enabled=true)  -> publishes to Kafka
//   InProcessOrderEventPublisher (default)                 -> does the side effect inline
//
// The in-process one keeps dev, tests and CI running with no broker, and is the
// behaviour this app had before Kafka existed.
public interface OrderEventPublisher {

    void publishOrderPlaced(OrderPlacedEvent event);

    void publishStatusChanged(OrderStatusChangedEvent event);
}