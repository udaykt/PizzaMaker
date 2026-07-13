package com.pizzamaker.messaging;

// A defect in the message itself: retrying it will fail identically every time,
// so the error handler routes it straight to the DLT without burning the backoff
// budget. Contrast with a transient failure (broker blip, DB timeout), which is
// worth retrying.
public class NonRetryableEventException extends RuntimeException {

    public NonRetryableEventException(String message) {
        super(message);
    }

    public NonRetryableEventException(String message, Throwable cause) {
        super(message, cause);
    }
}