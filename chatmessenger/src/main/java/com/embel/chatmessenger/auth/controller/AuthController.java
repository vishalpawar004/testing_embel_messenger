package com.embel.chatmessenger.auth.controller;

import com.embel.chatmessenger.auth.dto.*;
import com.embel.chatmessenger.auth.service.AuthService;
import com.embel.chatmessenger.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Register and log in. No token required for either endpoint - these are the only two public endpoints in the whole API besides /ws and /files.")
public class AuthController {

    private final AuthService authService;

    @Operation(
        summary = "Register a new account",
        description = "Every new account is created with role=USER, no matter what - there is no way to register as SUPER_ADMIN "
            + "through this or any other API call. Phone must be exactly 10 digits, starting with 6-9 (Indian mobile format). "
            + "Fails with a field-level validation error if email/phone is already taken."
    )
    @PostMapping("/register")
    public ApiResponse<String> register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return ApiResponse.success("Registered successfully");
    }

    @Operation(
        summary = "Log in",
        description = "identifier accepts EITHER an email or a 10-digit phone number - the backend tries both automatically, "
            + "you don't need to specify which one you're sending. Returns a JWT token (valid 24h by default) plus the user's "
            + "role - the frontend should store role and use it to decide whether to show the Admin Panel entry point. "
            + "Fails with 401 if the account is blocked, even with the correct password."
    )
    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        return ApiResponse.success(authService.login(req));
    }
}