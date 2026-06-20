package com.pizzamaker.repository;

import com.pizzamaker.entity.PizzaPreset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PizzaPresetRepository extends JpaRepository<PizzaPreset, Long> {

    List<PizzaPreset> findByActiveTrueOrderBySortOrderAsc();
}
