package com.pizzamaker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// Append-only record of an order's status transitions, written inside the same
// transaction as the status change so the timeline can never drift from the
// order's current status.
@Entity
@Table(name = "order_status_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    // Null only for the initial PENDING row created when the order is placed.
    @Enumerated(EnumType.STRING)
    @Column(name = "from_status")
    private OrderStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false)
    private OrderStatus toStatus;

    // The authenticated principal who made the change, or null for system writes.
    @Column(name = "changed_by")
    private String changedBy;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;
}
