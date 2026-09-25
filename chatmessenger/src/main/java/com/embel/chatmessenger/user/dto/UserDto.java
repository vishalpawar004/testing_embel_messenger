package com.embel.chatmessenger.user.dto;

import lombok.Getter;
import lombok.Setter;

// Safe, public-facing view of a User - password is intentionally never exposed.
@Getter
@Setter
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String avatar;
    private boolean online;
    private boolean alreadyInGroup;
}