package com.pizzamaker.outbox;

import com.pizzamaker.entity.OutboxEvent;
import com.pizzamaker.entity.OutboxStatus;
import com.pizzamaker.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

// Drains the outbox. On each tick it claims a batch of due rows (write-locked so
// multiple instances don't double-dispatch), delivers each, and marks it
// PROCESSED — or, on failure, increments the attempt count and backs off
// exponentially until a max-attempt budget is exhausted (then FAILED).
//
// @Lazy(false) forces eager creation so the @Scheduled method is registered even
// under the dev profile's global lazy-initialization.
@Component
@Lazy(false)
@RequiredArgsConstructor
@Slf4j
public class OutboxRelay {

    private static final int BATCH_SIZE = 50;
    private static final int MAX_ATTEMPTS = 5;

    private final OutboxEventRepository repository;
    private final OutboxDispatcher dispatcher;

    @Scheduled(fixedDelayString = "${app.outbox.poll-ms:2000}")
    @Transactional
    public void dispatchPending() {
        List<OutboxEvent> due = repository.findDueForDispatch(LocalDateTime.now(), PageRequest.of(0, BATCH_SIZE));
        for (OutboxEvent event : due) {
            try {
                dispatcher.dispatch(event);
                event.setStatus(OutboxStatus.PROCESSED);
                event.setProcessedAt(LocalDateTime.now());
            } catch (Exception ex) {
                event.setAttempts(event.getAttempts() + 1);
                if (event.getAttempts() >= MAX_ATTEMPTS) {
                    event.setStatus(OutboxStatus.FAILED);
                    log.error("Outbox event {} ({}) permanently failed after {} attempts",
                            event.getId(), event.getEventType(), event.getAttempts(), ex);
                } else {
                    event.setNextAttemptAt(LocalDateTime.now().plusSeconds(backoffSeconds(event.getAttempts())));
                    log.warn("Outbox event {} ({}) attempt {} failed; will retry",
                            event.getId(), event.getEventType(), event.getAttempts(), ex);
                }
            }
        }
        // Dirty-checked changes flush on transaction commit.
    }

    // 2s, 4s, 8s, 16s — exponential backoff between retries.
    private long backoffSeconds(int attempts) {
        return (long) Math.pow(2, attempts);
    }
}
