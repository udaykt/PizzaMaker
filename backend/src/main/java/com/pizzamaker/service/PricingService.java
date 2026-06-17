package com.pizzamaker.service;

import com.pizzamaker.dto.request.OrderRequest;
import com.pizzamaker.entity.DeliveryMethod;
import com.pizzamaker.entity.PizzaSize;
import com.pizzamaker.entity.SauceType;
import com.pizzamaker.entity.ToppingQuantity;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

// Computes the order total server-side. The client never sends a price —
// OrderRequest has no price field — so a tampered request can't change what
// gets charged. Keep these constants in sync with the frontend's live
// running-total display in src/utils/pricing.js so the estimate shown while
// building matches what's actually stored.
public final class PricingService {

    private PricingService() {}

    // Single source of truth for size pricing: the /menu/sizes endpoint
    // (MenuService.getSizePricing) derives its payload from this map, so the
    // estimate the client fetches and the price charged here can't diverge.
    public static final Map<PizzaSize, BigDecimal> SIZE_PRICING = Map.of(
            PizzaSize.R, BigDecimal.valueOf(8),
            PizzaSize.M, BigDecimal.valueOf(12),
            PizzaSize.L, BigDecimal.valueOf(16)
    );

    private static final BigDecimal STANDARD_CHEESE_PRICE = BigDecimal.valueOf(0.5);
    // Specialty cheeses (provolone/feta/vegan) cost more than the standard
    // mozzarella, matching how Domino's prices feta as a premium add-on today.
    private static final BigDecimal SPECIALTY_CHEESE_PRICE = BigDecimal.valueOf(1.0);

    private static final BigDecimal STANDARD_SAUCE_PRICE = BigDecimal.valueOf(0.5);
    // Garlic Parmesan/Alfredo/BBQ are priced as specialty sauces.
    private static final BigDecimal SPECIALTY_SAUCE_PRICE = BigDecimal.valueOf(1.25);

    // Light/Regular/Extra — same tiers Domino's, Pizza Hut, and Papa John's
    // use online. Extra is priced at roughly double Regular, matching what
    // Pizza Hut actually charges for an "extra" topping.
    private static final Map<ToppingQuantity, BigDecimal> TOPPING_PRICE = Map.of(
            ToppingQuantity.LIGHT, BigDecimal.valueOf(1.0),
            ToppingQuantity.REGULAR, BigDecimal.valueOf(1.5),
            ToppingQuantity.EXTRA, BigDecimal.valueOf(3.0)
    );

    // Typical real-world delivery surcharge; carryout has none.
    private static final BigDecimal DELIVERY_FEE = BigDecimal.valueOf(2.99);

    public static BigDecimal computeTotal(OrderRequest request) {
        // Map.of() throws on a null-key lookup rather than falling through to
        // getOrDefault's default, so guard explicitly instead of relying on it.
        PizzaSize size = request.pizzaSize() != null ? request.pizzaSize() : PizzaSize.M;
        BigDecimal total = SIZE_PRICING.get(size);

        total = total.add(saucePrice(request.sauceType()));
        if (request.mozzarella()) total = total.add(STANDARD_CHEESE_PRICE);
        if (request.provolone()) total = total.add(SPECIALTY_CHEESE_PRICE);
        if (request.feta()) total = total.add(SPECIALTY_CHEESE_PRICE);
        if (request.veganCheese()) total = total.add(SPECIALTY_CHEESE_PRICE);

        total = total.add(toppingPrice(request.pepperoni(), request.pepperoniQuantity()));
        total = total.add(toppingPrice(request.sausage(), request.sausageQuantity()));
        total = total.add(toppingPrice(request.peppers(), request.peppersQuantity()));
        total = total.add(toppingPrice(request.olives(), request.olivesQuantity()));

        if (request.deliveryMethod() == DeliveryMethod.DELIVERY || request.deliveryMethod() == null) {
            total = total.add(DELIVERY_FEE);
        }

        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal saucePrice(SauceType sauceType) {
        if (sauceType == null || sauceType == SauceType.NONE) return BigDecimal.ZERO;
        return switch (sauceType) {
            case GARLIC_PARMESAN, ALFREDO, BBQ -> SPECIALTY_SAUCE_PRICE;
            default -> STANDARD_SAUCE_PRICE;
        };
    }

    private static BigDecimal toppingPrice(boolean checked, ToppingQuantity quantity) {
        if (!checked) return BigDecimal.ZERO;
        ToppingQuantity q = quantity != null ? quantity : ToppingQuantity.REGULAR;
        return TOPPING_PRICE.get(q);
    }
}
