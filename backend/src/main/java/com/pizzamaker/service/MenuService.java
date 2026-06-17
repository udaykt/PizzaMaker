package com.pizzamaker.service;

import com.pizzamaker.entity.PizzaSize;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

@Service
public class MenuService {

    // Derived from PricingService's authoritative price map so the menu the
    // client sees and the total it gets charged share one definition.
    public Map<PizzaSize, Integer> getSizePricing() {
        return PricingService.SIZE_PRICING.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().intValueExact()));
    }
}
