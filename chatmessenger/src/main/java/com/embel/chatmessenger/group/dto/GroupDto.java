package com.embel.chatmessenger.group.dto;

import com.embel.chatmessenger.group.enums.GroupStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GroupDto {
    private Long id;
    private Long chatId;       // the linked Chat.id so the frontend can open it directly
    private String name;
    private String description;
    private String avatar;
    private Integer memberCount;
    private GroupStatus status;
    private String myRole;     // ADMIN / MEMBER for the requesting user
}