package com.embel.chatmessenger.message.repository;

import com.embel.chatmessenger.message.entity.StarredMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface StarredMessageRepository extends JpaRepository<StarredMessage, Long> {

    boolean existsByUserIdAndMessageId(Long userId, Long messageId);

    void deleteByUserIdAndMessageId(Long userId, Long messageId);

    List<StarredMessage> findByUserIdOrderByCreatedAtDesc(Long userId);

    // HARD delete - every star on one message, used when that single message
    // itself is hard-deleted.
    void deleteByMessageId(Long messageId);

    @Modifying
    @Query("DELETE FROM StarredMessage s WHERE s.messageId IN (SELECT m.id FROM Message m WHERE m.chatId = :chatId)")
    void hardDeleteByChatId(@Param("chatId") Long chatId);

    @Modifying
    @Query("DELETE FROM StarredMessage s WHERE s.messageId IN (SELECT m.id FROM Message m WHERE m.chatId = :chatId AND m.createdAt BETWEEN :from AND :to)")
    void hardDeleteByChatIdAndDateRange(@Param("chatId") Long chatId,
                                         @Param("from") LocalDateTime from,
                                         @Param("to") LocalDateTime to);
}