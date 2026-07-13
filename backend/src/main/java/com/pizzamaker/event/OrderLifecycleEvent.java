package com.pizzamaker.event;

import com.pizzamaker.entity.OrderStatus;

// One hop of the kitchen pipeline: "move order `oid` to `target`". The consumer
// that handles a hop emits the next one back onto Kafka rather than sleeping, so
// the poll loop is never blocked (see OrderLifecycleListener).
//
// `hop` is a loop fuse, not business data — it is incremented on each emission and
// checked against app.kafka.max-hops so a bug in the next-stage function can't
// spin a message round the pipeline forever.
public record OrderLifecycleEvent(String oid, OrderStatus target, int hop) {}
