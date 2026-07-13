package com.pizzamaker.messaging;

import com.pizzamaker.dto.request.OrderRequest;
import com.pizzamaker.dto.response.OrderResponse;
import com.pizzamaker.entity.BakeLevel;
import com.pizzamaker.entity.CrustStyle;
import com.pizzamaker.entity.DeliveryMethod;
import com.pizzamaker.entity.Order;
import com.pizzamaker.entity.OrderStatus;
import com.pizzamaker.entity.OrderStatusHistory;
import com.pizzamaker.entity.PizzaSize;
import com.pizzamaker.entity.Role;
import com.pizzamaker.entity.SauceType;
import com.pizzamaker.entity.User;
import com.pizzamaker.entity.UserType;
import com.pizzamaker.event.OrderLifecycleEvent;
import com.pizzamaker.repository.OrderRepository;
import com.pizzamaker.repository.OrderStatusHistoryRepository;
import com.pizzamaker.repository.UserRepository;
import com.pizzamaker.service.OrderService;
import org.apache.kafka.clients.consumer.Consumer;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.test.EmbeddedKafkaBroker;
import org.springframework.kafka.test.context.EmbeddedKafka;
import org.springframework.test.annotation.DirtiesContext;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

// End-to-end tests of the Kafka path against an in-JVM broker.
//
// These are the only tests that run with app.kafka.enabled=true. Everything else
// in the suite runs with it off (the default) and exercises the in-process outbox
// dispatch, which is why adding Kafka didn't require touching a single existing
// test.
//
// stage-delay is squeezed to 200ms so the three-hop pipeline completes inside a
// test instead of taking 9 seconds, and the outbox poll to 200ms so the relay
// picks rows up promptly.
@SpringBootTest(properties = {
        "app.kafka.enabled=true",
        "spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}",
        "app.kafka.stage-delay=200ms",
        "app.kafka.partitions=1",
        "app.kafka.replicas=1",
        "app.outbox.poll-ms=200",
        // The listener containers must exist for this test to mean anything.
        "spring.main.lazy-initialization=false"
})
@EmbeddedKafka(
        partitions = 1,
        topics = {
                "orders.placed", "orders.placed.DLT",
                "orders.lifecycle", "orders.lifecycle.DLT",
                "orders.status-changed", "orders.status-changed.DLT"
        })
@DirtiesContext
class KafkaOrderFlowTest {

    @Autowired OrderService orderService;
    @Autowired OrderRepository orderRepository;
    @Autowired OrderStatusHistoryRepository statusHistoryRepository;
    @Autowired UserRepository userRepository;
    @Autowired KafkaTemplate<String, Object> kafkaTemplate;
    @Autowired KafkaEventProperties props;
    @Autowired EmbeddedKafkaBroker broker;

    private String email;

    @BeforeEach
    void createUser() {
        email = "kafka-" + UUID.randomUUID() + "@example.com";
        userRepository.save(User.builder()
                .uid(UUID.randomUUID().toString())
                .firstName("Kafka")
                .emailId(email)
                .passwordHash("{noop}irrelevant")
                .userType(UserType.STANDARD)
                .role(Role.ROLE_USER)
                .build());
    }

    // No toppings: keeps the test independent of the topping catalog, which
    // sanitizeToppings() validates against.
    private OrderResponse placeOrder() {
        var request = new OrderRequest(
                SauceType.ROBUST_TOMATO, true, false, false, false, false, false,
                List.of(), PizzaSize.M, CrustStyle.HAND_TOSSED, BakeLevel.NORMAL, DeliveryMethod.DELIVERY);
        return orderService.placeOrder(email, request, null);
    }

    // PRODUCER. The outbox row written inside placeOrder's transaction is drained
    // by the relay and published to orders.placed — keyed by the order id, which
    // is what pins one order's events to a single partition and therefore keeps
    // them in order.
    @Test
    void placingAnOrder_publishesToKafka_keyedByOrderId() {
        String oid = placeOrder().oid();

        ConsumerRecord<String, String> record =
                awaitRecord(props.getTopics().getOrderPlaced(), oid, Duration.ofSeconds(20));

        assertThat(record).as("order-placed event should reach Kafka").isNotNull();
        assertThat(record.key()).isEqualTo(oid);
        assertThat(record.value()).contains(oid).contains(email);
    }

    // CONSUMER. The self-perpetuating pipeline walks the order all the way to
    // READY without anyone calling the admin endpoint, and every hop leaves a
    // status-history row behind.
    @Test
    void lifecycleConsumer_advancesOrderThroughToReady() {
        String oid = placeOrder().oid();

        await().atMost(Duration.ofSeconds(30)).untilAsserted(() ->
                assertThat(statusOf(oid)).isEqualTo(OrderStatus.READY));

        assertThat(transitions(oid))
                .as("each stage should be recorded exactly once")
                .containsExactly(OrderStatus.PENDING, OrderStatus.CONFIRMED,
                        OrderStatus.PREPARING, OrderStatus.READY);
    }

    // IDEMPOTENCY. Kafka is at-least-once: a consumer that dies after doing the
    // work but before committing its offset gets the same message again. Replaying
    // a hop must NOT double-apply it. The guard is OrderStatus.canTransitionTo() —
    // CONFIRMED is not reachable from CONFIRMED, so the redelivery is skipped
    // rather than writing a second history row or re-pushing to the customer.
    @Test
    void redeliveredLifecycleEvent_isSkipped_notAppliedTwice() {
        Order order = orderRepository.save(Order.builder()
                .oid(UUID.randomUUID().toString())
                .user(userRepository.findByEmailId(email).orElseThrow())
                .pizzaSize(PizzaSize.M)
                .build());
        String oid = order.getOid();

        // The same hop, delivered twice — exactly what a redelivery looks like.
        var hop = new OrderLifecycleEvent(oid, OrderStatus.CONFIRMED, 1);
        kafkaTemplate.send(props.getTopics().getOrderLifecycle(), oid, hop);
        kafkaTemplate.send(props.getTopics().getOrderLifecycle(), oid, hop);

        // It still advances (and the pipeline carries it on to READY) ...
        await().atMost(Duration.ofSeconds(30)).untilAsserted(() ->
                assertThat(statusOf(oid)).isEqualTo(OrderStatus.READY));

        // ... but PENDING -> CONFIRMED happened once, not twice.
        assertThat(transitions(oid))
                .as("the duplicate must not produce a second PENDING -> CONFIRMED")
                .containsExactly(OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY);
    }

    // DLT. An unknown order id throws ResourceNotFoundException, which the error
    // handler classifies as non-retryable — retrying could never make the order
    // exist. It skips the backoff budget entirely and lands on the dead-letter
    // topic, where a human can see it, instead of pinning the partition.
    @Test
    void nonRetryableFailure_goesStraightToTheDeadLetterTopic() {
        String unknownOid = "does-not-exist-" + UUID.randomUUID();

        kafkaTemplate.send(props.getTopics().getOrderLifecycle(), unknownOid,
                new OrderLifecycleEvent(unknownOid, OrderStatus.CONFIRMED, 1));

        ConsumerRecord<String, String> dead = awaitRecord(
                KafkaConfig.dlt(props.getTopics().getOrderLifecycle()), unknownOid, Duration.ofSeconds(30));

        assertThat(dead).as("unknown order id should be dead-lettered").isNotNull();
        assertThat(dead.key()).isEqualTo(unknownOid);
    }

    // ------------------------------------------------------------------ helpers

    private OrderStatus statusOf(String oid) {
        return orderRepository.findByOid(oid).orElseThrow().getStatus();
    }

    // The `toStatus` of every history row for this order, oldest first.
    private List<OrderStatus> transitions(String oid) {
        Long orderId = orderRepository.findByOid(oid).orElseThrow().getId();
        return statusHistoryRepository.findByOrder_IdOrderByChangedAtAsc(orderId).stream()
                .map(OrderStatusHistory::getToStatus)
                .toList();
    }

    // Polls a topic for a record with the given key. A fresh group id per call
    // with auto.offset.reset=earliest, so it always reads the topic from the
    // beginning and never races the production of the record it's looking for.
    private ConsumerRecord<String, String> awaitRecord(String topic, String key, Duration timeout) {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, broker.getBrokersAsString());
        config.put(ConsumerConfig.GROUP_ID_CONFIG, "test-" + UUID.randomUUID());
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);

        try (Consumer<String, String> consumer = new KafkaConsumer<>(config)) {
            consumer.subscribe(List.of(topic));
            long deadline = System.currentTimeMillis() + timeout.toMillis();
            while (System.currentTimeMillis() < deadline) {
                ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(300));
                for (ConsumerRecord<String, String> record : records) {
                    if (key.equals(record.key())) {
                        return record;
                    }
                }
            }
            return null;
        }
    }
}