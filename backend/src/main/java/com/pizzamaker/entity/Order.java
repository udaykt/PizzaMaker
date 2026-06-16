package com.pizzamaker.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "orders")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String oid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Base ingredients
    private boolean sauce;
    private boolean mozzarella;
    private boolean cheese;

    // Toppings (regular / medium quantity)
    private boolean pepperoni;
    private boolean pepperoniMedium;
    private boolean sausage;
    private boolean sausageMedium;
    private boolean peppers;
    private boolean peppersMedium;
    private boolean olives;
    private boolean olivesMedium;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PizzaSize pizzaSize;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CrustStyle crustStyle = CrustStyle.CLASSIC;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BakeLevel bakeLevel = BakeLevel.GOLDEN;

    // Computed server-side at order time (see PricingService) — never trust
    // a client-supplied price.
    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private OrderStatus status = OrderStatus.PENDING;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
