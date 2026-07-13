package com.pizzamaker.messaging;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@ConfigurationProperties(prefix = "app.kafka")
@Getter
@Setter
public class KafkaEventProperties {

    // Off by default. Every Kafka bean in this codebase is conditional on this
    // flag, so `mvn test` and a plain `./mvnw spring-boot:run` need no broker —
    // the outbox falls back to dispatching in-process.
    private boolean enabled = false;

    // Consumer group for the work listeners (order-placed, lifecycle). SHARED
    // across pods: these are competing consumers, so each message is handled once.
    // Contrast with the WebSocket broadcast listener, which needs a group per pod.
    private String workGroup = "pizzamaker-orders";

    private int partitions = 3;
    private short replicas = 1;

    // How long an order sits in each kitchen stage before the next hop fires.
    private Duration stageDelay = Duration.ofSeconds(3);

    // Loop fuse for the self-perpetuating pipeline. PENDING -> CONFIRMED ->
    // PREPARING -> READY is three hops, so 4 leaves headroom without letting a
    // buggy next-stage function cycle a message forever.
    private int maxHops = 4;

    // How long the publisher waits for the broker ack before treating the send as
    // failed. On timeout the outbox row stays PENDING and is retried.
    private Duration sendTimeout = Duration.ofSeconds(10);

    private Topics topics = new Topics();

    @Getter
    @Setter
    public static class Topics {
        private String orderPlaced = "orders.placed";
        private String orderLifecycle = "orders.lifecycle";
        private String orderStatusChanged = "orders.status-changed";
    }
}
