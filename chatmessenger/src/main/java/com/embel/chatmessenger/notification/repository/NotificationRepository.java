package com.embel.chatmessenger.notification.repository;

import com.embel.chatmessenger.notification.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndIsReadFalse(Long userId);

    List<Notification> findByUserIdAndIsReadFalse(Long userId);

    // HARD delete - every notification that referenced this group (added/
    // removed/promoted etc.), permanently removed. Used when a group is deleted.
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.relatedGroupId = :groupId")
    void hardDeleteByRelatedGroupId(@Param("groupId") Long groupId);

    // HARD delete - every remaining notification for this user, one SQL
    // statement. Used by "mark all as read", which now deletes instead of
    // flagging, so the notifications table doesn't grow unbounded over time.
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.userId = :userId")
    void hardDeleteByUserId(@Param("userId") Long userId);
}