package com.pizzamaker.dto.response;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

// One day's revenue rollup. The constructor takes the raw year/month/day so it
// can be built directly from a JPQL aggregate; callers see a clean date and a
// derived average order value.
public record RevenuePoint(
        LocalDate day,
        long orders,
        BigDecimal revenue,
        BigDecimal avgOrderValue
) {
    public RevenuePoint(Integer year, Integer month, Integer day, Long orders, BigDecimal revenue) {
        this(LocalDate.of(year, month, day),
             orders == null ? 0 : orders,
             revenue == null ? BigDecimal.ZERO : revenue,
             average(orders, revenue));
    }

    private static BigDecimal average(Long orders, BigDecimal revenue) {
        if (orders == null || orders == 0 || revenue == null) return BigDecimal.ZERO;
        return revenue.divide(BigDecimal.valueOf(orders), 2, RoundingMode.HALF_UP);
    }
}
