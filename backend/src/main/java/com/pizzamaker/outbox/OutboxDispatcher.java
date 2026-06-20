package com.pizzamaker.outbox;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pizzamaker.dto.response.OrderStatusUpdateResponse;
import com.pizzamaker.entity.OutboxEvent;
import com.pizzamaker.event.OrderPlacedEvent;
import com.pizzamaker.event.OrderStatusChangedEvent;
import com.pizzamaker.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

// Consumer side: turns a stored outbox row back into its typed payload and
// performs the actual side effect. Any exception propagates to the relay, which
// records the failure and schedules a retry.
@Component
@RequiredArgsConstructor
public class OutboxDispatcher {

    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public void dispatch(OutboxEvent event) throws Exception {
        switch (event.getEventType()) {
            case OutboxService.ORDER_PLACED -> {
                OrderPlacedEvent p = objectMapper.readValue(event.getPayload(), OrderPlacedEvent.class);
                notificationService.sendOrderConfirmation(p.email(), p.oid());
            }
            case OutboxService.ORDER_STATUS_CHANGED -> {
                OrderStatusChangedEvent p = objectMapper.readValue(event.getPayload(), OrderStatusChangedEvent.class);
                // Route only to the owning user's session.
                messagingTemplate.convertAndSendToUser(
                        p.email(),
                        "/queue/orders",
                        new OrderStatusUpdateResponse(p.oid(), p.uid(), p.status()));
            }
            default -> throw new IllegalArgumentException("Unknown outbox event type: " + event.getEventType());
        }
    }
}
