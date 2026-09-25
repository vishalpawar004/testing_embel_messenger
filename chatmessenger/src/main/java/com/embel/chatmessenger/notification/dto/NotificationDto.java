package com.embel.chatmessenger.notification.dto;

import com.embel.chatmessenger.notification.enums.NotificationType;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class NotificationDto {
    private Long id;
    private String title;
    private String body;
    private NotificationType type;
    private boolean read;
    private Long relatedChatId;
    private Long relatedGroupId;
    private LocalDateTime createdAt;
}