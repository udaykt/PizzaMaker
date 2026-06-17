package com.pizzamaker.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pizzamaker.dto.request.OrderRequest;
import com.pizzamaker.entity.BakeLevel;
import com.pizzamaker.entity.CrustStyle;
import com.pizzamaker.entity.DeliveryMethod;
import com.pizzamaker.entity.PizzaSize;
import com.pizzamaker.entity.SauceType;
import com.pizzamaker.entity.ToppingQuantity;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.assertj.core.api.Assertions.assertThat;

// Pins the server-side charge (PricingService) to the shared price book in
// pricing.contract.json. The frontend estimate is pinned to the same file in
// src/utils/pricing.contract.test.js, so the two can never silently diverge:
// changing a price on one side without the other turns a contract test red.
class PricingContractTest {

    private static JsonNode contract;

    @BeforeAll
    static void loadContract() throws IOException {
        // Walk up from the test working directory to the repo root, where the
        // single shared contract lives alongside the frontend that also reads it.
        Path dir = Paths.get(System.getProperty("user.dir")).toAbsolutePath();
        while (dir != null) {
            Path candidate = dir.resolve("pricing.contract.json");
            if (Files.exists(candidate)) {
                contract = new ObjectMapper().readTree(candidate.toFile());
                return;
            }
            dir = dir.getParent();
        }
        throw new IllegalStateException("pricing.contract.json not found above " + System.getProperty("user.dir"));
    }

    private static BigDecimal price(String group, String key) {
        return contract.get(group).get(key).decimalValue();
    }

    private OrderRequest pizza(SauceType sauce, boolean mozzarella, boolean feta,
                               boolean pepperoni, ToppingQuantity pepperoniQuantity,
                               PizzaSize size, DeliveryMethod deliveryMethod) {
        return new OrderRequest(sauce, mozzarella, false, feta, false,
                pepperoni, pepperoniQuantity, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                size, CrustStyle.HAND_TOSSED, BakeLevel.NORMAL, deliveryMethod);
    }

    // A bare medium carryout pizza: its total is exactly the medium size price,
    // so every modifier below can be isolated by subtracting this baseline.
    private OrderRequest plainMedium() {
        return pizza(SauceType.NONE, false, false, false, ToppingQuantity.REGULAR, PizzaSize.M, DeliveryMethod.CARRYOUT);
    }

    private BigDecimal total(OrderRequest req) {
        return PricingService.computeTotal(req);
    }

    @Test
    void sizePrices_matchContract() {
        var small = pizza(SauceType.NONE, false, false, false, ToppingQuantity.REGULAR, PizzaSize.R, DeliveryMethod.CARRYOUT);
        var large = pizza(SauceType.NONE, false, false, false, ToppingQuantity.REGULAR, PizzaSize.L, DeliveryMethod.CARRYOUT);
        assertThat(total(small)).isEqualByComparingTo(price("size", "R"));
        assertThat(total(plainMedium())).isEqualByComparingTo(price("size", "M"));
        assertThat(total(large)).isEqualByComparingTo(price("size", "L"));
    }

    @Test
    void cheesePrices_matchContract() {
        var base = total(plainMedium());
        var withMozzarella = pizza(SauceType.NONE, true, false, false, ToppingQuantity.REGULAR, PizzaSize.M, DeliveryMethod.CARRYOUT);
        var withFeta = pizza(SauceType.NONE, false, true, false, ToppingQuantity.REGULAR, PizzaSize.M, DeliveryMethod.CARRYOUT);
        assertThat(total(withMozzarella).subtract(base)).isEqualByComparingTo(price("cheese", "standard"));
        assertThat(total(withFeta).subtract(base)).isEqualByComparingTo(price("cheese", "specialty"));
    }

    @Test
    void saucePrices_matchContract() {
        var base = total(plainMedium());
        var standardSauce = pizza(SauceType.ROBUST_TOMATO, false, false, false, ToppingQuantity.REGULAR, PizzaSize.M, DeliveryMethod.CARRYOUT);
        var specialtySauce = pizza(SauceType.BBQ, false, false, false, ToppingQuantity.REGULAR, PizzaSize.M, DeliveryMethod.CARRYOUT);
        assertThat(total(standardSauce).subtract(base)).isEqualByComparingTo(price("sauce", "standard"));
        assertThat(total(specialtySauce).subtract(base)).isEqualByComparingTo(price("sauce", "specialty"));
    }

    @Test
    void toppingTierPrices_matchContract() {
        var base = total(plainMedium());
        var light = pizza(SauceType.NONE, false, false, true, ToppingQuantity.LIGHT, PizzaSize.M, DeliveryMethod.CARRYOUT);
        var regular = pizza(SauceType.NONE, false, false, true, ToppingQuantity.REGULAR, PizzaSize.M, DeliveryMethod.CARRYOUT);
        var extra = pizza(SauceType.NONE, false, false, true, ToppingQuantity.EXTRA, PizzaSize.M, DeliveryMethod.CARRYOUT);
        assertThat(total(light).subtract(base)).isEqualByComparingTo(price("topping", "light"));
        assertThat(total(regular).subtract(base)).isEqualByComparingTo(price("topping", "regular"));
        assertThat(total(extra).subtract(base)).isEqualByComparingTo(price("topping", "extra"));
    }

    @Test
    void deliveryFee_matchesContract() {
        var carryout = plainMedium();
        var delivery = pizza(SauceType.NONE, false, false, false, ToppingQuantity.REGULAR, PizzaSize.M, DeliveryMethod.DELIVERY);
        assertThat(total(delivery).subtract(total(carryout)))
                .isEqualByComparingTo(contract.get("deliveryFee").decimalValue());
    }
}
