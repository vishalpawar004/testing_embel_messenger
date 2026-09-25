package com.embel.chatmessenger.attachment.repository;

import com.embel.chatmessenger.attachment.entity.ProjectFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectFileRepository extends JpaRepository<ProjectFile, Long> {
    List<ProjectFile> findByCreatedByOrderByUpdatedAtDesc(Long createdBy);

    Optional<ProjectFile> findByCreatedByAndTitleIgnoreCase(Long createdBy, String title);
}