package com.embel.chatmessenger.attachment.repository;

import com.embel.chatmessenger.attachment.entity.MediaFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface MediaFileRepository extends JpaRepository<MediaFile, Long> {
    List<MediaFile> findByMessageId(Long messageId);

    // HARD delete - the MediaFile row(s) for one message, used when that
    // single message itself is hard-deleted. Caller must delete the physical
    // file from disk separately (see FileStorageService.deleteFile) BEFORE
    // calling this, using the list from findByMessageId above.
    void deleteByMessageId(Long messageId);

    @Query("SELECT f FROM MediaFile f WHERE f.messageId IN (SELECT m.id FROM Message m WHERE m.chatId = :chatId)")
    List<MediaFile> findByChatId(@Param("chatId") Long chatId);

    @Modifying
    @Query("DELETE FROM MediaFile f WHERE f.messageId IN (SELECT m.id FROM Message m WHERE m.chatId = :chatId)")
    void hardDeleteByChatId(@Param("chatId") Long chatId);

    @Query("SELECT f FROM MediaFile f WHERE f.messageId IN (SELECT m.id FROM Message m WHERE m.chatId = :chatId AND m.createdAt BETWEEN :from AND :to)")
    List<MediaFile> findByChatIdAndDateRange(@Param("chatId") Long chatId,
                                              @Param("from") LocalDateTime from,
                                              @Param("to") LocalDateTime to);

    @Modifying
    @Query("DELETE FROM MediaFile f WHERE f.messageId IN (SELECT m.id FROM Message m WHERE m.chatId = :chatId AND m.createdAt BETWEEN :from AND :to)")
    void hardDeleteByChatIdAndDateRange(@Param("chatId") Long chatId,
                                         @Param("from") LocalDateTime from,
                                         @Param("to") LocalDateTime to);
    
    List<MediaFile> findByProjectFileIdOrderByCreatedAtAsc(Long projectFileId);
}