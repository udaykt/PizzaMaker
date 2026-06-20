package com.pizzamaker.dto.response;

import com.pizzamaker.entity.Topping;

// Public menu view of a topping (no internal id).
public record ToppingResponse(String code, String name, String category) {

    public static ToppingResponse from(Topping t) {
        return new ToppingResponse(t.getCode(), t.getName(), t.getCategory());
    }
}
