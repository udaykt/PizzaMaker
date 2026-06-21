package com.pizzamaker.payment;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

// Verifies inbound payment webhooks with an HMAC-SHA256 signature over the raw
// body (the same scheme Stripe uses with its signing secret), so the endpoint can
// be public yet only act on payloads the provider actually sent.
@Component
public class WebhookVerifier {

    private final byte[] secret;

    public WebhookVerifier(@Value("${app.webhook.secret}") String secret) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to compute webhook signature", e);
        }
    }

    public boolean isValid(String payload, String signature) {
        if (signature == null || signature.isBlank()) return false;
        // Constant-time comparison to avoid leaking the signature via timing.
        return MessageDigest.isEqual(
                sign(payload).getBytes(StandardCharsets.UTF_8),
                signature.trim().getBytes(StandardCharsets.UTF_8));
    }
}
