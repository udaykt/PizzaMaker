package com.pizzamaker.entity;

import com.pizzamaker.entity.converter.ToppingSelectionListConverter;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

// A server-owned preset pizza. Backend source of truth for the menu the client
// currently hardcodes; toppings reuses the same JSON {id,quantity} shape as
// orders.toppings via ToppingSelectionListConverter.
@Entity
@Table(name = "pizza_preset")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PizzaPreset {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "pizza_size", nullable = false)
    private PizzaSize pizzaSize;

    @Enumerated(EnumType.STRING)
    @Column(name = "sauce_type", nullable = false)
    private SauceType sauceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "crust_style", nullable = false)
    private CrustStyle crustStyle;

    @Convert(converter = ToppingSelectionListConverter.class)
    @Column(nullable = false, length = 2000)
    @Builder.Default
    private List<ToppingSelection> toppings = new ArrayList<>();

    @Column(nullable = false)
    private boolean active;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;
}
