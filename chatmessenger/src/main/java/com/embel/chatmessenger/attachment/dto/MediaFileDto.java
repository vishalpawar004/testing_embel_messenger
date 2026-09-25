package com.embel.chatmessenger.attachment.dto;

import com.embel.chatmessenger.attachment.enums.FileType;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MediaFileDto {
    private Long id;
    private String fileName;
    private String fileUrl;
    private FileType fileType;
    private Long fileSize;
}