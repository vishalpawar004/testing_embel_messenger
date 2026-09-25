package com.embel.chatmessenger.chat.entity;

import com.embel.chatmessenger.chat.enums.ChatType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "chats")
@Getter
@Setter
public class Chat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private ChatType type;

    // For GROUP chats this mirrors Group.name; for ONE_TO_ONE it can stay null
    // (frontend shows the other participant's name instead).
    private String name;

    private String avatar;

    private Long createdBy;

    // NOT in the original ERD. Added so a GROUP chat can be traced back to its
    // Group row (membership itself still lives entirely in GroupMember).
    // Null for ONE_TO_ONE chats.
    @Column(name = "group_id")
    private Long groupId;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}