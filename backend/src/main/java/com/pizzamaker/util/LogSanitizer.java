package com.pizzamaker.util;

// Keeps PII out of logs. Emails are identifying data, so they're masked to a
// recognizable-but-not-reversible form (e.g. "alice@example.com" -> "a***@example.com")
// before they ever reach an appender.
public final class LogSanitizer {

    private LogSanitizer() {}

    public static String maskEmail(String email) {
        if (email == null || email.isBlank()) return "<none>";
        int at = email.indexOf('@');
        if (at <= 0) return "***";
        String local = email.substring(0, at);
        String domain = email.substring(at);
        String visible = local.substring(0, 1);
        return visible + "***" + domain;
    }
}
