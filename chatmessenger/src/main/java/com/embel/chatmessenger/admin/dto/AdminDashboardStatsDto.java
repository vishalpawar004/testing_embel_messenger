package com.embel.chatmessenger.admin.dto;

import lombok.Getter;
import lombok.Setter;

// Minimal dashboard for now - extend with the report/audit modules later
// (per your PDF's AdminDashboardService "activity chart + recent reports" note).
@Getter
@Setter
public class AdminDashboardStatsDto {
    private long totalUsers;
    private long blockedUsers;
    private long totalGroups;
    private long totalChats;
    private long totalMessages;
}