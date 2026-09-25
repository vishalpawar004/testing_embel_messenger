package com.embel.chatmessenger.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class GroupCreateRequest {

    @NotBlank(message = "Group name is required")
    private String name;

    private String description;
    private String avatar;

    @NotEmpty(message = "At least one member is required to create a group")
    private List<Long> memberUserIds; // creator is auto-added as ADMIN, these are added as MEMBER
}