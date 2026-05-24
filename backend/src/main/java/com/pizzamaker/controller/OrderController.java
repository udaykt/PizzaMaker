package com.pizzamaker.controller;

import com.pizzamaker.dto.request.OrderRequest;
import com.pizzamaker.dto.request.UpdateStatusRequest;
import com.pizzamaker.dto.response.OrderResponse;
import com.pizzamaker.dto.response.PageResponse;
import com.pizzamaker.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
@Tag(name = "Orders")
@SecurityRequirement(name = "BearerAuth")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Place a new order")
    public OrderResponse placeOrder(@AuthenticationPrincipal UserDetails user,
                                    @Valid @RequestBody OrderRequest request,
                                    @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        return orderService.placeOrder(user.getUsername(), request, idempotencyKey);
    }

    @GetMapping("/my")
    @Operation(summary = "Get current user's orders (paginated)")
    public PageResponse<OrderResponse> myOrders(
            @AuthenticationPrincipal UserDetails user,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return orderService.getUserOrders(user.getUsername(), pageable);
    }

    @GetMapping("/{oid}")
    @Operation(summary = "Get a specific order by OID")
    public OrderResponse getOrder(@AuthenticationPrincipal UserDetails user,
                                  @PathVariable String oid) {
        return orderService.getOrder(user.getUsername(), oid);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all orders — ADMIN only")
    public PageResponse<OrderResponse> getAllOrders(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return orderService.getAllOrders(pageable);
    }

    @PutMapping("/{oid}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update order status — ADMIN only")
    public OrderResponse updateStatus(@PathVariable String oid,
                                      @Valid @RequestBody UpdateStatusRequest request) {
        return orderService.updateStatus(oid, request);
    }
}
