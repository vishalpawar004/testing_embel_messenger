package com.embel.chatmessenger.message.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateMessageContentRequest {

    @NotBlank(message = "content is required")
    private String content;
}