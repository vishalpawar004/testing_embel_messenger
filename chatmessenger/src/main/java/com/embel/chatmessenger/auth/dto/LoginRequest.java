package com.embel.chatmessenger.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginRequest {

    @NotBlank(message = "Email or phone is required")
    private String identifier;   // accepts EITHER email or 10-digit phone

    @NotBlank(message = "Password is required")
    private String password;
}