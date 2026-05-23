package com.pizzamaker.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pizzamaker.dto.request.RegisterRequest;
import com.pizzamaker.dto.response.AuthResponse;
import com.pizzamaker.entity.UserType;
import com.pizzamaker.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean AuthService authService;

    @Test
    void register_returnsCreatedWithToken() throws Exception {
        var req = new RegisterRequest("Alice", "alice@example.com", "secret123");
        var resp = new AuthResponse("tok123", UUID.randomUUID().toString(), "Alice", UserType.STANDARD);
        when(authService.register(any())).thenReturn(resp);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("tok123"))
                .andExpect(jsonPath("$.firstName").value("Alice"));
    }

    @Test
    void register_missingFields_returns422() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void login_success_returns200WithToken() throws Exception {
        var resp = new AuthResponse("tok456", UUID.randomUUID().toString(), "Alice", UserType.STANDARD);
        when(authService.login(any())).thenReturn(resp);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"emailId\":\"alice@example.com\",\"password\":\"secret123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("tok456"));
    }
}
