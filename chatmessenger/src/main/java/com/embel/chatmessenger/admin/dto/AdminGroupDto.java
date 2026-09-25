package com.embel.chatmessenger.admin.dto;

import com.embel.chatmessenger.group.enums.GroupStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminGroupDto {
    private Long id;
    private String name;
    private String description;
    private Integer memberCount;
    private Long createdBy;
    private GroupStatus status;
}