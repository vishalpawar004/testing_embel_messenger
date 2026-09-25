package com.embel.chatmessenger.message.repository;

import com.embel.chatmessenger.message.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<Message, Long> {

    Page<Message> findByChatIdOrderByCreatedAtDesc(Long chatId, Pageable pageable);

    Optional<Message> findFirstByChatIdAndIsDeletedFalseOrderByCreatedAtDesc(Long chatId);

    List<Message> findByChatIdAndIsPinnedTrueAndIsDeletedFalse(Long chatId);

    long countByChatIdAndIsDeletedFalse(Long chatId);

    long countByIsDeletedFalse();

    long countByChatIdAndIdGreaterThanAndSenderIdNotAndIsDeletedFalse(Long chatId, Long messageId, Long senderId);

    List<Message> findByChatIdAndIdGreaterThanAndSenderIdNotAndIsDeletedFalse(Long chatId, Long messageId, Long senderId);

    // HARD delete - permanently removes EVERY message row for a chat in one
    // SQL statement.
    @Modifying
    @Query("DELETE FROM Message m WHERE m.chatId = :chatId")
    void hardDeleteAllByChatId(@Param("chatId") Long chatId);

    // HARD delete - only messages whose createdAt falls within [from, to].
    @Modifying
    @Query("DELETE FROM Message m WHERE m.chatId = :chatId AND m.createdAt BETWEEN :from AND :to")
    void hardDeleteByChatIdAndDateRange(@Param("chatId") Long chatId,
                                         @Param("from") LocalDateTime from,
                                         @Param("to") LocalDateTime to);
}