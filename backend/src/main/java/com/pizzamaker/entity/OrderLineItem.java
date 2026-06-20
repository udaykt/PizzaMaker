package com.pizzamaker.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// One priced line of an order's receipt, snapshotted at order time so a later
// price change never rewrites history. The sum of an order's line item amounts
// equals orders.price (see PricingService.computeBreakdown).
@Entity
@Table(name = "order_line_item")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderLineItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @Column(name = "line_type", nullable = false)
    private LineType lineType;

    // The catalog id this line refers to (a topping code for TOPPING lines),
    // null for lines with no catalog reference (e.g. DELIVERY).
    @Column(name = "ref_id")
    private String refId;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
