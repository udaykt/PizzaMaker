package com.pizzamaker.service;

import com.pizzamaker.dto.request.UpdateStatusRequest;
import com.pizzamaker.dto.response.PaymentResponse;
import com.pizzamaker.entity.Order;
import com.pizzamaker.entity.OrderStatus;
import com.pizzamaker.entity.Payment;
import com.pizzamaker.entity.PaymentStatus;
import com.pizzamaker.exception.ResourceNotFoundException;
import com.pizzamaker.payment.PaymentProvider;
import com.pizzamaker.repository.OrderRepository;
import com.pizzamaker.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    // Provider-side event names (Stripe-shaped).
    public static final String EVENT_SUCCEEDED = "payment_intent.succeeded";
    public static final String EVENT_FAILED = "payment_intent.payment_failed";

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PaymentProvider paymentProvider;
    private final OrderService orderService;

    @Transactional
    public PaymentResponse createIntent(String email, String oid) {
        Order order = orderRepository.findByOid(oid)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + oid));
        if (!order.getUser().getEmailId().equals(email)) {
            // Don't leak existence of other users' orders.
            throw new ResourceNotFoundException("Order not found: " + oid);
        }
        if (paymentRepository.existsByOrder_IdAndStatus(order.getId(), PaymentStatus.SUCCEEDED)) {
            throw new IllegalArgumentException("Order " + oid + " is already paid");
        }

        var intent = paymentProvider.createIntent(oid, order.getPrice(), "USD");
        Payment payment = paymentRepository.save(Payment.builder()
                .order(order)
                .provider(paymentProvider.name())
                .intentId(intent.intentId())
                .amount(order.getPrice())
                .currency("USD")
                .status(PaymentStatus.REQUIRES_PAYMENT)
                .build());

        return PaymentResponse.of(payment, intent.clientSecret());
    }

    // Idempotent: a provider may deliver the same webhook more than once, so a
    // payment already in a terminal state is a no-op. The intent_id is the anchor.
    @Transactional
    public void handleWebhook(String eventType, String intentId) {
        Payment payment = paymentRepository.findByIntentId(intentId).orElse(null);
        if (payment == null) {
            log.warn("Webhook for unknown payment intent {} ({}) — ignoring", intentId, eventType);
            return;
        }
        if (payment.getStatus() != PaymentStatus.REQUIRES_PAYMENT) {
            log.debug("Webhook {} for intent {} already in terminal state {} — ignoring",
                    eventType, intentId, payment.getStatus());
            return;
        }

        switch (eventType) {
            case EVENT_SUCCEEDED -> {
                payment.setStatus(PaymentStatus.SUCCEEDED);
                // Advance the order only from PENDING, keeping the transition legal
                // and the handler idempotent.
                if (payment.getOrder().getStatus() == OrderStatus.PENDING) {
                    orderService.updateStatus(payment.getOrder().getOid(),
                            new UpdateStatusRequest(OrderStatus.CONFIRMED));
                }
                log.info("Payment {} succeeded; order {} confirmed",
                        intentId, payment.getOrder().getOid());
            }
            case EVENT_FAILED -> {
                payment.setStatus(PaymentStatus.FAILED);
                log.info("Payment {} failed for order {}", intentId, payment.getOrder().getOid());
            }
            default -> log.debug("Unhandled webhook event type {} for intent {}", eventType, intentId);
        }
    }
}
