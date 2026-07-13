package com.pizzamaker.messaging;

import com.pizzamaker.event.OrderLifecycleEvent;
import com.pizzamaker.event.OrderPlacedEvent;
import com.pizzamaker.event.OrderStatusChangedEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

// Publishes committed outbox rows onto Kafka. Reached only from OutboxDispatcher,
// which is only reached from OutboxRelay — so an event is on Kafka *because* the
// order it describes is already durably committed. That ordering is the whole
// reason the outbox stays: OrderService never calls this class directly, so there
// is no window where the DB commit and the Kafka send can disagree.
@Component
@ConditionalOnProperty(prefix = "app.kafka", name = "enabled", havingValue = "true")
@Slf4j
public class KafkaOrderEventPublisher implements OrderEventPublisher {

    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final KafkaEventProperties props;
    private final TaskScheduler scheduler;

    // Explicit constructor rather than @RequiredArgsConstructor: Spring Boot also
    // auto-configures a TaskScheduler, so the qualifier is needed to disambiguate.
    public KafkaOrderEventPublisher(KafkaTemplate<String, Object> kafkaTemplate,
                                    KafkaEventProperties props,
                                    @Qualifier("lifecycleScheduler") TaskScheduler scheduler) {
        this.kafkaTemplate = kafkaTemplate;
        this.props = props;
        this.scheduler = scheduler;
    }

    @Override
    public void publishOrderPlaced(OrderPlacedEvent event) {
        send(props.getTopics().getOrderPlaced(), event.oid(), event);
    }

    @Override
    public void publishStatusChanged(OrderStatusChangedEvent event) {
        send(props.getTopics().getOrderStatusChanged(), event.oid(), event);
    }

    // Schedules the next kitchen stage. The delay happens HERE, on a scheduler
    // thread — never inside the listener. A Thread.sleep() in the @KafkaListener
    // would hold the consumer thread for the whole stage delay, stall every other
    // partition assigned to that consumer, and once the sleep exceeded
    // max.poll.interval.ms the broker would evict the member and rebalance the
    // group — turning a 3-second pause into a cluster-wide stutter.
    //
    // Honest limitation: this in-memory timer is not durable. If the pod dies
    // inside the stage delay the next hop is lost and the order stops advancing
    // (an admin can still move it via PUT /orders/{oid}/status). Making it durable
    // means a delay topic or a DB-backed scheduled job — deliberately out of scope.
    public void emitNextStage(OrderLifecycleEvent event) {
        scheduler.schedule(() -> {
            try {
                send(props.getTopics().getOrderLifecycle(), event.oid(), event);
            } catch (RuntimeException ex) {
                // Nothing upstream is left to catch this — the listener that
                // scheduled it returned long ago and its offset is committed.
                log.error("Lost lifecycle hop {} for order {} (target {}): {}",
                        event.hop(), event.oid(), event.target(), ex.toString());
            }
        }, Instant.now().plus(props.getStageDelay()));
    }

    // Every message is keyed by the order id. Kafka hashes the key to pick a
    // partition, and ordering is only guaranteed *within* a partition — so keying
    // by oid is what guarantees that CONFIRMED, PREPARING and READY for one order
    // are consumed in the order they were produced. Keyed by anything else (or
    // unkeyed, which round-robins) a customer could see READY before PREPARING.
    private void send(String topic, String key, Object payload) {
        try {
            // Deliberately blocking. kafkaTemplate.send() is async, and if we
            // returned without waiting, OutboxRelay would mark the row PROCESSED
            // immediately — then a broker failure would silently drop the event
            // with the outbox believing it was delivered. Waiting for the ack
            // means a failure throws, the row stays PENDING, and the relay retries
            // it with backoff. Slower, and correct.
            SendResult<String, Object> result = kafkaTemplate.send(topic, key, payload)
                    .get(props.getSendTimeout().toMillis(), TimeUnit.MILLISECONDS);

            var metadata = result.getRecordMetadata();
            log.debug("Published {} key={} -> {}-{}@{}",
                    payload.getClass().getSimpleName(), key,
                    metadata.topic(), metadata.partition(), metadata.offset());

        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new EventPublishException("Interrupted publishing to " + topic + " key=" + key, ex);
        } catch (ExecutionException | TimeoutException ex) {
            throw new EventPublishException("Broker did not ack publish to " + topic + " key=" + key, ex);
        }
    }
}