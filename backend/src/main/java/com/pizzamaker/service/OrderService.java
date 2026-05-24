package com.pizzamaker.service;

import com.pizzamaker.dto.request.OrderRequest;
import com.pizzamaker.dto.request.UpdateStatusRequest;
import com.pizzamaker.dto.response.OrderResponse;
import com.pizzamaker.dto.response.OrderStatusUpdate;
import com.pizzamaker.dto.response.PageResponse;
import com.pizzamaker.entity.Order;
import com.pizzamaker.entity.User;
import com.pizzamaker.exception.ResourceNotFoundException;
import com.pizzamaker.mapper.OrderMapper;
import com.pizzamaker.repository.OrderRepository;
import com.pizzamaker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    private record CachedOrder(OrderResponse response, Instant expiresAt) {}
    private static final Duration IDEMPOTENCY_TTL = Duration.ofHours(24);
    private final ConcurrentHashMap<String, CachedOrder> idempotencyCache = new ConcurrentHashMap<>();

    @Transactional
    public OrderResponse placeOrder(String email, OrderRequest request, String idempotencyKey) {
        if (idempotencyKey != null) {
            CachedOrder cached = idempotencyCache.get(idempotencyKey);
            if (cached != null && Instant.now().isBefore(cached.expiresAt())) {
                return cached.response();
            }
        }
        User user = userRepository.findByEmailId(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        Order order = Order.builder()
                .oid(UUID.randomUUID().toString())
                .user(user)
                .sauce(request.sauce())
                .mozzarella(request.mozzarella())
                .cheese(request.cheese())
                .pepperoni(request.pepperoni())
                .pepperoniMedium(request.pepperoniMedium())
                .sausage(request.sausage())
                .sausageMedium(request.sausageMedium())
                .peppers(request.peppers())
                .peppersMedium(request.peppersMedium())
                .olives(request.olives())
                .olivesMedium(request.olivesMedium())
                .pizzaSize(request.pizzaSize())
                .build();

        Order saved = orderRepository.save(order);
        notificationService.sendOrderConfirmation(email, saved.getOid());
        OrderResponse response = OrderMapper.toResponse(saved);
        if (idempotencyKey != null) {
            idempotencyCache.put(idempotencyKey, new CachedOrder(response, Instant.now().plus(IDEMPOTENCY_TTL)));
        }
        return response;
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getUserOrders(String email, Pageable pageable) {
        User user = userRepository.findByEmailId(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
        Page<Order> page = orderRepository.findByUser_Id(user.getId(), pageable);
        return toPageResponse(page);
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrder(String email, String oid) {
        Order order = orderRepository.findByOid(oid)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + oid));
        if (!order.getUser().getEmailId().equals(email)) {
            throw new ResourceNotFoundException("Order not found: " + oid);
        }
        return OrderMapper.toResponse(order);
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAllOrders(Pageable pageable) {
        Page<Order> page = orderRepository.findAll(pageable);
        return toPageResponse(page);
    }

    @Transactional
    public OrderResponse updateStatus(String oid, UpdateStatusRequest request) {
        Order order = orderRepository.findByOid(oid)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + oid));
        order.setStatus(request.status());
        Order saved = orderRepository.save(order);

        // Broadcast real-time status update to all subscribers on /topic/orders
        messagingTemplate.convertAndSend(
                "/topic/orders",
                new OrderStatusUpdate(saved.getOid(), saved.getUser().getUid(), saved.getStatus())
        );

        return OrderMapper.toResponse(saved);
    }

    private PageResponse<OrderResponse> toPageResponse(Page<Order> page) {
        return new PageResponse<>(
                page.getContent().stream().map(OrderMapper::toResponse).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}
