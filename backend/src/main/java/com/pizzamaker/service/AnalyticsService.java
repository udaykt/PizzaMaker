package com.pizzamaker.service;

import com.pizzamaker.dto.response.RevenuePoint;
import com.pizzamaker.dto.response.StatusFunnelPoint;
import com.pizzamaker.dto.response.ToppingPopularity;
import com.pizzamaker.repository.OrderLineItemRepository;
import com.pizzamaker.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// Read-only reporting over orders and their snapshotted line items. All
// aggregation runs in the database (JPQL group-by projections), not in Java.
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final OrderLineItemRepository orderLineItemRepository;

    public List<RevenuePoint> revenue(int days) {
        LocalDateTime from = LocalDate.now().minusDays(Math.max(days - 1, 0)).atStartOfDay();
        return orderRepository.revenueSince(from);
    }

    public List<ToppingPopularity> popularToppings() {
        return orderLineItemRepository.findToppingPopularity();
    }

    public List<StatusFunnelPoint> statusFunnel() {
        return orderRepository.statusFunnel();
    }
}
