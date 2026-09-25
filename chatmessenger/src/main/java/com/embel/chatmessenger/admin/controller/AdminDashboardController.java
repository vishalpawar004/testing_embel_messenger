package com.embel.chatmessenger.admin.controller;

import com.embel.chatmessenger.admin.dto.AdminDashboardStatsDto;
import com.embel.chatmessenger.admin.service.AdminUserService;
import com.embel.chatmessenger.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// Restricted to SUPER_ADMIN via SecurityConfig ("/api/admin/**").
// Extend this once the report/audit modules are built.
@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminUserService adminUserService;

    @GetMapping("/stats")
    public ApiResponse<AdminDashboardStatsDto> stats() {
        return ApiResponse.success(adminUserService.getDashboardStats());
    }
}