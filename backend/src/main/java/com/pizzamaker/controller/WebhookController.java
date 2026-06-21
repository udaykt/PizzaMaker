package com.pizzamaker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pizzamaker.dto.request.PaymentWebhookRequest;
import com.pizzamaker.payment.WebhookVerifier;
import com.pizzamaker.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

// Public, unauthenticated endpoint the payment provider calls. Trust comes from
// the HMAC signature over the raw body, not a JWT, so it's permitted in
// SecurityConfig. The handler is idempotent (see PaymentService).
@RestController
@RequestMapping("/api/v1/webhooks")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Webhooks")
public class WebhookController {

    public static final String SIGNATURE_HEADER = "X-Signature";

    private final WebhookVerifier webhookVerifier;
    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;

    @PostMapping("/payment")
    @Operation(summary = "Payment provider webhook (HMAC-signed)")
    public ResponseEntity<Map<String, Boolean>> payment(
            @RequestBody String rawBody,
            @RequestHeader(value = SIGNATURE_HEADER, required = false) String signature) throws Exception {

        if (!webhookVerifier.isValid(rawBody, signature)) {
            log.warn("Rejected payment webhook with invalid signature");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("received", false));
        }

        PaymentWebhookRequest event = objectMapper.readValue(rawBody, PaymentWebhookRequest.class);
        paymentService.handleWebhook(event.type(), event.intentId());
        return ResponseEntity.ok(Map.of("received", true));
    }
}
