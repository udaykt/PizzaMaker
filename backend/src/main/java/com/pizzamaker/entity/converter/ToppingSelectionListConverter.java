package com.pizzamaker.entity.converter;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pizzamaker.entity.ToppingSelection;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.ArrayList;
import java.util.List;

// Persists an order's toppings as a JSON string in a plain text column. Text
// (not a native JSON type) keeps the same migration valid on both H2 (dev) and
// PostgreSQL (prod); we never query inside the list, so native JSON buys us
// nothing here.
@Converter
public class ToppingSelectionListConverter implements AttributeConverter<List<ToppingSelection>, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<ToppingSelection>> TYPE = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(List<ToppingSelection> attribute) {
        try {
            return MAPPER.writeValueAsString(attribute == null ? List.of() : attribute);
        } catch (Exception e) {
            throw new IllegalStateException("Could not serialize toppings", e);
        }
    }

    @Override
    public List<ToppingSelection> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return new ArrayList<>();
        try {
            return MAPPER.readValue(dbData, TYPE);
        } catch (Exception e) {
            throw new IllegalStateException("Could not deserialize toppings", e);
        }
    }
}
