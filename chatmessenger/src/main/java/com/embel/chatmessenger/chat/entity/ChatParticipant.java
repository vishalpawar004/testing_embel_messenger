package com.embel.chatmessenger.chat.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * NOT in the original ERD - added because Chat has no member list of its own.
 * Only used for ONE_TO_ONE chats. GROUP chats use GroupMember for membership;
 * this table also carries per-user UI state (pinned/muted/last read) for both
 * chat types so the Home screen (pinned/muted/unread) has something to query.
 */
@Entity
@Table(name = "chat_participants", uniqueConstraints = @UniqueConstraint(columnNames = {"chat_id", "user_id"}))
@Getter
@Setter
public class ChatParticipant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chat_id")
    private Long chatId;

    @Column(name = "user_id")
    private Long userId;

    private Boolean isPinned = false;
    private Boolean isMuted = false;
    private Boolean isArchived = false;

    private Long lastReadMessageId;

    private LocalDateTime joinedAt = LocalDateTime.now();
}