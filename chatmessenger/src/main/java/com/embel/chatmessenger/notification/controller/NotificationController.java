package com.embel.chatmessenger.notification.controller;

import com.embel.chatmessenger.common.response.ApiResponse;
import com.embel.chatmessenger.common.response.PageResponse;
import com.embel.chatmessenger.notification.dto.NotificationDto;
import com.embel.chatmessenger.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<PageResponse<NotificationDto>> getMyNotifications(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.success(PageResponse.from(notificationService.getMyNotifications(userId, pageable)));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Long> unreadCount(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(notificationService.getUnreadCount(userId));
    }

    @PatchMapping("/{notificationId}/read")
    public ApiResponse<String> markAsRead(@AuthenticationPrincipal Long userId,
                                           @PathVariable Long notificationId) {
        notificationService.markAsRead(userId, notificationId);
        return ApiResponse.success("Marked as read");
    }

    @PatchMapping("/read-all")
    public ApiResponse<String> markAllAsRead(@AuthenticationPrincipal Long userId) {
        notificationService.markAllAsRead(userId);
        return ApiResponse.success("All marked as read");
    }
}