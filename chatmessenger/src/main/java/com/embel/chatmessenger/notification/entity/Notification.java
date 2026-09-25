package com.embel.chatmessenger.notification.entity;

import com.embel.chatmessenger.notification.enums.NotificationType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId; // who this notification is FOR

    private String title;

    @Column(length = 1000)
    private String body;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    private Boolean isRead = false;

    // Optional pointers so tapping a notification can deep-link straight to
    // the right screen - null when not applicable.
    private Long relatedChatId;
    private Long relatedGroupId;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}