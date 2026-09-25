package com.embel.chatmessenger.chat.repository;

import com.embel.chatmessenger.chat.entity.Chat;
import com.embel.chatmessenger.chat.enums.ChatType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatRepository extends JpaRepository<Chat, Long> {

    Optional<Chat> findByGroupId(Long groupId);

    @Query("SELECT c FROM Chat c WHERE c.id IN :chatIds")
    List<Chat> findAllByIds(@Param("chatIds") List<Long> chatIds);

    List<Chat> findByType(ChatType type);
}