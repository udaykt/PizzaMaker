package com.pizzamaker.messaging;

// The broker did not acknowledge a send. Thrown by KafkaOrderEventPublisher and
// allowed to propagate to OutboxRelay, which leaves the row PENDING and retries
// it with backoff — so a broker outage delays events but never loses them.
public class EventPublishException extends RuntimeException {

    public EventPublishException(String message, Throwable cause) {
        super(message, cause);
    }
}