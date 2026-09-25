package com.embel.chatmessenger.message.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReactRequest {

    @NotBlank(message = "emoji is required")
    private String emoji;
}