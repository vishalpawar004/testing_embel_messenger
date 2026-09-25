package com.embel.chatmessenger.group.repository;

import com.embel.chatmessenger.group.entity.GroupBan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface GroupBanRepository extends JpaRepository<GroupBan, Long> {

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    Optional<GroupBan> findByGroupIdAndUserId(Long groupId, Long userId);

    // HARD delete - unblocking removes this row entirely, not a flag flip.
    void deleteByGroupIdAndUserId(Long groupId, Long userId);

    // HARD delete - every ban record for a group, used when the group itself
    // is deleted (part of the full cascade).
    @Modifying
    @Query("DELETE FROM GroupBan b WHERE b.groupId = :groupId")
    void hardDeleteByGroupId(@Param("groupId") Long groupId);
}