package com.embel.chatmessenger.attachment.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "project_files")
@Getter
@Setter
public class ProjectFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Project name, e.g. "ERP". Reused across upload sessions for the same
    // user + title (find-or-create), so today's files and tomorrow's extra
    // files land in the same project instead of creating duplicates.
    private String title;

    @Column(name = "created_by")
    private Long createdBy;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}