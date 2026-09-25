package com.embel.chatmessenger.attachment.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
public class ProjectFileDto {
    private Long id;
    private String title;
    private int fileCount;
    private LocalDateTime updatedAt;
}