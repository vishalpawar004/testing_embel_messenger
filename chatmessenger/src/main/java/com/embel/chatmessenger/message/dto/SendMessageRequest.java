package com.embel.chatmessenger.message.dto;

import com.embel.chatmessenger.message.enums.MessageType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SendMessageRequest {

    @NotNull(message = "chatId is required")
    private Long chatId;

    @NotNull(message = "type is required")
    private MessageType type = MessageType.TEXT;

    // required for TEXT, optional for pure-file messages
    private String content;

    // id returned by POST /api/attachments/upload - only for IMAGE/VIDEO/DOCUMENT/AUDIO
    private Long mediaFileId;

    // optional - id of the message being replied to/quoted, must be in the same chat
    private Long replyToMessageId;
}