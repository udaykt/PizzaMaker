package com.pizzamaker.integration;

import com.pizzamaker.dto.request.OrderRequest;
import com.pizzamaker.dto.response.OrderResponse;
import com.pizzamaker.entity.*;
import com.pizzamaker.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// End-to-end against a real PostgreSQL: exercises the actual postgresql Flyway
// migrations (including the partial unique idempotency index H2 can't express)
// and the full place-order path. Auto-skips on machines without Docker; runs in
// CI where Docker is available.
@SpringBootTest
@Testcontainers(disabledWithoutDocker = true)
class OrderFlowPostgresContainerTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void datasourceProps(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
    }

    @Autowired
    OrderService orderService;

    private OrderRequest sampleRequest() {
        return new OrderRequest(SauceType.ROBUST_TOMATO, true, false, false, false, false, false,
                List.of(new ToppingSelection("pepperoni", ToppingQuantity.REGULAR)),
                PizzaSize.L, CrustStyle.HAND_TOSSED, BakeLevel.NORMAL, DeliveryMethod.DELIVERY);
    }

    @Test
    void placeOrder_persistsReceiptAndIsIdempotentOnPostgres() {
        // DataSeeder seeds admin@pizzamaker.com; V18 seeds the topping catalogue.
        OrderResponse first = orderService.placeOrder("admin@pizzamaker.com", sampleRequest(), "it-key-1");
        assertThat(first.oid()).isNotBlank();
        assertThat(first.price()).isPositive();

        // Same idempotency key must return the original order, enforced by the
        // postgresql partial unique index on idempotency_key.
        OrderResponse retry = orderService.placeOrder("admin@pizzamaker.com", sampleRequest(), "it-key-1");
        assertThat(retry.oid()).isEqualTo(first.oid());

        // The itemized receipt snapshot is retrievable for the owner.
        OrderResponse fetched = orderService.getOrder("admin@pizzamaker.com", first.oid());
        assertThat(fetched.lineItems()).isNotEmpty();
        assertThat(fetched.lineItems()).anyMatch(li -> "TOPPING".equals(li.type()));
    }
}
