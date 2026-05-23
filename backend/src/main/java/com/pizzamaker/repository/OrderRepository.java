package com.pizzamaker.repository;

import com.pizzamaker.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByUser_Id(Long userId, Pageable pageable);
    Optional<Order> findByOid(String oid);
}
