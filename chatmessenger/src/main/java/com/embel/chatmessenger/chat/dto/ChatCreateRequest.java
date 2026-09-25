package com.embel.chatmessenger.chat.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

// Used to start a new ONE_TO_ONE chat (or fetch existing one) with another member.
@Getter
@Setter
public class ChatCreateRequest {

    @NotNull(message = "targetUserId is required")
    private Long targetUserId;
}