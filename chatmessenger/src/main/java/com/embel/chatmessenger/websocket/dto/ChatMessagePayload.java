package com.embel.chatmessenger.websocket.dto;

import com.embel.chatmessenger.message.dto.MessageDto;
import lombok.Getter;
import lombok.Setter;

// What gets pushed down /topic/chat.{chatId} whenever a new message arrives.
@Getter
@Setter
public class ChatMessagePayload {
    private String event = "NEW_MESSAGE"; // NEW_MESSAGE | STATUS_UPDATE
    private MessageDto message;

    public ChatMessagePayload() {}

    public ChatMessagePayload(String event, MessageDto message) {
        this.event = event;
        this.message = message;
    }
}