package com.pizzamaker.repository;

import com.pizzamaker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailId(String emailId);
    boolean existsByEmailId(String emailId);
    Optional<User> findByUid(String uid);
}
