package com.pizzamaker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
public class PizzaMakerApplication {

    public static void main(String[] args) {
        SpringApplication.run(PizzaMakerApplication.class, args);
    }
}
