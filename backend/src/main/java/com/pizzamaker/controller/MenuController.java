package com.pizzamaker.controller;

import com.pizzamaker.dto.response.PresetResponse;
import com.pizzamaker.dto.response.ToppingResponse;
import com.pizzamaker.entity.PizzaSize;
import com.pizzamaker.service.CatalogService;
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
    private final CatalogService catalogService;

    @GetMapping("/sizes")
    @Operation(summary = "List pizza sizes with pricing")
    public Map<PizzaSize, Integer> getSizes() {
        return menuService.getSizePricing();
    }

    @GetMapping("/toppings")
    @Operation(summary = "List the toppings the kitchen currently offers")
    public List<ToppingResponse> getToppings() {
        return catalogService.activeToppings().stream().map(ToppingResponse::from).toList();
    }

    @GetMapping("/presets")
    @Operation(summary = "List the available preset pizzas")
    public List<PresetResponse> getPresets() {
        return catalogService.activePresets().stream().map(PresetResponse::from).toList();
    }
}
