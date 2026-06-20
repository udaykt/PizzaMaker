package com.pizzamaker.repository;

import com.pizzamaker.dto.response.ToppingPopularity;
import com.pizzamaker.entity.OrderLineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrderLineItemRepository extends JpaRepository<OrderLineItem, Long> {

    List<OrderLineItem> findByOrder_IdOrderById(Long orderId);

    // Popularity ranking straight from the snapshotted line items, so we never
    // parse the orders.toppings JSON blob in SQL.
    @Query("""
            SELECT new com.pizzamaker.dto.response.ToppingPopularity(
                li.refId, COUNT(li), SUM(li.amount))
            FROM OrderLineItem li
            WHERE li.lineType = com.pizzamaker.entity.LineType.TOPPING
            GROUP BY li.refId
            ORDER BY COUNT(li) DESC""")
    List<ToppingPopularity> findToppingPopularity();
}
