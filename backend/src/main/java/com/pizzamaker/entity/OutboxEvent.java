package com.pizzamaker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// A pending side effect, persisted in the same transaction as the business
// change that produced it. The relay (OutboxRelay) polls due rows, dispatches
// them, and marks them PROCESSED — or backs off and retries on failure.
@Entity
@Table(name = "outbox_event")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboxEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The aggregate this event is about (e.g. "ORDER") and its business id (oid).
    @Column(name = "aggregate_type", nullable = false)
    private String aggregateType;

    @Column(name = "aggregate_id", nullable = false)
    private String aggregateId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    // JSON-serialized payload the dispatcher deserializes back into a typed event.
    @Column(nullable = false, length = 2000)
    private String payload;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OutboxStatus status = OutboxStatus.PENDING;

    @Column(nullable = false)
    @Builder.Default
    private int attempts = 0;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // When this row next becomes eligible for dispatch — advanced on each failure
    // for exponential backoff.
    @Column(name = "next_attempt_at", nullable = false)
    private LocalDateTime nextAttemptAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}
