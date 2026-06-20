package com.pizzamaker.controller;

import com.pizzamaker.dto.response.RevenuePoint;
import com.pizzamaker.dto.response.StatusFunnelPoint;
import com.pizzamaker.dto.response.ToppingPopularity;
import com.pizzamaker.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/analytics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Analytics")
@SecurityRequirement(name = "BearerAuth")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/revenue")
    @Operation(summary = "Daily revenue, order count and average order value — ADMIN only")
    public List<RevenuePoint> revenue(@RequestParam(defaultValue = "30") int days) {
        return analyticsService.revenue(days);
    }

    @GetMapping("/popular-toppings")
    @Operation(summary = "Toppings ranked by how often they're ordered — ADMIN only")
    public List<ToppingPopularity> popularToppings() {
        return analyticsService.popularToppings();
    }

    @GetMapping("/funnel")
    @Operation(summary = "Order counts per status — ADMIN only")
    public List<StatusFunnelPoint> funnel() {
        return analyticsService.statusFunnel();
    }
}
