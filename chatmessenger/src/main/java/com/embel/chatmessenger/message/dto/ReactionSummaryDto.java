package com.embel.chatmessenger.message.dto;

import lombok.Getter;
import lombok.Setter;

// One row per distinct emoji used on a message, e.g. {"emoji":"👍","count":3}
@Getter
@Setter
public class ReactionSummaryDto {
    private String emoji;
    private long count;
}