package com.embel.chatmessenger.message.repository;

import com.embel.chatmessenger.message.entity.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {

    List<MessageReaction> findByMessageId(Long messageId);

    Optional<MessageReaction> findByMessageIdAndUserId(Long messageId, Long userId);

    void deleteByMessageIdAndUserId(Long messageId, Long userId);

    // HARD delete - every reaction on one message, used when that single
    // message itself is hard-deleted.
    void deleteByMessageId(Long messageId);

    @Modifying
    @Query("DELETE FROM MessageReaction r WHERE r.messageId IN (SELECT m.id FROM Message m WHERE m.chatId = :chatId)")
    void hardDeleteByChatId(@Param("chatId") Long chatId);

    @Modifying
    @Query("DELETE FROM MessageReaction r WHERE r.messageId IN (SELECT m.id FROM Message m WHERE m.chatId = :chatId AND m.createdAt BETWEEN :from AND :to)")
    void hardDeleteByChatIdAndDateRange(@Param("chatId") Long chatId,
                                         @Param("from") LocalDateTime from,
                                         @Param("to") LocalDateTime to);
}