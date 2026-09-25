package com.embel.chatmessenger.group.dto;

import lombok.Getter;
import lombok.Setter;

// All fields optional - only non-null ones are applied (partial update)
@Getter
@Setter
public class GroupUpdateRequest {
    private String name;
    private String description;
    private String avatar;
}