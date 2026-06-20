package com.pizzamaker.entity;

// The kind of priced component a receipt line represents. Lets analytics group
// line items (e.g. all TOPPING lines) without parsing labels.
public enum LineType {
    SIZE, SAUCE, CHEESE, TOPPING, DELIVERY
}
