package com.pizzamaker.service;

import com.pizzamaker.dto.request.OrderRequest;
import com.pizzamaker.dto.request.UpdateStatusRequest;
import com.pizzamaker.dto.response.OrderResponse;
import com.pizzamaker.dto.response.PageResponse;
import com.pizzamaker.entity.*;
import com.pizzamaker.exception.ResourceNotFoundException;
import com.pizzamaker.repository.OrderRepository;
import com.pizzamaker.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository orderRepository;
    @Mock UserRepository userRepository;
    @Mock NotificationService notificationService;
    @Mock SimpMessagingTemplate messagingTemplate;

    @InjectMocks OrderService orderService;

    private User testUser() {
        return User.builder()
                .id(1L)
                .uid(UUID.randomUUID().toString())
                .firstName("Bob")
                .emailId("bob@example.com")
                .userType(UserType.STANDARD)
                .role(Role.ROLE_USER)
                .build();
    }

    private OrderRequest testOrderRequest() {
        return new OrderRequest(true, true, false, true, false,
                false, false, false, false, false, false, PizzaSize.M,
                CrustStyle.CLASSIC, BakeLevel.GOLDEN);
    }

    @Test
    void placeOrder_success() {
        User user = testUser();
        when(userRepository.findByEmailId("bob@example.com")).thenReturn(Optional.of(user));
        when(orderRepository.save(any())).thenAnswer(inv -> {
            Order o = inv.getArgument(0);
            o.setId(1L);
            return o;
        });

        OrderResponse resp = orderService.placeOrder("bob@example.com", testOrderRequest(), null);

        assertThat(resp.pizzaSize()).isEqualTo(PizzaSize.M);
        assertThat(resp.status()).isEqualTo(OrderStatus.PENDING);
        verify(notificationService).sendOrderConfirmation(eq("bob@example.com"), anyString());
    }

    @Test
    void placeOrder_userNotFound_throws() {
        when(userRepository.findByEmailId("nobody@example.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.placeOrder("nobody@example.com", testOrderRequest(), null))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void getUserOrders_returnsPaginatedResults() {
        User user = testUser();
        Order order = Order.builder()
                .oid(UUID.randomUUID().toString())
                .user(user)
                .pizzaSize(PizzaSize.L)
                .status(OrderStatus.PENDING)
                .build();
        var pageable = PageRequest.of(0, 10);
        when(userRepository.findByEmailId("bob@example.com")).thenReturn(Optional.of(user));
        when(orderRepository.findByUser_Id(1L, pageable)).thenReturn(new PageImpl<>(List.of(order)));

        PageResponse<OrderResponse> page = orderService.getUserOrders("bob@example.com", pageable);

        assertThat(page.content()).hasSize(1);
        assertThat(page.totalElements()).isEqualTo(1);
    }

    @Test
    void getOrder_wrongOwner_throws() {
        User owner = testUser();
        User other = User.builder()
                .id(2L)
                .uid(UUID.randomUUID().toString())
                .firstName("Eve")
                .emailId("eve@example.com")
                .userType(UserType.STANDARD)
                .role(Role.ROLE_USER)
                .build();
        String oid = UUID.randomUUID().toString();
        Order order = Order.builder()
                .oid(oid)
                .user(owner)
                .pizzaSize(PizzaSize.M)
                .status(OrderStatus.PENDING)
                .build();
        when(orderRepository.findByOid(oid)).thenReturn(Optional.of(order));

        // Eve trying to read Bob's order — ownership check must reject it
        assertThatThrownBy(() -> orderService.getOrder("eve@example.com", oid))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void updateStatus_validTransition_broadcastsToUser() {
        User user = testUser();
        String oid = UUID.randomUUID().toString();
        Order order = Order.builder()
                .oid(oid)
                .user(user)
                .pizzaSize(PizzaSize.M)
                .status(OrderStatus.PENDING)
                .build();
        when(orderRepository.findByOid(oid)).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        OrderResponse resp = orderService.updateStatus(oid, new UpdateStatusRequest(OrderStatus.CONFIRMED));

        assertThat(resp.status()).isEqualTo(OrderStatus.CONFIRMED);
        // Must route to the owning user's queue, not a broadcast topic
        verify(messagingTemplate).convertAndSendToUser(
                eq("bob@example.com"),
                eq("/queue/orders"),
                any());
    }

    @Test
    void updateStatus_backwardTransition_throws() {
        User user = testUser();
        String oid = UUID.randomUUID().toString();
        Order order = Order.builder()
                .oid(oid)
                .user(user)
                .pizzaSize(PizzaSize.M)
                .status(OrderStatus.READY)
                .build();
        when(orderRepository.findByOid(oid)).thenReturn(Optional.of(order));

        // READY → PENDING is a backward jump and must be rejected
        assertThatThrownBy(() -> orderService.updateStatus(oid, new UpdateStatusRequest(OrderStatus.PENDING)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("forward-only");
    }

    @Test
    void updateStatus_sameStatus_throws() {
        User user = testUser();
        String oid = UUID.randomUUID().toString();
        Order order = Order.builder()
                .oid(oid)
                .user(user)
                .pizzaSize(PizzaSize.M)
                .status(OrderStatus.CONFIRMED)
                .build();
        when(orderRepository.findByOid(oid)).thenReturn(Optional.of(order));

        // Same status is also rejected (ordinal not strictly greater)
        assertThatThrownBy(() -> orderService.updateStatus(oid, new UpdateStatusRequest(OrderStatus.CONFIRMED)))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
