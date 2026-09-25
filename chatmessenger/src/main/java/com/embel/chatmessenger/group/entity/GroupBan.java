package com.embel.chatmessenger.group.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

// NOT in the original ERD. Kept deliberately separate from GroupMember: when
// a member is blocked, their GroupMember row is HARD deleted (per the "no
// soft delete" rule), but SOMETHING has to persist to stop them rejoining -
// that's this table's only job. Unblocking hard-deletes this row entirely
// (not a flag flip), which is itself a real hard delete, just of a much
// smaller, purpose-built record than the old "BANNED status" approach.
@Entity
@Table(name = "group_bans", uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "user_id"}))
@Getter
@Setter
public class GroupBan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id")
    private Long groupId;

    @Column(name = "user_id")
    private Long userId;

    private LocalDateTime bannedAt = LocalDateTime.now();
}