package com.pizzamaker.controller;

import com.pizzamaker.dto.response.MenuToppingResponse;
import com.pizzamaker.entity.PizzaSize;
import com.pizzamaker.service.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/menu")
@RequiredArgsConstructor
@Tag(name = "Menu")
public class MenuController {

    private final MenuService menuService;

    @GetMapping("/toppings")
    @Operation(summary = "List available toppings with pricing")
    public List<MenuToppingResponse> getToppings() {
        return menuService.getToppings();
    }

    @GetMapping("/sizes")
    @Operation(summary = "List pizza sizes with pricing")
    public Map<PizzaSize, Integer> getSizes() {
        return menuService.getSizePricing();
    }
}
