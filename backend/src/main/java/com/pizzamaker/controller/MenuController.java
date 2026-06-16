package com.pizzamaker.controller;

import com.pizzamaker.entity.PizzaSize;
import com.pizzamaker.service.MenuService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/menu")
@RequiredArgsConstructor
@Tag(name = "Menu")
public class MenuController {

    private final MenuService menuService;

    @GetMapping("/sizes")
    @Operation(summary = "List pizza sizes with pricing")
    public Map<PizzaSize, Integer> getSizes() {
        return menuService.getSizePricing();
    }
}
