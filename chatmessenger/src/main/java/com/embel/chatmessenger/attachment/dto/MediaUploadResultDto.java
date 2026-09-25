package com.embel.chatmessenger.attachment.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class MediaUploadResultDto {
    private String originalFileName;
    private boolean success;
    private MediaFileDto file;   // null if success == false
    private String errorMessage; // null if success == true

    public static MediaUploadResultDto ok(String originalFileName, MediaFileDto file) {
        return new MediaUploadResultDto(originalFileName, true, file, null);
    }

    public static MediaUploadResultDto failed(String originalFileName, String errorMessage) {
        return new MediaUploadResultDto(originalFileName, false, null, errorMessage);
    }
}