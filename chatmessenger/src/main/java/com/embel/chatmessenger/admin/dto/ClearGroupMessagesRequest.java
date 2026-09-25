package com.embel.chatmessenger.admin.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

// Select one or several groups at once for a bulk "clear chat" operation.
@Getter
@Setter
public class ClearGroupMessagesRequest {

    @NotEmpty(message = "groupIds must contain at least one group")
    private List<Long> groupIds;
}
