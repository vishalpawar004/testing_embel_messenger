package com.embel.chatmessenger.message.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

// NOT in the original ERD. A pinned message (Message.isPinned) is visible to
// everyone in the chat; a starred message is a private bookmark - only the
// user who starred it can see it in their "Starred messages" list.
@Entity
@Table(name = "starred_messages", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "message_id"}))
@Getter
@Setter
public class StarredMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "message_id")
    private Long messageId;

    private LocalDateTime createdAt = LocalDateTime.now();
}