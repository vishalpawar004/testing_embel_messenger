package com.embel.chatmessenger.attachment.entity;

import com.embel.chatmessenger.attachment.enums.FileStatus;
import com.embel.chatmessenger.attachment.enums.FileType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "media_files")
@Getter
@Setter
public class MediaFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nullable: file is uploaded first, then linked to a message once the
    // message is created (matches the "attach then send" UI flow).
    @Column(name = "message_id")
    private Long messageId;

    @Column(name = "uploaded_by")
    private Long uploadedBy;

    private String fileName;
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    private FileType fileType;
    
 // Links this file to a Project Files folder (e.g. "ERP"). Null for normal
 // single/multi uploads that aren't part of a named project.
 @Column(name = "project_file_id")
 private Long projectFileId;

    private Long fileSize;

    @Enumerated(EnumType.STRING)
    private FileStatus status = FileStatus.ACTIVE;

    private Boolean isDeleted = false;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}