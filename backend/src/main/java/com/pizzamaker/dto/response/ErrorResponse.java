package com.pizzamaker.dto.response;

import java.time.LocalDateTime;
import java.util.Map;

public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String path,
        Map<String, String> fieldErrors
) {
    public ErrorResponse(int status, String error, String path) {
        this(LocalDateTime.now(), status, error, path, null);
    }

    public ErrorResponse(int status, String error, String path, Map<String, String> fieldErrors) {
        this(LocalDateTime.now(), status, error, path, fieldErrors);
    }
}
