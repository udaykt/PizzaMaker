package com.pizzamaker.repository;

import com.pizzamaker.entity.Payment;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @EntityGraph(attributePaths = "order")
    Optional<Payment> findByIntentId(String intentId);

    boolean existsByOrder_IdAndStatus(Long orderId, com.pizzamaker.entity.PaymentStatus status);
}
