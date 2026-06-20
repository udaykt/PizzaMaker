package com.pizzamaker.service;

import com.pizzamaker.dto.request.OrderRequest;
import com.pizzamaker.entity.DeliveryMethod;
import com.pizzamaker.entity.LineType;
import com.pizzamaker.entity.PizzaSize;
import com.pizzamaker.entity.SauceType;
import com.pizzamaker.entity.ToppingQuantity;
import com.pizzamaker.entity.ToppingSelection;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

// Computes the order total server-side. The client never sends a price —
// OrderRequest has no price field — so a tampered request can't change what
// gets charged. Keep these constants in sync with the frontend's live
// running-total display in src/utils/pricing.js so the estimate shown while
// building matches what's actually stored.
public final class PricingService {

    private PricingService() {}

    // One priced component of an order. computeBreakdown returns these in the
    // order they appear on a receipt, and they are persisted as OrderLineItem
    // rows so a receipt is a snapshot that survives later price changes.
    public record LineItem(LineType type, String refId, String label, BigDecimal amount) {}

    // Single source of truth for size pricing: the /menu/sizes endpoint
    // (MenuService.getSizePricing) derives its payload from this map, so the
    // estimate the client fetches and the price charged here can't diverge.
    public static final Map<PizzaSize, BigDecimal> SIZE_PRICING = Map.of(
            PizzaSize.R, BigDecimal.valueOf(8),
            PizzaSize.M, BigDecimal.valueOf(12),
            PizzaSize.L, BigDecimal.valueOf(16)
    );

    private static final BigDecimal STANDARD_CHEESE_PRICE = BigDecimal.valueOf(0.5);
    // Specialty cheeses (parmesan-asiago/feta/ricotta/vegan) cost more than
    // standard ones (mozzarella/cheddar), matching Domino's premium add-on pricing.
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

    // The order total is exactly the sum of the receipt's line items, so the
    // stored total and the snapshotted breakdown can never disagree.
    public static BigDecimal computeTotal(OrderRequest request) {
        BigDecimal total = BigDecimal.ZERO;
        for (LineItem item : computeBreakdown(request)) {
            total = total.add(item.amount());
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    public static List<LineItem> computeBreakdown(OrderRequest request) {
        List<LineItem> items = new ArrayList<>();

        // Map.of() throws on a null-key lookup rather than falling through to a
        // default, so guard the size explicitly.
        PizzaSize size = request.pizzaSize() != null ? request.pizzaSize() : PizzaSize.M;
        items.add(new LineItem(LineType.SIZE, size.name(), sizeLabel(size) + " pizza", SIZE_PRICING.get(size)));

        BigDecimal sauce = saucePrice(request.sauceType());
        if (sauce.signum() > 0) {
            items.add(new LineItem(LineType.SAUCE, request.sauceType().name(),
                    titleCase(request.sauceType().name()) + " sauce", sauce));
        }

        addCheese(items, request.mozzarella(), "mozzarella", "Mozzarella", STANDARD_CHEESE_PRICE);
        addCheese(items, request.cheddar(), "cheddar", "Cheddar", STANDARD_CHEESE_PRICE);
        addCheese(items, request.parmesanAsiago(), "parmesanAsiago", "Parmesan-Asiago", SPECIALTY_CHEESE_PRICE);
        addCheese(items, request.feta(), "feta", "Feta", SPECIALTY_CHEESE_PRICE);
        addCheese(items, request.ricotta(), "ricotta", "Ricotta", SPECIALTY_CHEESE_PRICE);
        addCheese(items, request.veganCheese(), "veganCheese", "Vegan cheese", SPECIALTY_CHEESE_PRICE);

        if (request.toppings() != null) {
            for (ToppingSelection topping : request.toppings()) {
                ToppingQuantity q = topping.quantity() != null ? topping.quantity() : ToppingQuantity.REGULAR;
                items.add(new LineItem(LineType.TOPPING, topping.id(),
                        titleCase(topping.id()) + " (" + titleCase(q.name()) + ")", TOPPING_PRICE.get(q)));
            }
        }

        if (request.deliveryMethod() == DeliveryMethod.DELIVERY || request.deliveryMethod() == null) {
            items.add(new LineItem(LineType.DELIVERY, null, "Delivery fee", DELIVERY_FEE));
        }

        return items;
    }

    private static void addCheese(List<LineItem> items, boolean selected, String refId, String label, BigDecimal price) {
        if (selected) {
            items.add(new LineItem(LineType.CHEESE, refId, label, price));
        }
    }

    private static BigDecimal saucePrice(SauceType sauceType) {
        if (sauceType == null || sauceType == SauceType.NONE) return BigDecimal.ZERO;
        return switch (sauceType) {
            case GARLIC_PARMESAN, ALFREDO, BBQ -> SPECIALTY_SAUCE_PRICE;
            default -> STANDARD_SAUCE_PRICE;
        };
    }

    private static String sizeLabel(PizzaSize size) {
        return switch (size) {
            case R -> "Regular";
            case M -> "Medium";
            case L -> "Large";
        };
    }

    // "ROBUST_TOMATO" -> "Robust Tomato", "EXTRA" -> "Extra", "pepperoni" -> "Pepperoni".
    private static String titleCase(String raw) {
        String[] parts = raw.toLowerCase().split("[_ ]");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part.isEmpty()) continue;
            if (sb.length() > 0) sb.append(' ');
            sb.append(Character.toUpperCase(part.charAt(0))).append(part.substring(1));
        }
        return sb.toString();
    }
}
