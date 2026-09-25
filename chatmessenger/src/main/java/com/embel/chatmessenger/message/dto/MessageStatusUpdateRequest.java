package com.embel.chatmessenger.message.dto;

import com.embel.chatmessenger.message.enums.MessageStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MessageStatusUpdateRequest {

    @NotNull(message = "status is required")
    private MessageStatus status; // typically DELIVERED or READ
}