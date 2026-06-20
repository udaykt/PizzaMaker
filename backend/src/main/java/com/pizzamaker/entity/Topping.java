package com.pizzamaker.entity;

import jakarta.persistence.*;
import lombok.*;

// A topping the kitchen can make. The order validator reads its allow-list from
// the active rows of this table (see CatalogService), replacing the old
// hardcoded ToppingCatalog.IDS Set so toppings can be retired without a redeploy.
@Entity
@Table(name = "topping")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Topping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Matches the frontend topping art id (e.g. "pepperoni").
    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private boolean active;
}
