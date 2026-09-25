package com.embel.chatmessenger.message.dto;

import com.embel.chatmessenger.message.enums.MessageStatus;
import com.embel.chatmessenger.message.enums.MessageType;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class MessageDto {
    private Long id;
    private Long chatId;
    private Long senderId;
    private String senderName;
    private MessageType type;
    private String content;
    private String fileUrl;
    private MessageStatus status;
    private boolean pinned;
    private boolean edited;
    private boolean starred;
    private boolean forwarded;
    // true if this message was soft-deleted - when true, content/fileUrl are
    // already overridden to a placeholder ("This message was deleted") by the
    // backend, so the frontend can render it grayed-out/italic without extra logic.
    private boolean deleted;
    private ReplyPreviewDto replyTo;
    // Aggregated: one entry per distinct emoji used, with its count
    private java.util.List<ReactionSummaryDto> reactions = new java.util.ArrayList<>();
    // The requesting user's own reaction emoji on this message, or null if they haven't reacted
    private String myReaction;
    private LocalDateTime createdAt;
}