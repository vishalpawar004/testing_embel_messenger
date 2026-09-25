package com.embel.chatmessenger.message.entity;

import com.embel.chatmessenger.message.enums.MessageStatus;
import com.embel.chatmessenger.message.enums.MessageType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Getter
@Setter
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "chat_id")
    private Long chatId;

    @Column(name = "sender_id")
    private Long senderId;

    @Enumerated(EnumType.STRING)
    private MessageType type = MessageType.TEXT;

    // No length cap - TEXT column has no MySQL character limit (unlike the
    // old VARCHAR(4000)). Long messages are allowed; truncating with a
    // "Read more" is a frontend display choice, not a backend restriction.
    @Column(columnDefinition = "TEXT")
    private String content;

    private String fileUrl;

    @Enumerated(EnumType.STRING)
    private MessageStatus status = MessageStatus.SENDING;

    private Boolean isDeleted = false;
    private Boolean isPinned = false;
    private Boolean isEdited = false;

    @Column(name = "reply_to_message_id")
    private Long replyToMessageId;

    // NOT in the original ERD - marks a message as forwarded from elsewhere,
    // so the frontend can show a "Forwarded" label like WhatsApp/Telegram do.
    private Boolean isForwarded = false;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}