package com.embel.chatmessenger.message.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ForwardMessageRequest {

    // Forward to one or several chats at once (1-to-1 and/or group, mixed is fine)
    @NotEmpty(message = "chatIds must contain at least one destination chat")
    private List<Long> chatIds;
}