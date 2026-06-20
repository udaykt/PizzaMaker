package com.pizzamaker.repository;

import com.pizzamaker.entity.OutboxEvent;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {

    // Claims a batch of due rows with a write lock so that, in a multi-instance
    // deployment, two relays never dispatch the same event. The lock is held for
    // the relay transaction; dispatch is fast and local.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT e FROM OutboxEvent e
            WHERE e.status = com.pizzamaker.entity.OutboxStatus.PENDING
              AND e.nextAttemptAt <= :now
            ORDER BY e.createdAt ASC""")
    List<OutboxEvent> findDueForDispatch(@Param("now") LocalDateTime now, Pageable pageable);
}
