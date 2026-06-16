package com.pizzamaker.service;

import com.pizzamaker.dto.request.OrderRequest;
import com.pizzamaker.entity.BakeLevel;
import com.pizzamaker.entity.CrustStyle;
import com.pizzamaker.entity.PizzaSize;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class PricingServiceTest {

    private OrderRequest request(boolean sauce, boolean mozzarella, boolean cheese,
                                  boolean pepperoni, boolean pepperoniMedium,
                                  boolean sausage, boolean sausageMedium,
                                  boolean peppers, boolean peppersMedium,
                                  boolean olives, boolean olivesMedium,
                                  PizzaSize size) {
        return new OrderRequest(sauce, mozzarella, cheese, pepperoni, pepperoniMedium,
                sausage, sausageMedium, peppers, peppersMedium, olives, olivesMedium,
                size, CrustStyle.CLASSIC, BakeLevel.GOLDEN);
    }

    @Test
    void plainPizza_chargesOnlySizePrice() {
        var req = request(false, false, false, false, false, false, false, false, false, false, false, PizzaSize.M);
        assertThat(PricingService.computeTotal(req)).isEqualByComparingTo("12.00");
    }

    @Test
    void sizePricing_variesByRMl() {
        assertThat(PricingService.computeTotal(
                request(false, false, false, false, false, false, false, false, false, false, false, PizzaSize.R)
        )).isEqualByComparingTo("8.00");
        assertThat(PricingService.computeTotal(
                request(false, false, false, false, false, false, false, false, false, false, false, PizzaSize.L)
        )).isEqualByComparingTo("16.00");
    }

    @Test
    void baseIngredients_addFiftyCentsEach() {
        var req = request(true, true, true, false, false, false, false, false, false, false, false, PizzaSize.M);
        // 12.00 + 3 * 0.50
        assertThat(PricingService.computeTotal(req)).isEqualByComparingTo("13.50");
    }

    @Test
    void toppingRegularVsMedium_chargesDifferently() {
        var regular = request(false, false, false, true, false, false, false, false, false, false, false, PizzaSize.M);
        var medium = request(false, false, false, true, true, false, false, false, false, false, false, PizzaSize.M);
        assertThat(PricingService.computeTotal(regular)).isEqualByComparingTo("13.50"); // 12 + 1.5
        assertThat(PricingService.computeTotal(medium)).isEqualByComparingTo("14.00");  // 12 + 2.0
    }

    @Test
    void uncheckedToppingMedium_isIgnored() {
        // medium=true but checked=false must not add a charge
        var req = request(false, false, false, false, true, false, false, false, false, false, false, PizzaSize.M);
        assertThat(PricingService.computeTotal(req)).isEqualByComparingTo("12.00");
    }

    @Test
    void fullyLoadedPizza_sumsCorrectly() {
        var req = request(true, true, true, true, true, true, true, true, true, true, true, PizzaSize.L);
        // 16 + 3*0.5 (base) + 4*2.0 (all toppings medium)
        assertThat(PricingService.computeTotal(req)).isEqualByComparingTo(BigDecimal.valueOf(16 + 1.5 + 8.0));
    }

    @Test
    void unknownOrNullSize_defaultsToMediumPricing() {
        var req = new OrderRequest(false, false, false, false, false, false, false, false, false, false, false,
                null, CrustStyle.CLASSIC, BakeLevel.GOLDEN);
        assertThat(PricingService.computeTotal(req)).isEqualByComparingTo("12.00");
    }
}
