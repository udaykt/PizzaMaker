package com.pizzamaker.config;

import com.pizzamaker.entity.OutboxStatus;
import com.pizzamaker.repository.OutboxEventRepository;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;

// Binds business gauges to the meter registry. The outbox backlog is the kind of
// metric an on-call engineer actually watches: if pizza_outbox_pending climbs and
// stays up, the relay is wedged and confirmations aren't going out.
// @Lazy(false) forces eager creation so the gauges register even under the dev
// profile's global lazy-initialization (nothing else references this bean).
@Configuration
@Lazy(false)
@RequiredArgsConstructor
public class MetricsConfig {

    private final MeterRegistry meterRegistry;
    private final OutboxEventRepository outboxEventRepository;

    @PostConstruct
    public void registerOutboxGauges() {
        Gauge.builder("pizza.outbox.pending", outboxEventRepository,
                        repo -> repo.countByStatus(OutboxStatus.PENDING))
                .description("Outbox events awaiting delivery")
                .register(meterRegistry);

        Gauge.builder("pizza.outbox.failed", outboxEventRepository,
                        repo -> repo.countByStatus(OutboxStatus.FAILED))
                .description("Outbox events that exhausted their retry budget")
                .register(meterRegistry);
    }
}
