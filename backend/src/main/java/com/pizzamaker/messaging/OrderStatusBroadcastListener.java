package com.pizzamaker.messaging;

import com.pizzamaker.dto.response.OrderStatusUpdateResponse;
import com.pizzamaker.event.OrderStatusChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Lazy;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

// Fans a status change out to whichever pod is holding the customer's WebSocket.
//
// WHY A UNIQUE CONSUMER GROUP PER POD
// -----------------------------------
// WebSocketConfig uses enableSimpleBroker(), an in-memory STOMP broker living
// inside a single JVM. A pod can therefore only push to sessions it is itself
// holding — it has no way to reach a session parked on another pod.
//
// With a shared consumer group, Kafka would hand each status change to exactly
// ONE pod. At replicas > 1 that pod is usually NOT the one holding that
// customer's socket, so convertAndSendToUser() would find no session, drop the
// message on the floor, and the customer's tracker would just... never update.
// It would work perfectly at replicas: 1 and break silently the moment you scale
// out — the worst kind of bug.
//
// The fix used here: give every pod its own group id (a fresh UUID per JVM
// start), which turns competing-consumer semantics into broadcast semantics.
// Every pod sees every status change; each pushes to the sessions it happens to
// hold and no-ops for the rest. Cheap and correct.
//
// Cost: each restart leaves a dead consumer group behind. Kafka reaps empty
// groups after offsets.retention.minutes (7 days by default), so they don't
// accumulate indefinitely.
//
// THE CORRECT AT-SCALE ANSWER is enableStompBrokerRelay() pointed at RabbitMQ or
// ActiveMQ: the STOMP broker becomes shared infrastructure, any pod can address
// any session, and this whole broadcast dance disappears. Deliberately not built
// — it means running a second broker alongside Kafka to serve a demo app. This is
// a conscious trade-off, not an oversight. See README.
// @Lazy(false): see OrderLifecycleListener — under lazy-initialization a listener
// bean that is never instantiated is never registered, and the app boots happily
// consuming nothing.
@Component
@Lazy(false)
@ConditionalOnProperty(prefix = "app.kafka", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class OrderStatusBroadcastListener {

    private final SimpMessagingTemplate messagingTemplate;

    @KafkaListener(
            topics = "${app.kafka.topics.order-status-changed}",
            groupId = "pizzamaker-ws-#{T(java.util.UUID).randomUUID().toString()}",
            containerFactory = "broadcastListenerContainerFactory")
    public void onStatusChanged(OrderStatusChangedEvent event) {
        log.debug("Broadcasting status {} for order {}", event.status(), event.oid());

        // A no-op on pods that aren't holding this user's session, which is
        // exactly what we want.
        messagingTemplate.convertAndSendToUser(
                event.email(),
                "/queue/orders",
                new OrderStatusUpdateResponse(event.oid(), event.uid(), event.status()));
    }
}