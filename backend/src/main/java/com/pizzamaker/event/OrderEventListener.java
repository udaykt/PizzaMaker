package com.pizzamaker.event;

import com.pizzamaker.dto.response.OrderStatusUpdateResponse;
import com.pizzamaker.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

// Runs order side effects only AFTER the database transaction commits. This is
// the key production-safety property: a notification or websocket failure can't
// roll back a committed order, and a rolled-back order never triggers a
// "your order is placed" message.
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventListener {

    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onOrderPlaced(OrderPlacedEvent event) {
        notificationService.sendOrderConfirmation(event.email(), event.oid());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onStatusChanged(OrderStatusChangedEvent event) {
        // Route the update only to the owning user's session.
        messagingTemplate.convertAndSendToUser(
                event.email(),
                "/queue/orders",
                new OrderStatusUpdateResponse(event.oid(), event.uid(), event.status()));
        log.debug("Pushed status {} for order {} to {}", event.status(), event.oid(), event.email());
    }
}
