package com.embel.chatmessenger.admin.dto;

import com.embel.chatmessenger.user.enums.UserRole;
import com.embel.chatmessenger.user.enums.UserStatus;
import lombok.Getter;
import lombok.Setter;

// Admin-only view of a user - exposes fields the normal UserDto hides
// (isBlocked, role) since only a SUPER_ADMIN should see these.
@Getter
@Setter
public class AdminUserDto {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private UserRole role;
    private UserStatus status;
    private boolean isBlocked;
    private boolean online;
}