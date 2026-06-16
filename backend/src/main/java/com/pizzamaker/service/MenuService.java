package com.pizzamaker.service;

import com.pizzamaker.entity.PizzaSize;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class MenuService {

    public Map<PizzaSize, Integer> getSizePricing() {
        return Map.of(
                PizzaSize.R, 8,
                PizzaSize.M, 12,
                PizzaSize.L, 16
        );
    }
}
