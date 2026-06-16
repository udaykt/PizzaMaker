package com.pizzamaker.service;

import com.pizzamaker.dto.request.OrderRequest;
import com.pizzamaker.dto.request.UpdateStatusRequest;
import com.pizzamaker.dto.response.OrderResponse;
import com.pizzamaker.dto.response.OrderStatusUpdateResponse;
import com.pizzamaker.dto.response.PageResponse;
import com.pizzamaker.entity.BakeLevel;
import com.pizzamaker.entity.CrustStyle;
import com.pizzamaker.entity.Order;
import com.pizzamaker.entity.OrderStatus;
import com.pizzamaker.entity.User;
import com.pizzamaker.exception.ResourceNotFoundException;
import com.pizzamaker.mapper.OrderMapper;
import com.pizzamaker.repository.OrderRepository;
import com.pizzamaker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
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
            // computeIfAbsent is atomic per key — only one thread creates the order
            // even under concurrent requests with the same idempotency key.
            // NOTE: this deduplication is per-instance only; a multi-instance deployment
            // requires a shared store (e.g. Redis) or a DB unique constraint instead.
            CachedOrder existing = idempotencyCache.get(idempotencyKey);
            if (existing != null && Instant.now().isBefore(existing.expiresAt())) {
                return existing.response();
            }
            // Evict expired entry so computeIfAbsent will compute a fresh one
            idempotencyCache.remove(idempotencyKey, existing);

            CachedOrder result = idempotencyCache.computeIfAbsent(
                    idempotencyKey,
                    k -> new CachedOrder(createOrderInternal(email, request),
                                         Instant.now().plus(IDEMPOTENCY_TTL)));
            return result.response();
        }
        return createOrderInternal(email, request);
    }

    private OrderResponse createOrderInternal(String email, OrderRequest request) {
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
                .crustStyle(request.crustStyle() != null ? request.crustStyle() : CrustStyle.CLASSIC)
                .bakeLevel(request.bakeLevel() != null ? request.bakeLevel() : BakeLevel.GOLDEN)
                .build();

        Order saved = orderRepository.save(order);
        notificationService.sendOrderConfirmation(email, saved.getOid());
        return OrderMapper.toResponse(saved);
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

        OrderStatus current = order.getStatus();
        OrderStatus next = request.status();

        // Enforce forward-only transitions: PENDING → CONFIRMED → PREPARING → READY → DELIVERED
        if (next.ordinal() <= current.ordinal()) {
            throw new IllegalArgumentException(
                "Invalid status transition: cannot move from " + current + " to " + next +
                ". Transitions must be forward-only.");
        }

        order.setStatus(next);
        Order saved = orderRepository.save(order);

        // Route update only to the owning user's WebSocket session (bug #7).
        messagingTemplate.convertAndSendToUser(
                saved.getUser().getEmailId(),
                "/queue/orders",
                new OrderStatusUpdateResponse(saved.getOid(), saved.getUser().getUid(), saved.getStatus())
        );

        return OrderMapper.toResponse(saved);
    }

    // Evict idempotency cache entries whose TTL has expired every 5 minutes.
    @Scheduled(fixedRate = 300_000)
    public void evictExpiredIdempotencyEntries() {
        Instant now = Instant.now();
        idempotencyCache.entrySet().removeIf(e -> !now.isBefore(e.getValue().expiresAt()));
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
