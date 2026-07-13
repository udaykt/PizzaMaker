package com.pizzamaker.repository;

import com.pizzamaker.entity.OutboxEvent;
import com.pizzamaker.entity.OutboxStatus;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {

    long countByStatus(OutboxStatus status);

    // Claims a batch of due rows with a write lock so that, in a multi-instance
    // deployment, two relays never dispatch the same event.
    //
    // SKIP LOCKED is what makes that claim scale. A bare FOR UPDATE makes pod B's
    // query BLOCK on the rows pod A is holding until A's transaction commits, so N
    // replicas take turns instead of working in parallel — the relay silently
    // becomes single-threaded no matter how far you scale out, and every pod's
    // poll tick is hostage to the slowest dispatch on any other pod. SKIP LOCKED
    // tells the database to pass over already-locked rows, so each pod claims a
    // disjoint batch and they drain the outbox concurrently.
    //
    // The magic value -2 is Hibernate's LockOptions.SKIP_LOCKED. PostgreSQL (prod)
    // supports it; H2 (dev/test) does not, and Hibernate simply omits the clause
    // there — harmless, because a dev run has one instance anyway.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "-2"))
    @Query("""
            SELECT e FROM OutboxEvent e
            WHERE e.status = com.pizzamaker.entity.OutboxStatus.PENDING
              AND e.nextAttemptAt <= :now
            ORDER BY e.createdAt ASC""")
    List<OutboxEvent> findDueForDispatch(@Param("now") LocalDateTime now, Pageable pageable);
}
