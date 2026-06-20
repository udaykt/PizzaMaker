package com.pizzamaker.repository;

import com.pizzamaker.dto.response.RevenuePoint;
import com.pizzamaker.dto.response.StatusFunnelPoint;
import com.pizzamaker.entity.Order;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;

import java.time.LocalDateTime;
import java.util.List;
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

    Optional<Order> findByIdempotencyKey(String idempotencyKey);

    // Daily revenue. Grouping uses HQL extract functions (year/month/day) which
    // Hibernate translates per dialect, so it runs unchanged on H2 and Postgres.
    @Query("""
            SELECT new com.pizzamaker.dto.response.RevenuePoint(
                YEAR(o.createdAt), MONTH(o.createdAt), DAY(o.createdAt),
                COUNT(o), SUM(o.price))
            FROM Order o
            WHERE o.createdAt >= :from
            GROUP BY YEAR(o.createdAt), MONTH(o.createdAt), DAY(o.createdAt)
            ORDER BY YEAR(o.createdAt), MONTH(o.createdAt), DAY(o.createdAt)""")
    List<RevenuePoint> revenueSince(@Param("from") LocalDateTime from);

    @Query("""
            SELECT new com.pizzamaker.dto.response.StatusFunnelPoint(o.status, COUNT(o))
            FROM Order o
            GROUP BY o.status""")
    List<StatusFunnelPoint> statusFunnel();
}
