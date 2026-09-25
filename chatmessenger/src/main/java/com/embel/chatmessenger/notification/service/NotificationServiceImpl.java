package com.embel.chatmessenger.notification.service;

import com.embel.chatmessenger.exception.AccessDeniedCustomException;
import com.embel.chatmessenger.exception.ResourceNotFoundException;
import com.embel.chatmessenger.notification.dto.NotificationDto;
import com.embel.chatmessenger.notification.entity.Notification;
import com.embel.chatmessenger.notification.enums.NotificationType;
import com.embel.chatmessenger.notification.repository.NotificationRepository;
import com.embel.chatmessenger.websocket.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public void notify(Long userId, String title, String body, NotificationType type,
                        Long relatedChatId, Long relatedGroupId) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setBody(body);
        notification.setType(type);
        notification.setRelatedChatId(relatedChatId);
        notification.setRelatedGroupId(relatedGroupId);
        notification = notificationRepository.save(notification);

        // Always saved regardless of online status (per spec) - the live push
        // is a bonus for whoever happens to be connected right now.
        if (presenceService.isOnline(userId)) {
            messagingTemplate.convertAndSend("/topic/notifications." + userId, toDto(notification));
        }
    }

    @Override
    public Page<NotificationDto> getMyNotifications(Long userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(this::toDto);
    }

    @Override
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long userId, Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getUserId().equals(userId)) {
            throw new AccessDeniedCustomException("This notification does not belong to you");
        }
        // HARD delete instead of flagging isRead=true - a "read" notification
        // has served its purpose, so it's removed rather than kept forever,
        // keeping the notifications table from growing unbounded.
        notificationRepository.delete(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        // HARD delete every remaining notification for this user, one SQL
        // statement - same reasoning as markAsRead above.
        notificationRepository.hardDeleteByUserId(userId);
    }

    @Override
    @Transactional
    public void deleteAllForGroup(Long groupId) {
        notificationRepository.hardDeleteByRelatedGroupId(groupId);
    }

    private NotificationDto toDto(Notification n) {
        NotificationDto dto = new NotificationDto();
        dto.setId(n.getId());
        dto.setTitle(n.getTitle());
        dto.setBody(n.getBody());
        dto.setType(n.getType());
        dto.setRead(Boolean.TRUE.equals(n.getIsRead()));
        dto.setRelatedChatId(n.getRelatedChatId());
        dto.setRelatedGroupId(n.getRelatedGroupId());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }
}