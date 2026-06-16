package com.pizzamaker.service;

import com.pizzamaker.dto.request.OrderRequest;
import com.pizzamaker.entity.BakeLevel;
import com.pizzamaker.entity.CrustStyle;
import com.pizzamaker.entity.DeliveryMethod;
import com.pizzamaker.entity.PizzaSize;
import com.pizzamaker.entity.SauceType;
import com.pizzamaker.entity.ToppingQuantity;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

class PricingServiceTest {

    private OrderRequest request(SauceType sauceType, boolean mozzarella, boolean provolone, boolean feta, boolean veganCheese,
                                  boolean pepperoni, ToppingQuantity pepperoniQuantity,
                                  boolean sausage, ToppingQuantity sausageQuantity,
                                  boolean peppers, ToppingQuantity peppersQuantity,
                                  boolean olives, ToppingQuantity olivesQuantity,
                                  PizzaSize size, DeliveryMethod deliveryMethod) {
        return new OrderRequest(sauceType, mozzarella, provolone, feta, veganCheese, pepperoni, pepperoniQuantity,
                sausage, sausageQuantity, peppers, peppersQuantity, olives, olivesQuantity,
                size, CrustStyle.HAND_TOSSED, BakeLevel.NORMAL, deliveryMethod);
    }

    // Most tests use carryout + no sauce/cheese so the fee and base price
    // don't have to be netted out of every assertion.
    private OrderRequest carryout(boolean pepperoni, ToppingQuantity pepperoniQuantity,
                                   boolean sausage, ToppingQuantity sausageQuantity,
                                   boolean peppers, ToppingQuantity peppersQuantity,
                                   boolean olives, ToppingQuantity olivesQuantity,
                                   PizzaSize size) {
        return request(SauceType.NONE, false, false, false, false, pepperoni, pepperoniQuantity,
                sausage, sausageQuantity, peppers, peppersQuantity, olives, olivesQuantity,
                size, DeliveryMethod.CARRYOUT);
    }

    @Test
    void plainCarryoutPizza_chargesOnlySizePrice() {
        var req = carryout(false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, PizzaSize.M);
        assertThat(PricingService.computeTotal(req)).isEqualByComparingTo("12.00");
    }

    @Test
    void sizePricing_variesByRMl() {
        var regularSize = carryout(false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, PizzaSize.R);
        var largeSize = carryout(false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, PizzaSize.L);
        assertThat(PricingService.computeTotal(regularSize)).isEqualByComparingTo("8.00");
        assertThat(PricingService.computeTotal(largeSize)).isEqualByComparingTo("16.00");
    }

    @Test
    void standardSauceAndCheese_chargeFiftyCentsEach() {
        var req = request(SauceType.ROBUST_TOMATO, true, false, false, false, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                PizzaSize.M, DeliveryMethod.CARRYOUT);
        // 12.00 + 0.50 (sauce) + 0.50 (mozzarella)
        assertThat(PricingService.computeTotal(req)).isEqualByComparingTo("13.00");
    }

    @Test
    void specialtySauces_costMoreThanStandard() {
        var marinara = request(SauceType.MARINARA, false, false, false, false, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                PizzaSize.M, DeliveryMethod.CARRYOUT);
        var bbq = request(SauceType.BBQ, false, false, false, false, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                PizzaSize.M, DeliveryMethod.CARRYOUT);
        assertThat(PricingService.computeTotal(marinara)).isEqualByComparingTo("12.50");
        assertThat(PricingService.computeTotal(bbq)).isEqualByComparingTo("13.25");
    }

    @Test
    void noSauce_addsNoCharge() {
        var req = carryout(false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, PizzaSize.M);
        assertThat(PricingService.computeTotal(req)).isEqualByComparingTo("12.00");
    }

    @Test
    void specialtyCheeses_costMoreThanMozzarella() {
        var feta = request(SauceType.NONE, false, false, true, false, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                PizzaSize.M, DeliveryMethod.CARRYOUT);
        // 12.00 + 1.00 (feta) vs mozzarella's 12.00 + 0.50
        assertThat(PricingService.computeTotal(feta)).isEqualByComparingTo("13.00");
    }

    @Test
    void multipleCheeses_stack() {
        var req = request(SauceType.NONE, true, true, true, true, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                PizzaSize.M, DeliveryMethod.CARRYOUT);
        // 12.00 + 0.50 (mozzarella) + 1.00*3 (provolone, feta, vegan)
        assertThat(PricingService.computeTotal(req)).isEqualByComparingTo("15.50");
    }

    @Test
    void toppingQuantityTiers_chargeDifferently() {
        var light = carryout(true, ToppingQuantity.LIGHT, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, PizzaSize.M);
        var regular = carryout(true, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, PizzaSize.M);
        var extra = carryout(true, ToppingQuantity.EXTRA, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, PizzaSize.M);
        assertThat(PricingService.computeTotal(light)).isEqualByComparingTo("13.00");
        assertThat(PricingService.computeTotal(regular)).isEqualByComparingTo("13.50");
        assertThat(PricingService.computeTotal(extra)).isEqualByComparingTo("15.00");
    }

    @Test
    void uncheckedTopping_isIgnoredRegardlessOfQuantity() {
        var req = carryout(false, ToppingQuantity.EXTRA, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, PizzaSize.M);
        assertThat(PricingService.computeTotal(req)).isEqualByComparingTo("12.00");
    }

    @Test
    void nullSauceType_addsNoCharge() {
        var req = request(null, false, false, false, false, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                PizzaSize.M, DeliveryMethod.CARRYOUT);
        assertThat(PricingService.computeTotal(req)).isEqualByComparingTo("12.00");
    }

    @Test
    void fullyLoadedPizza_sumsCorrectly() {
        var req = request(SauceType.BBQ, true, true, true, true, true, ToppingQuantity.EXTRA,
                true, ToppingQuantity.EXTRA, true, ToppingQuantity.EXTRA, true, ToppingQuantity.EXTRA,
                PizzaSize.L, DeliveryMethod.CARRYOUT);
        // 16 + 1.25 (bbq) + 0.5 (mozz) + 1.0*3 (provolone/feta/vegan) + 4*3.0 (toppings extra)
        assertThat(PricingService.computeTotal(req)).isEqualByComparingTo(BigDecimal.valueOf(16 + 1.25 + 3.5 + 12.0));
    }

    @Test
    void unknownOrNullSize_defaultsToMediumPricing() {
        var req = new OrderRequest(SauceType.NONE, false, false, false, false, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                null, CrustStyle.HAND_TOSSED, BakeLevel.NORMAL, DeliveryMethod.CARRYOUT);
        assertThat(PricingService.computeTotal(req)).isEqualByComparingTo("12.00");
    }

    @Test
    void delivery_addsFeeOnTopOfCarryoutPrice() {
        var carryoutReq = carryout(false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, PizzaSize.M);
        var deliveryReq = request(SauceType.NONE, false, false, false, false, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                PizzaSize.M, DeliveryMethod.DELIVERY);
        assertThat(PricingService.computeTotal(deliveryReq))
                .isEqualByComparingTo(PricingService.computeTotal(carryoutReq).add(BigDecimal.valueOf(2.99)));
    }

    @Test
    void nullDeliveryMethod_defaultsToChargingDeliveryFee() {
        var req = new OrderRequest(SauceType.NONE, false, false, false, false, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                PizzaSize.M, CrustStyle.HAND_TOSSED, BakeLevel.NORMAL, null);
        assertThat(PricingService.computeTotal(req)).isEqualByComparingTo("14.99");
    }
}
