package com.pizzamaker.repository;

import com.pizzamaker.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.lang.NonNull;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @Override
    @NonNull
    @EntityGraph(attributePaths = "user")
    Page<Order> findAll(@NonNull Pageable pageable);

    @EntityGraph(attributePaths = "user")
    Page<Order> findByUser_Id(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = "user")
    Optional<Order> findByOid(String oid);
}
