package com.embel.chatmessenger.attachment.service;

import com.embel.chatmessenger.attachment.dto.MediaFileDto;
import com.embel.chatmessenger.attachment.dto.MediaUploadResultDto;
import com.embel.chatmessenger.attachment.dto.ProjectFileDetailDto;
import com.embel.chatmessenger.attachment.dto.ProjectFileDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface FileStorageService {

    MediaFileDto storeFile(Long uploadedByUserId, MultipartFile file);

    List<MediaUploadResultDto> storeFiles(Long uploadedByUserId, List<MultipartFile> files);

    // Adds files to a named project folder. Pass projectId to add into an
    // existing project, or title to create/reuse one by name. Duplicate
    // filenames within the same project get an auto version suffix
    // (index.html -> index(1).html -> index(2).html...), never overwritten.
    ProjectFileDetailDto storeProjectFiles(Long uploadedByUserId, Long projectId, String title, List<MultipartFile> files);

    List<ProjectFileDto> listProjects(Long userId);

    ProjectFileDetailDto getProject(Long userId, Long projectId);

    void deleteFile(String fileUrl);
}