package com.embel.chatmessenger.group.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddMemberRequest {

    @NotNull(message = "userId is required")
    private Long userId;
}