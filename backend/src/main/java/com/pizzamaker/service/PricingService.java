package com.pizzamaker.service;

import com.pizzamaker.dto.request.OrderRequest;
import com.pizzamaker.entity.PizzaSize;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

// Computes the order total server-side. The client never sends a price —
// OrderRequest has no price field — so a tampered request can't change what
// gets charged. Keep these constants in sync with the frontend's live
// running-total display in PizzaHub.js so the estimate shown while building
// matches what's actually stored.
public final class PricingService {

    private PricingService() {}

    // Mirrors MenuService.getSizePricing() — duplicated here (rather than
    // injected) to keep this a pure, dependency-free function that's trivial
    // to unit test.
    private static final Map<PizzaSize, BigDecimal> SIZE_PRICING = Map.of(
            PizzaSize.R, BigDecimal.valueOf(8),
            PizzaSize.M, BigDecimal.valueOf(12),
            PizzaSize.L, BigDecimal.valueOf(16)
    );

    private static final BigDecimal BASE_ITEM_PRICE = BigDecimal.valueOf(0.5);
    private static final BigDecimal TOPPING_PRICE_REGULAR = BigDecimal.valueOf(1.5);
    private static final BigDecimal TOPPING_PRICE_MEDIUM = BigDecimal.valueOf(2.0);

    public static BigDecimal computeTotal(OrderRequest request) {
        // Map.of() throws on a null-key lookup rather than falling through to
        // getOrDefault's default, so guard explicitly instead of relying on it.
        PizzaSize size = request.pizzaSize() != null ? request.pizzaSize() : PizzaSize.M;
        BigDecimal total = SIZE_PRICING.get(size);

        if (request.sauce()) total = total.add(BASE_ITEM_PRICE);
        if (request.mozzarella()) total = total.add(BASE_ITEM_PRICE);
        if (request.cheese()) total = total.add(BASE_ITEM_PRICE);

        total = total.add(toppingPrice(request.pepperoni(), request.pepperoniMedium()));
        total = total.add(toppingPrice(request.sausage(), request.sausageMedium()));
        total = total.add(toppingPrice(request.peppers(), request.peppersMedium()));
        total = total.add(toppingPrice(request.olives(), request.olivesMedium()));

        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal toppingPrice(boolean checked, boolean medium) {
        if (!checked) return BigDecimal.ZERO;
        return medium ? TOPPING_PRICE_MEDIUM : TOPPING_PRICE_REGULAR;
    }
}
