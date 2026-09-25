package com.embel.chatmessenger.admin.controller;

import com.embel.chatmessenger.admin.dto.AdminUserDto;
import com.embel.chatmessenger.admin.service.AdminUserService;
import com.embel.chatmessenger.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Every endpoint here is restricted to SUPER_ADMIN at the security-filter level
// (see config/SecurityConfig.java).
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ApiResponse<List<AdminUserDto>> getAllUsers() {
        return ApiResponse.success(adminUserService.getAllUsers());
    }

    @PatchMapping("/{userId}/block")
    public ApiResponse<String> blockUser(@AuthenticationPrincipal Long adminId,
                                          @PathVariable Long userId) {
        adminUserService.blockUser(adminId, userId);
        return ApiResponse.success("User blocked platform-wide");
    }

    @PatchMapping("/{userId}/unblock")
    public ApiResponse<String> unblockUser(@AuthenticationPrincipal Long adminId,
                                            @PathVariable Long userId) {
        adminUserService.unblockUser(adminId, userId);
        return ApiResponse.success("User unblocked");
    }

    @DeleteMapping("/{userId}")
    public ApiResponse<String> deleteUser(@AuthenticationPrincipal Long adminId,
                                           @PathVariable Long userId) {
        adminUserService.deleteUser(adminId, userId);
        return ApiResponse.success("User deleted");
    }

    @PatchMapping("/{userId}/restore")
    public ApiResponse<String> restoreUser(@PathVariable Long userId) {
        adminUserService.restoreUser(userId);
        return ApiResponse.success("User restored");
    }
}