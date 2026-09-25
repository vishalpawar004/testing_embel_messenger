package com.embel.chatmessenger.group.entity;

import com.embel.chatmessenger.group.enums.GroupStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "groups_table") // "groups" is a reserved word in MySQL
@Getter
@Setter
public class Group {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private String avatar;

    private Long createdBy;

    private Integer memberCount = 0;

    @Enumerated(EnumType.STRING)
    private GroupStatus status = GroupStatus.ACTIVE;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();
}