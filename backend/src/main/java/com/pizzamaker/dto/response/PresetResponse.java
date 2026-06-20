package com.pizzamaker.dto.response;

import com.pizzamaker.entity.PizzaPreset;
import com.pizzamaker.entity.ToppingSelection;

import java.util.List;

// Public menu view of a preset pizza.
public record PresetResponse(
        String code,
        String name,
        String description,
        String pizzaSize,
        String sauceType,
        String crustStyle,
        List<ToppingSelection> toppings
) {
    public static PresetResponse from(PizzaPreset p) {
        return new PresetResponse(
                p.getCode(),
                p.getName(),
                p.getDescription(),
                p.getPizzaSize().name(),
                p.getSauceType().name(),
                p.getCrustStyle().name(),
                p.getToppings()
        );
    }
}
