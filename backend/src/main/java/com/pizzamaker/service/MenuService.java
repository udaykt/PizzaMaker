package com.pizzamaker.service;

import com.pizzamaker.dto.response.MenuToppingResponse;
import com.pizzamaker.entity.PizzaSize;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MenuService {

    public List<MenuToppingResponse> getToppings() {
        return List.of(
                new MenuToppingResponse("Pepperoni", 20, 40),
                new MenuToppingResponse("Sausage", 20, 40),
                new MenuToppingResponse("Peppers", 15, 30),
                new MenuToppingResponse("Olives", 15, 30)
        );
    }

    public Map<PizzaSize, Integer> getSizePricing() {
        return Map.of(
                PizzaSize.R, 8,
                PizzaSize.M, 12,
                PizzaSize.L, 16
        );
    }
}
