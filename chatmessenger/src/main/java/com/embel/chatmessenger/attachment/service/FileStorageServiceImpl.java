package com.embel.chatmessenger.attachment.service;

import com.embel.chatmessenger.attachment.dto.MediaFileDto;
import com.embel.chatmessenger.attachment.dto.MediaUploadResultDto;
import com.embel.chatmessenger.attachment.dto.ProjectFileDetailDto;
import com.embel.chatmessenger.attachment.dto.ProjectFileDto;
import com.embel.chatmessenger.attachment.entity.MediaFile;
import com.embel.chatmessenger.attachment.entity.ProjectFile;
import com.embel.chatmessenger.attachment.enums.FileStatus;
import com.embel.chatmessenger.attachment.enums.FileType;
import com.embel.chatmessenger.attachment.repository.MediaFileRepository;
import com.embel.chatmessenger.attachment.repository.ProjectFileRepository;
import com.embel.chatmessenger.exception.AccessDeniedCustomException;
import com.embel.chatmessenger.exception.FileUploadException;
import com.embel.chatmessenger.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FileStorageServiceImpl implements FileStorageService {

    private final MediaFileRepository mediaFileRepository;
    private final ProjectFileRepository projectFileRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public MediaFileDto storeFile(Long uploadedByUserId, MultipartFile file) {
        return storeFileInternal(uploadedByUserId, file, null);
    }

    @Override
    public List<MediaUploadResultDto> storeFiles(Long uploadedByUserId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new FileUploadException("No files provided");
        }
        List<MediaUploadResultDto> results = new ArrayList<>();
        for (MultipartFile file : files) {
            String originalName = file != null && file.getOriginalFilename() != null
                    ? file.getOriginalFilename() : "unknown";
            try {
                MediaFileDto dto = storeFileInternal(uploadedByUserId, file, null);
                results.add(MediaUploadResultDto.ok(originalName, dto));
            } catch (Exception e) {
                results.add(MediaUploadResultDto.failed(originalName, e.getMessage()));
            }
        }
        return results;
    }

    @Override
    @Transactional
    public ProjectFileDetailDto storeProjectFiles(Long uploadedByUserId, Long projectId, String title, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new FileUploadException("No files provided");
        }

        ProjectFile project;
        if (projectId != null) {
            project = projectFileRepository.findById(projectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
            if (!project.getCreatedBy().equals(uploadedByUserId)) {
                throw new AccessDeniedCustomException("You do not have access to this project");
            }
        } else {
            if (title == null || title.isBlank()) {
                throw new FileUploadException("Project title is required when projectId is not provided");
            }
            project = projectFileRepository.findByCreatedByAndTitleIgnoreCase(uploadedByUserId, title.trim())
                    .orElseGet(() -> {
                        ProjectFile p = new ProjectFile();
                        p.setTitle(title.trim());
                        p.setCreatedBy(uploadedByUserId);
                        return projectFileRepository.save(p);
                    });
        }

        List<MediaFileDto> stored = new ArrayList<>();
        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue; // skip bad entries, don't fail whole batch
            stored.add(storeFileInternal(uploadedByUserId, file, project.getId()));
        }

        if (stored.isEmpty()) {
            throw new FileUploadException("All provided files were empty or unreadable");
        }

        project.setUpdatedAt(LocalDateTime.now());
        projectFileRepository.save(project);

        ProjectFileDetailDto result = new ProjectFileDetailDto();
        result.setId(project.getId());
        result.setTitle(project.getTitle());
        result.setFiles(stored);
        return result;
    }

    @Override
    public List<ProjectFileDto> listProjects(Long userId) {
        return projectFileRepository.findByCreatedByOrderByUpdatedAtDesc(userId).stream()
                .map(p -> {
                    ProjectFileDto dto = new ProjectFileDto();
                    dto.setId(p.getId());
                    dto.setTitle(p.getTitle());
                    dto.setFileCount(mediaFileRepository.findByProjectFileIdOrderByCreatedAtAsc(p.getId()).size());
                    dto.setUpdatedAt(p.getUpdatedAt());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public ProjectFileDetailDto getProject(Long userId, Long projectId) {
        ProjectFile project = projectFileRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        if (!project.getCreatedBy().equals(userId)) {
            throw new AccessDeniedCustomException("You do not have access to this project");
        }

        List<MediaFileDto> files = mediaFileRepository.findByProjectFileIdOrderByCreatedAtAsc(projectId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        ProjectFileDetailDto dto = new ProjectFileDetailDto();
        dto.setId(project.getId());
        dto.setTitle(project.getTitle());
        dto.setFiles(files);
        return dto;
    }

    @Override
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || !fileUrl.startsWith("/files/")) return;
        try {
            String storedName = fileUrl.substring("/files/".length());
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.deleteIfExists(uploadPath.resolve(storedName));
        } catch (IOException e) {
            // best-effort - a missing/locked file shouldn't block a chat clear
        }
    }

    // ===== internal helpers =====

    private MediaFileDto storeFileInternal(Long uploadedByUserId, MultipartFile file, Long projectFileId) {
        if (file == null || file.isEmpty()) {
            throw new FileUploadException("Uploaded file is empty");
        }

        String original = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String displayName = projectFileId != null ? computeVersionedFileName(projectFileId, original) : original;
        String ext = displayName.contains(".") ? displayName.substring(displayName.lastIndexOf('.')) : "";
        String storedName = UUID.randomUUID() + ext;

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);
            Path target = uploadPath.resolve(storedName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new FileUploadException("Could not store file: " + e.getMessage());
        }

        MediaFile media = new MediaFile();
        media.setUploadedBy(uploadedByUserId);
        media.setFileName(displayName);
        media.setFileUrl("/files/" + storedName);
        media.setFileType(resolveType(file.getContentType(), ext));
        media.setFileSize(file.getSize());
        media.setStatus(FileStatus.ACTIVE);
        media.setProjectFileId(projectFileId);
        media = mediaFileRepository.save(media);

        return toDto(media);
    }

    // WhatsApp-style duplicate naming: "index.html" -> "index(1).html" ->
    // "index(2).html"... The original (no-suffix) file is never touched or
    // renamed, so it stays reachable under its original name.
    private String computeVersionedFileName(Long projectFileId, String originalName) {
        String base = originalName.contains(".") ? originalName.substring(0, originalName.lastIndexOf('.')) : originalName;
        String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf('.')) : "";

        List<MediaFile> existing = mediaFileRepository.findByProjectFileIdOrderByCreatedAtAsc(projectFileId);
        Pattern versionPattern = Pattern.compile(Pattern.quote(base) + "\\((\\d+)\\)" + Pattern.quote(ext) + "$");

        boolean baseExists = false;
        int maxVersion = 0;
        for (MediaFile mf : existing) {
            String fn = mf.getFileName();
            if (fn == null) continue;
            if (fn.equals(originalName)) {
                baseExists = true;
            }
            Matcher m = versionPattern.matcher(fn);
            if (m.matches()) {
                int v = Integer.parseInt(m.group(1));
                if (v > maxVersion) maxVersion = v;
            }
        }

        if (!baseExists && maxVersion == 0) {
            return originalName; // first time this name is used in this project
        }
        return base + "(" + (maxVersion + 1) + ")" + ext;
    }

    private MediaFileDto toDto(MediaFile media) {
        MediaFileDto dto = new MediaFileDto();
        dto.setId(media.getId());
        dto.setFileName(media.getFileName());
        dto.setFileUrl(media.getFileUrl());
        dto.setFileType(media.getFileType());
        dto.setFileSize(media.getFileSize());
        return dto;
    }

    private FileType resolveType(String contentType, String ext) {
        if (contentType != null) {
            if (contentType.startsWith("image/")) return FileType.IMAGE;
            if (contentType.startsWith("video/")) return FileType.VIDEO;
            if (contentType.startsWith("audio/")) return FileType.AUDIO;
            if (contentType.equals("application/pdf") || contentType.contains("word") || contentType.contains("excel")
                    || contentType.contains("document") || contentType.contains("sheet")
                    || contentType.contains("powerpoint") || contentType.contains("presentation")
                    || contentType.equals("text/plain")) return FileType.DOCUMENT;
            if (contentType.equals("application/zip") || contentType.equals("application/x-zip-compressed")
                    || contentType.equals("application/x-rar-compressed") || contentType.equals("application/x-7z-compressed")
                    || contentType.equals("application/gzip") || contentType.equals("application/x-tar")) return FileType.ARCHIVE;
        }
        if (ext != null) {
            String e = ext.toLowerCase();
            if (e.equals(".zip") || e.equals(".rar") || e.equals(".7z") || e.equals(".tar") || e.equals(".gz"))
                return FileType.ARCHIVE;
        }
        return FileType.OTHER;
    }
}