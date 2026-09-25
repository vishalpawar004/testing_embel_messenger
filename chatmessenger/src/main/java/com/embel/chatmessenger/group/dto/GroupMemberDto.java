package com.embel.chatmessenger.group.dto;

import com.embel.chatmessenger.group.enums.GroupRole;
import com.embel.chatmessenger.group.enums.MemberStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GroupMemberDto {
    private Long userId;
    private String name;   // resolved from User
    private String avatar;
    private GroupRole role;
    private MemberStatus status;
    private boolean online;
}