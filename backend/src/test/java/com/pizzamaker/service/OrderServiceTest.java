package com.pizzamaker.service;

import com.pizzamaker.dto.request.OrderRequest;
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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock OrderRepository orderRepository;
    @Mock UserRepository userRepository;
    @Mock NotificationService notificationService;

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
                false, false, false, false, false, false, PizzaSize.M);
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
}
