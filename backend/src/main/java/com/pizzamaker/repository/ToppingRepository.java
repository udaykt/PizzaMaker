package com.pizzamaker.repository;

import com.pizzamaker.entity.Topping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ToppingRepository extends JpaRepository<Topping, Long> {

    List<Topping> findByActiveTrueOrderByCategoryAscNameAsc();
}
