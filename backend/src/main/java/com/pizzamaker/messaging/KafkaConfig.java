package com.pizzamaker.messaging;

import com.pizzamaker.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.TopicPartition;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.kafka.support.serializer.JsonSerializer;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.util.backoff.ExponentialBackOff;

import java.util.HashMap;
import java.util.Map;

// Every bean here is gated on app.kafka.enabled. With the flag off nothing in
// this class is created, spring-kafka sits inert on the classpath, and the outbox
// dispatches in-process — which is what keeps dev, tests and CI broker-free.
@Configuration
@ConditionalOnProperty(prefix = "app.kafka", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class KafkaConfig {

    // Logical type aliases travel on the wire in the __TypeId__ header instead of
    // Java FQCNs. A consumer in another language (or another service after a
    // package rename) can still make sense of the payload — putting
    // "com.pizzamaker.event.OrderPlacedEvent" on a topic would hard-couple the
    // wire format to this codebase's package layout.
    private static final String TYPE_MAPPINGS =
            "order-placed:com.pizzamaker.event.OrderPlacedEvent,"
            + "order-lifecycle:com.pizzamaker.event.OrderLifecycleEvent,"
            + "order-status-changed:com.pizzamaker.event.OrderStatusChangedEvent";

    private final KafkaEventProperties props;

    @Value("${spring.kafka.bootstrap-servers:localhost:9092}")
    private String bootstrapServers;

    // ---------------------------------------------------------------- topics

    @Bean
    NewTopic orderPlacedTopic() {
        return topic(props.getTopics().getOrderPlaced());
    }

    @Bean
    NewTopic orderPlacedDltTopic() {
        return topic(dlt(props.getTopics().getOrderPlaced()));
    }

    @Bean
    NewTopic orderLifecycleTopic() {
        return topic(props.getTopics().getOrderLifecycle());
    }

    @Bean
    NewTopic orderLifecycleDltTopic() {
        return topic(dlt(props.getTopics().getOrderLifecycle()));
    }

    @Bean
    NewTopic orderStatusChangedTopic() {
        return topic(props.getTopics().getOrderStatusChanged());
    }

    @Bean
    NewTopic orderStatusChangedDltTopic() {
        return topic(dlt(props.getTopics().getOrderStatusChanged()));
    }

    private NewTopic topic(String name) {
        return TopicBuilder.name(name)
                .partitions(props.getPartitions())
                .replicas(props.getReplicas())
                .build();
    }

    static String dlt(String topic) {
        return topic + ".DLT";
    }

    // -------------------------------------------------------------- producer

    @Bean
    ProducerFactory<String, Object> orderProducerFactory() {
        Map<String, Object> config = new HashMap<>();
        config.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        config.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);

        // acks=all — the leader only acks once every in-sync replica has the
        // record, so a leader crash can't lose an acked write.
        config.put(ProducerConfig.ACKS_CONFIG, "all");
        // Idempotent producer — the broker de-duplicates a send the producer
        // retried internally, so a network blip mid-send can't write the record
        // twice. Together with the outbox (whose row is only marked PROCESSED
        // after the ack below returns) this gives effectively-once production.
        config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true);
        config.put(JsonSerializer.TYPE_MAPPINGS, TYPE_MAPPINGS);
        return new DefaultKafkaProducerFactory<>(config);
    }

    @Bean
    KafkaTemplate<String, Object> kafkaTemplate(ProducerFactory<String, Object> orderProducerFactory) {
        return new KafkaTemplate<>(orderProducerFactory);
    }

    // -------------------------------------------------------------- consumer

    private Map<String, Object> consumerConfig(String autoOffsetReset) {
        Map<String, Object> config = new HashMap<>();
        config.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        config.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, autoOffsetReset);
        // Spring commits the offset after the listener returns, so a crash
        // mid-handler redelivers rather than silently skipping. At-least-once —
        // which is exactly why the handlers must be idempotent.
        config.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);

        // ErrorHandlingDeserializer wraps the real deserializer: a malformed
        // payload becomes a DeserializationException delivered to the error
        // handler (-> DLT) instead of killing the container in a poison-pill loop.
        config.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        config.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        config.put(ErrorHandlingDeserializer.KEY_DESERIALIZER_CLASS, StringDeserializer.class);
        config.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, JsonDeserializer.class);
        config.put(JsonDeserializer.TRUSTED_PACKAGES, "com.pizzamaker.event");
        config.put(JsonDeserializer.TYPE_MAPPINGS, TYPE_MAPPINGS);
        return config;
    }

    // Work listeners (order-placed, lifecycle): a SHARED consumer group, so each
    // message is handled by exactly one pod. `earliest` so a backlog produced
    // while every pod was down still gets processed on restart.
    @Bean
    ConcurrentKafkaListenerContainerFactory<String, Object> workListenerContainerFactory(
            DefaultErrorHandler kafkaErrorHandler) {
        var factory = new ConcurrentKafkaListenerContainerFactory<String, Object>();
        factory.setConsumerFactory(new DefaultKafkaConsumerFactory<>(consumerConfig("earliest")));
        factory.setCommonErrorHandler(kafkaErrorHandler);
        return factory;
    }

    // WebSocket broadcast listener: a UNIQUE consumer group per pod, so every pod
    // receives every status change (see OrderStatusBroadcastListener for why).
    //
    // `latest` is load-bearing here, not a preference: a brand-new group id on
    // every JVM start would, under `earliest`, replay the entire topic from
    // offset 0 and re-push every historical status update to whoever is connected.
    // Customers would see a burst of stale "your pizza is READY" toasts on each
    // pod restart. A broadcast consumer only ever wants what happens from now on.
    @Bean
    ConcurrentKafkaListenerContainerFactory<String, Object> broadcastListenerContainerFactory(
            DefaultErrorHandler kafkaErrorHandler) {
        var factory = new ConcurrentKafkaListenerContainerFactory<String, Object>();
        factory.setConsumerFactory(new DefaultKafkaConsumerFactory<>(consumerConfig("latest")));
        factory.setCommonErrorHandler(kafkaErrorHandler);
        return factory;
    }

    // --------------------------------------------------------- retry + DLT

    @Bean
    DefaultErrorHandler kafkaErrorHandler(KafkaTemplate<String, Object> kafkaTemplate) {
        // Partition -1 lets the broker choose: the .DLT topic is not guaranteed to
        // have the same partition count as its source, and copying the source
        // partition number blindly would fail the send if it doesn't exist. The
        // record keeps its key, so a given order's failures stay co-partitioned.
        var recoverer = new DeadLetterPublishingRecoverer(kafkaTemplate,
                (record, exception) -> new TopicPartition(dlt(record.topic()), -1));

        // 500ms, 1s, 2s, 4s... capped at 10s total, so a transient blip gets a few
        // attempts and a genuinely broken message reaches the DLT quickly instead
        // of pinning a partition.
        var backOff = new ExponentialBackOff(500L, 2.0);
        backOff.setMaxElapsedTime(10_000L);

        var handler = new DefaultErrorHandler(recoverer, backOff);

        // Classification is the whole point of the DLT. Retrying these is pure
        // waste — the outcome is identical every time — so they skip the backoff
        // budget and go straight to the DLT:
        //   NonRetryableEventException — our own "this message is malformed" signal
        //   ResourceNotFoundException  — unknown order id; it will never appear
        //   IllegalArgumentException   — bad enum / invalid transition demand
        // Everything else (broker unavailable, DB timeout, optimistic-lock clash)
        // is treated as transient and retried.
        handler.addNotRetryableExceptions(
                NonRetryableEventException.class,
                ResourceNotFoundException.class,
                IllegalArgumentException.class);

        handler.setRetryListeners((record, ex, attempt) ->
                log.warn("Retry {} for record on {} key={} — {}",
                        attempt, record.topic(), record.key(), ex.toString()));

        return handler;
    }

    // ------------------------------------------------------------- scheduler

    // Fires the delayed next-hop sends. Small pool: the tasks do nothing but a
    // Kafka send.
    @Bean(destroyMethod = "shutdown")
    TaskScheduler lifecycleScheduler() {
        var scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(2);
        scheduler.setThreadNamePrefix("order-lifecycle-");
        scheduler.initialize();
        return scheduler;
    }
}