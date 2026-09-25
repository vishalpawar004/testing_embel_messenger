package com.embel.chatmessenger.message.dto;

import com.embel.chatmessenger.message.enums.MessageType;
import lombok.Getter;
import lombok.Setter;

// Small snapshot of the message being replied to - enough for the frontend to
// render a quoted snippet above the reply, without a second API call.
@Getter
@Setter
public class ReplyPreviewDto {
    private Long id;
    private Long senderId;
    private String senderName;
    private MessageType type;
    private String content;
    private String fileUrl;
}