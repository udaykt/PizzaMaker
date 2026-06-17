package com.pizzamaker.entity;

import com.pizzamaker.entity.converter.ToppingSelectionListConverter;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    // Sauce is a single choice (Domino's-style: Robust Tomato/Marinara/
    // Garlic Parmesan/Alfredo/BBQ/None), not a flat boolean.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SauceType sauceType = SauceType.NONE;

    // Cheese types are independent — a pizza can combine mozzarella with
    // feta, unlike sauce. Replaces the old ambiguous "cheese" boolean.
    private boolean mozzarella;
    private boolean provolone;
    private boolean feta;
    private boolean veganCheese;

    // Toppings are stored as a JSON list of {id, quantity} (quantity tiers are
    // Light/Regular/Extra, matching Domino's/Pizza Hut/Papa John's), so adding
    // a topping never needs a schema change — see ToppingSelectionListConverter.
    @Convert(converter = ToppingSelectionListConverter.class)
    @Column(nullable = false, length = 2000)
    @Builder.Default
    private List<ToppingSelection> toppings = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PizzaSize pizzaSize;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private CrustStyle crustStyle = CrustStyle.HAND_TOSSED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private BakeLevel bakeLevel = BakeLevel.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DeliveryMethod deliveryMethod = DeliveryMethod.DELIVERY;

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
