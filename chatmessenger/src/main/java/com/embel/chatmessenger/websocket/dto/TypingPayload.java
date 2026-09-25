package com.embel.chatmessenger.websocket.dto;

import lombok.Getter;
import lombok.Setter;

// Sent by the client to /app/chat.typing, broadcast to /topic/chat.{chatId}.typing
@Getter
@Setter
public class TypingPayload {
    private Long chatId;
    private Long userId;
    private String userName;
    private boolean typing; // true = started typing, false = stopped
}