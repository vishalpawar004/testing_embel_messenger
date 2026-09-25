package com.embel.chatmessenger.attachment.dto;

import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
public class ProjectFileDetailDto {
    private Long id;
    private String title;
    private List<MediaFileDto> files;
}