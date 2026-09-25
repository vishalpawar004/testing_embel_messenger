package com.embel.chatmessenger.group.repository;

import com.embel.chatmessenger.group.entity.GroupMember;
import com.embel.chatmessenger.group.enums.GroupRole;
import com.embel.chatmessenger.group.enums.MemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);

    List<GroupMember> findByGroupIdAndStatus(Long groupId, MemberStatus status);

    List<GroupMember> findByUserIdAndStatus(Long userId, MemberStatus status);

    boolean existsByGroupIdAndUserIdAndRoleAndStatus(Long groupId, Long userId, GroupRole role, MemberStatus status);

    long countByGroupIdAndStatus(Long groupId, MemberStatus status);

    // used to protect the last remaining admin from demoting/leaving
    long countByGroupIdAndRoleAndStatus(Long groupId, GroupRole role, MemberStatus status);

    // HARD delete - every membership row for this group, ACTIVE/LEFT/REMOVED/
    // BANNED alike, permanently removed. Used when a group itself is deleted.
    @Modifying
    @Query("DELETE FROM GroupMember gm WHERE gm.groupId = :groupId")
    void hardDeleteByGroupId(@Param("groupId") Long groupId);
}