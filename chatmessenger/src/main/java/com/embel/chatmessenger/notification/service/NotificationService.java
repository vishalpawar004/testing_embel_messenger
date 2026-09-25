package com.embel.chatmessenger.notification.service;

import com.embel.chatmessenger.notification.dto.NotificationDto;
import com.embel.chatmessenger.notification.enums.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {

    // Called internally by MessageService/GroupService - never exposed as a
    // public endpoint. Saves the row and, if the recipient is online, pushes
    // it live over /topic/notifications.{userId}.
    void notify(Long userId, String title, String body, NotificationType type,
                Long relatedChatId, Long relatedGroupId);

    Page<NotificationDto> getMyNotifications(Long userId, Pageable pageable);

    long getUnreadCount(Long userId);

    void markAsRead(Long userId, Long notificationId);

    void markAllAsRead(Long userId);

    // HARD delete - every notification referencing this group, permanently
    // removed. Called only from GroupService/AdminGroupService when a group
    // itself is deleted, never exposed as its own endpoint.
    void deleteAllForGroup(Long groupId);
}