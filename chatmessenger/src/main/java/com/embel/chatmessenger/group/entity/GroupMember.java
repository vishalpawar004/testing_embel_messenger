package com.embel.chatmessenger.group.entity;

import com.embel.chatmessenger.group.enums.GroupRole;
import com.embel.chatmessenger.group.enums.MemberStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_members", uniqueConstraints = @UniqueConstraint(columnNames = {"group_id", "user_id"}))
@Getter
@Setter
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "group_id")
    private Long groupId;

    @Column(name = "user_id")
    private Long userId;

    @Enumerated(EnumType.STRING)
    private GroupRole role = GroupRole.MEMBER;

    @Enumerated(EnumType.STRING)
    private MemberStatus status = MemberStatus.ACTIVE;

    // NOT in the original ERD - mirrors ChatParticipant.lastReadMessageId so
    // group chats can compute an unread count the same way 1-to-1 chats do.
    private Long lastReadMessageId;

    // group chat can be pinned/muted on the Home screen the same way a 1-to-1
    // chat can. Personal to each member - my pinning a group doesn't pin it
    // for anyone else.
    private Boolean isPinned = false;
    private Boolean isMuted = false;

    private LocalDateTime joinedAt = LocalDateTime.now();
}