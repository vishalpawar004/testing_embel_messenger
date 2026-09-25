package com.embel.chatmessenger.message.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

// NOT in the original ERD. One reaction per (message, user) - reacting again
// with a different emoji replaces the old one; the toggle-off logic lives in
// the service layer, not here.
@Entity
@Table(name = "message_reactions", uniqueConstraints = @UniqueConstraint(columnNames = {"message_id", "user_id"}))
@Getter
@Setter
public class MessageReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "message_id")
    private Long messageId;

    @Column(name = "user_id")
    private Long userId;

    // Stored as the raw emoji character(s), e.g. "👍", "❤️", "😂"
    private String emoji;

    private LocalDateTime createdAt = LocalDateTime.now();
}