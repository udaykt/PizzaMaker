package com.pizzamaker.service;

import com.pizzamaker.dto.request.OrderRequest;
import com.pizzamaker.dto.request.UpdateStatusRequest;
import com.pizzamaker.dto.response.OrderResponse;
import com.pizzamaker.dto.response.PageResponse;
import com.pizzamaker.entity.BakeLevel;
import com.pizzamaker.entity.CrustStyle;
import com.pizzamaker.entity.DeliveryMethod;
import com.pizzamaker.entity.Order;
import com.pizzamaker.entity.OrderLineItem;
import com.pizzamaker.entity.OrderStatus;
import com.pizzamaker.entity.OrderStatusHistory;
import com.pizzamaker.entity.SauceType;
import com.pizzamaker.entity.ToppingQuantity;
import com.pizzamaker.entity.ToppingSelection;
import com.pizzamaker.entity.User;
import com.pizzamaker.event.OrderPlacedEvent;
import com.pizzamaker.event.OrderStatusChangedEvent;
import com.pizzamaker.exception.ResourceNotFoundException;
import com.pizzamaker.mapper.OrderMapper;
import com.pizzamaker.outbox.OutboxService;
import com.pizzamaker.repository.OrderLineItemRepository;
import com.pizzamaker.repository.OrderRepository;
import com.pizzamaker.repository.OrderStatusHistoryRepository;
import com.pizzamaker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OrderLineItemRepository orderLineItemRepository;
    private final OrderStatusHistoryRepository statusHistoryRepository;
    private final CatalogService catalogService;
    private final OutboxService outboxService;

    @Transactional
    public OrderResponse placeOrder(String email, OrderRequest request, String idempotencyKey) {
        boolean hasKey = idempotencyKey != null && !idempotencyKey.isBlank();

        // Fast path: a retried request with the same key returns the original
        // order instead of placing a duplicate. The unique index on
        // idempotency_key is the real guarantee — a rare concurrent race that
        // slips past this check surfaces as a 409 (DataIntegrityViolation),
        // which the client safely resolves by retrying into this same check.
        if (hasKey) {
            var existing = orderRepository.findByIdempotencyKey(idempotencyKey);
            if (existing.isPresent()) {
                return OrderMapper.toResponse(existing.get());
            }
        }

        User user = userRepository.findByEmailId(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        Order order = Order.builder()
                .oid(UUID.randomUUID().toString())
                .idempotencyKey(hasKey ? idempotencyKey : null)
                .user(user)
                .sauceType(request.sauceType() != null ? request.sauceType() : SauceType.NONE)
                .mozzarella(request.mozzarella())
                .cheddar(request.cheddar())
                .parmesanAsiago(request.parmesanAsiago())
                .feta(request.feta())
                .ricotta(request.ricotta())
                .veganCheese(request.veganCheese())
                .toppings(sanitizeToppings(request.toppings()))
                .pizzaSize(request.pizzaSize())
                .crustStyle(request.crustStyle() != null ? request.crustStyle() : CrustStyle.HAND_TOSSED)
                .bakeLevel(request.bakeLevel() != null ? request.bakeLevel() : BakeLevel.NORMAL)
                .deliveryMethod(request.deliveryMethod() != null ? request.deliveryMethod() : DeliveryMethod.DELIVERY)
                .price(PricingService.computeTotal(request))
                .build();

        // IDENTITY generation flushes the insert here, so a duplicate
        // idempotency key fails fast before any line items are written.
        Order saved = orderRepository.save(order);

        persistReceiptSnapshot(saved, request);
        recordStatusChange(saved, null, saved.getStatus(), saved.getCreatedBy());

        // The confirmation is enqueued in the outbox within this same
        // transaction, so it commits atomically with the order and is delivered
        // by the relay only once the order is durably persisted.
        outboxService.append(OutboxService.AGGREGATE_ORDER, saved.getOid(),
                OutboxService.ORDER_PLACED, new OrderPlacedEvent(email, saved.getOid()));

        return OrderMapper.toResponse(saved);
    }

    // Snapshot the priced breakdown so a receipt survives later price changes and
    // analytics can aggregate line items without parsing the toppings JSON.
    private void persistReceiptSnapshot(Order order, OrderRequest request) {
        LocalDateTime now = LocalDateTime.now();
        List<OrderLineItem> items = PricingService.computeBreakdown(request).stream()
                .map(li -> OrderLineItem.builder()
                        .order(order)
                        .lineType(li.type())
                        .refId(li.refId())
                        .label(li.label())
                        .amount(li.amount())
                        .createdAt(now)
                        .build())
                .toList();
        orderLineItemRepository.saveAll(items);
    }

    private void recordStatusChange(Order order, OrderStatus from, OrderStatus to, String changedBy) {
        statusHistoryRepository.save(OrderStatusHistory.builder()
                .order(order)
                .fromStatus(from)
                .toStatus(to)
                .changedBy(changedBy)
                .changedAt(LocalDateTime.now())
                .build());
    }

    // Validates topping ids against the kitchen's active allow-list (rejecting
    // any a tampered request might inject) and defaults a missing quantity to
    // regular. The allow-list now lives in the topping table (CatalogService),
    // not a hardcoded Set.
    private List<ToppingSelection> sanitizeToppings(List<ToppingSelection> requested) {
        if (requested == null) return List.of();
        Set<String> allowed = catalogService.activeToppingCodes();
        List<ToppingSelection> result = new ArrayList<>();
        for (ToppingSelection t : requested) {
            if (t == null || t.id() == null || !allowed.contains(t.id())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Unknown topping: " + (t == null ? "null" : t.id()));
            }
            result.add(new ToppingSelection(t.id(),
                    t.quantity() != null ? t.quantity() : ToppingQuantity.REGULAR));
        }
        return result;
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
        // The single-order view includes the itemized receipt snapshot; list
        // views omit it to stay light.
        List<OrderLineItem> lineItems = orderLineItemRepository.findByOrder_IdOrderById(order.getId());
        return OrderMapper.toResponse(order, lineItems);
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

        OrderStatus from = order.getStatus();
        OrderStatus to = request.status();

        if (!from.canTransitionTo(to)) {
            throw new IllegalArgumentException(
                    "Invalid status transition: cannot move from " + from + " to " + to +
                    ". Transitions must be forward-only.");
        }

        order.setStatus(to);
        Order saved = orderRepository.save(order);

        recordStatusChange(saved, from, to, saved.getUpdatedBy());

        // Enqueue the real-time push in the outbox so it commits with the status
        // change and the relay delivers it to the owning user.
        outboxService.append(OutboxService.AGGREGATE_ORDER, saved.getOid(),
                OutboxService.ORDER_STATUS_CHANGED,
                new OrderStatusChangedEvent(saved.getUser().getEmailId(), saved.getOid(),
                        saved.getUser().getUid(), to));

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
