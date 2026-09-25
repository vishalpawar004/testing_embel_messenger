package com.embel.chatmessenger.admin.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

// SUPER_ADMIN bulk clear, by raw chatId - works for 1-to-1 AND group chats
// mixed together in the same call, since chatId alone is enough to identify
// either type. Leave from/to null to wipe everything in each chat.
@Getter
@Setter
public class ClearChatMessagesRequest {

    @NotEmpty(message = "chatIds must contain at least one chat")
    private List<Long> chatIds;

    private LocalDateTime from;
    private LocalDateTime to;
}