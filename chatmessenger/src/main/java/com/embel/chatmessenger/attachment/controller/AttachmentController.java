package com.embel.chatmessenger.attachment.controller;

import com.embel.chatmessenger.attachment.dto.MediaFileDto;
import com.embel.chatmessenger.attachment.dto.MediaUploadResultDto;
import com.embel.chatmessenger.attachment.dto.ProjectFileDetailDto;
import com.embel.chatmessenger.attachment.dto.ProjectFileDto;
import com.embel.chatmessenger.attachment.service.FileStorageService;
import com.embel.chatmessenger.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/attachments")
@RequiredArgsConstructor
@Tag(name = "Attachments", description = "File upload for chat messages, plus named Project File folders (e.g. 'ERP') that group related files together across multiple upload sessions.")
@SecurityRequirement(name = "bearerAuth")
public class AttachmentController {

    private final FileStorageService fileStorageService;

    @Operation(summary = "Upload a single file", description = "Accepts any file type. Returns the mediaFileId and fileUrl to attach when creating a message.")
    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ApiResponse<MediaFileDto> upload(@AuthenticationPrincipal Long userId,
                                             @RequestParam("file") MultipartFile file) {
        return ApiResponse.success(fileStorageService.storeFile(userId, file));
    }

    @Operation(summary = "Upload multiple files, kept as individual attachments", description = "Each file is stored independently; one bad file doesn't abort the batch.")
    @PostMapping(value = "/upload-multiple", consumes = "multipart/form-data")
    public ApiResponse<List<MediaUploadResultDto>> uploadMultiple(@AuthenticationPrincipal Long userId,
                                                                   @RequestParam("files") List<MultipartFile> files) {
        return ApiResponse.success(fileStorageService.storeFiles(userId, files));
    }

    @Operation(
        summary = "List my Project File folders",
        description = "Returns every project folder (e.g. 'ERP') the user has created, with its title and file count. Powers the 'Project Files' category in the frontend, separate from Images/Documents/etc."
    )
    @GetMapping("/projects")
    public ApiResponse<List<ProjectFileDto>> listProjects(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(fileStorageService.listProjects(userId));
    }

    @Operation(
        summary = "Get one project's files",
        description = "Returns every file ever uploaded to this project, including all versions (e.g. both 'index.html' and 'index(1).html'), oldest first."
    )
    @GetMapping("/projects/{projectId}")
    public ApiResponse<ProjectFileDetailDto> getProject(@AuthenticationPrincipal Long userId,
                                                         @PathVariable Long projectId) {
        return ApiResponse.success(fileStorageService.getProject(userId, projectId));
    }

    @Operation(
        summary = "Upload files into a project",
        description = "Add one or more files (any type) to a named project folder. Pass 'projectId' to add into an "
            + "existing project (e.g. adding more files to 'ERP' tomorrow), or pass 'title' to create a new project "
            + "or reuse an existing one with the same title - only one of the two is required. If a file with the "
            + "same name already exists in this project, the new upload gets an auto version suffix "
            + "(index.html -> index(1).html -> index(2).html...); the original is never overwritten."
    )
    @PostMapping(value = "/projects/upload", consumes = "multipart/form-data")
    public ApiResponse<ProjectFileDetailDto> uploadToProject(
            @AuthenticationPrincipal Long userId,
            @Parameter(description = "Existing project id to add files to. Omit if creating a new project with 'title'.")
            @RequestParam(value = "projectId", required = false) Long projectId,
            @Parameter(description = "Project name, e.g. 'ERP'. Required if projectId is not given.")
            @RequestParam(value = "title", required = false) String title,
            @Parameter(description = "Files to add, any type mixed together.")
            @RequestParam("files") List<MultipartFile> files) {
        return ApiResponse.success(fileStorageService.storeProjectFiles(userId, projectId, title, files));
    }
}