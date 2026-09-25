package com.embel.chatmessenger.chat.repository;

import com.embel.chatmessenger.chat.entity.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, Long> {

    List<ChatParticipant> findByUserId(Long userId);

    Optional<ChatParticipant> findByChatIdAndUserId(Long chatId, Long userId);

    List<ChatParticipant> findByChatId(Long chatId);

    boolean existsByChatIdAndUserId(Long chatId, Long userId);
}