package com.embel.chatmessenger.admin.service;

import com.embel.chatmessenger.admin.dto.AdminDashboardStatsDto;
import com.embel.chatmessenger.admin.dto.AdminUserDto;

import java.util.List;

public interface AdminUserService {

    List<AdminUserDto> getAllUsers();

    void blockUser(Long actingSuperAdminId, Long targetUserId);

    void unblockUser(Long actingSuperAdminId, Long targetUserId);

    // Soft delete - distinct from block. A deleted user's login/API access is
    // revoked exactly like a blocked one (JwtAuthenticationFilter checks isDeleted
    // too), but this is meant as "account removed", not "temporarily blocked".
    void deleteUser(Long actingSuperAdminId, Long targetUserId);

    void restoreUser(Long targetUserId);

    AdminDashboardStatsDto getDashboardStats();
}