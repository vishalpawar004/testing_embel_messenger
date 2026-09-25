package com.embel.chatmessenger.chat.dto;

import com.embel.chatmessenger.chat.enums.ChatType;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class ChatDto {
    private Long id;
    private ChatType type;
    private String name;          // resolved display name (other user's name, or group name)
    private String avatar;
    private Long groupId;
    private String lastMessage;
    private LocalDateTime lastMessageAt;
    private long unreadCount;
    private boolean pinned;
    private boolean muted;
    private int onlineMemberCount; // for group chats, e.g. "4 members online"
}