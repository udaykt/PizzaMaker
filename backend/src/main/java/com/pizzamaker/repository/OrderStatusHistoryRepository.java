package com.pizzamaker.repository;

import com.pizzamaker.entity.OrderStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderStatusHistoryRepository extends JpaRepository<OrderStatusHistory, Long> {

    List<OrderStatusHistory> findByOrder_IdOrderByChangedAtAsc(Long orderId);
}
