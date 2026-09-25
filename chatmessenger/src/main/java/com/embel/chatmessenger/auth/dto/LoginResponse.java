package com.embel.chatmessenger.auth.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LoginResponse {
    private String token;
    private Long userId;
    private String name;
    private String role; // "SUPER_ADMIN" or "USER" - frontend uses this to show/hide admin screens
}