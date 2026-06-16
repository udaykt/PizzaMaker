package com.pizzamaker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pizzamaker.dto.request.OrderRequest;
import com.pizzamaker.dto.response.OrderResponse;
import com.pizzamaker.dto.response.PageResponse;
import com.pizzamaker.entity.BakeLevel;
import com.pizzamaker.entity.CrustStyle;
import com.pizzamaker.entity.DeliveryMethod;
import com.pizzamaker.entity.OrderStatus;
import com.pizzamaker.entity.PizzaSize;
import com.pizzamaker.entity.SauceType;
import com.pizzamaker.entity.ToppingQuantity;
import com.pizzamaker.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class OrderControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean OrderService orderService;

    private OrderResponse sampleOrder() {
        return new OrderResponse(
                UUID.randomUUID().toString(),
                "test@example.com",
                new OrderResponse.Ingredients(SauceType.ROBUST_TOMATO, true, false, false, false, true, ToppingQuantity.REGULAR,
                        false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR),
                PizzaSize.M,
                CrustStyle.HAND_TOSSED,
                BakeLevel.NORMAL,
                DeliveryMethod.DELIVERY,
                java.math.BigDecimal.valueOf(14.50),
                OrderStatus.PENDING,
                LocalDateTime.now()
        );
    }

    @Test
    @WithMockUser(username = "alice@example.com", roles = "USER")
    void placeOrder_authenticated_returns201() throws Exception {
        var req = new OrderRequest(SauceType.ROBUST_TOMATO, true, false, false, false, true, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                PizzaSize.M, CrustStyle.HAND_TOSSED, BakeLevel.NORMAL, DeliveryMethod.DELIVERY);
        when(orderService.placeOrder(eq("alice@example.com"), any(), any())).thenReturn(sampleOrder());

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void placeOrder_unauthenticated_returns401() throws Exception {
        var req = new OrderRequest(SauceType.ROBUST_TOMATO, true, false, false, false, false, ToppingQuantity.REGULAR,
                false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR, false, ToppingQuantity.REGULAR,
                PizzaSize.R, CrustStyle.HAND_TOSSED, BakeLevel.NORMAL, DeliveryMethod.DELIVERY);

        mockMvc.perform(post("/api/v1/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = "ADMIN")
    void getAllOrders_asAdmin_returnsPage() throws Exception {
        var page = new PageResponse<>(List.of(sampleOrder()), 0, 20, 1L, 1);
        when(orderService.getAllOrders(any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/orders"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }
}
