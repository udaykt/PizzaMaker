package com.pizzamaker.entity.converter;

import com.pizzamaker.entity.ToppingQuantity;
import com.pizzamaker.entity.ToppingSelection;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ToppingSelectionListConverterTest {

    private final ToppingSelectionListConverter converter = new ToppingSelectionListConverter();

    @Test
    void roundTripsToppingsThroughJson() {
        var toppings = List.of(
                new ToppingSelection("pepperoni", ToppingQuantity.EXTRA),
                new ToppingSelection("olives", ToppingQuantity.LIGHT));

        String json = converter.convertToDatabaseColumn(toppings);
        assertThat(json).contains("pepperoni").contains("EXTRA").contains("olives");
        assertThat(converter.convertToEntityAttribute(json)).isEqualTo(toppings);
    }

    @Test
    void serializesNullAndEmptyToEmptyJsonArray() {
        assertThat(converter.convertToDatabaseColumn(null)).isEqualTo("[]");
        assertThat(converter.convertToDatabaseColumn(List.of())).isEqualTo("[]");
    }

    @Test
    void deserializesNullOrBlankToEmptyList() {
        assertThat(converter.convertToEntityAttribute(null)).isEmpty();
        assertThat(converter.convertToEntityAttribute("")).isEmpty();
        assertThat(converter.convertToEntityAttribute("  ")).isEmpty();
        assertThat(converter.convertToEntityAttribute("[]")).isEmpty();
    }
}
