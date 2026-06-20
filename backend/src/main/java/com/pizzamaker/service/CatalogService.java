package com.pizzamaker.service;

import com.pizzamaker.entity.PizzaPreset;
import com.pizzamaker.entity.Topping;
import com.pizzamaker.repository.PizzaPresetRepository;
import com.pizzamaker.repository.ToppingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

// Read side of the menu catalogue. Replaces the old hardcoded ToppingCatalog.IDS
// Set with a database-backed allow-list, and serves the menu the client can fetch
// instead of duplicating it. The allow-list is read on every order, so it's
// cached — the menu changes rarely.
@Service
@RequiredArgsConstructor
public class CatalogService {

    private final ToppingRepository toppingRepository;
    private final PizzaPresetRepository presetRepository;

    @Cacheable("activeToppingCodes")
    @Transactional(readOnly = true)
    public Set<String> activeToppingCodes() {
        return toppingRepository.findByActiveTrueOrderByCategoryAscNameAsc().stream()
                .map(Topping::getCode)
                .collect(Collectors.toUnmodifiableSet());
    }

    @Transactional(readOnly = true)
    public List<Topping> activeToppings() {
        return toppingRepository.findByActiveTrueOrderByCategoryAscNameAsc();
    }

    @Transactional(readOnly = true)
    public List<PizzaPreset> activePresets() {
        return presetRepository.findByActiveTrueOrderBySortOrderAsc();
    }
}
