package com.pizzamaker.outbox;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pizzamaker.entity.OutboxEvent;
import com.pizzamaker.entity.OutboxStatus;
import com.pizzamaker.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

// Producer side of the outbox. append() saves a row WITHOUT starting its own
// transaction, so it joins the caller's transaction (e.g. OrderService.placeOrder)
// and commits atomically with the business change that produced it.
@Service
@RequiredArgsConstructor
public class OutboxService {

    public static final String AGGREGATE_ORDER = "ORDER";
    public static final String ORDER_PLACED = "ORDER_PLACED";
    public static final String ORDER_STATUS_CHANGED = "ORDER_STATUS_CHANGED";

    private final OutboxEventRepository repository;
    private final ObjectMapper objectMapper;

    public void append(String aggregateType, String aggregateId, String eventType, Object payload) {
        String json;
        try {
            json = objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            // A payload that can't be serialized is a programming error, and it
            // must fail the surrounding transaction rather than drop the event.
            throw new IllegalStateException("Failed to serialize outbox payload for " + eventType, e);
        }
        LocalDateTime now = LocalDateTime.now();
        repository.save(OutboxEvent.builder()
                .aggregateType(aggregateType)
                .aggregateId(aggregateId)
                .eventType(eventType)
                .payload(json)
                .status(OutboxStatus.PENDING)
                .attempts(0)
                .createdAt(now)
                .nextAttemptAt(now)
                .build());
    }
}
