package com.embel.chatmessenger.admin.service;

import com.embel.chatmessenger.chat.repository.ChatRepository;
import com.embel.chatmessenger.exception.ResourceNotFoundException;
import com.embel.chatmessenger.message.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminChatServiceImpl implements AdminChatService {

    private final ChatRepository chatRepository;
    private final MessageService messageService;

    @Override
    @Transactional
    public void clearChatMessages(Long chatId) {
        chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found: " + chatId));
        messageService.clearChatMessages(chatId);
    }

    @Override
    @Transactional
    public void clearChatMessagesInRange(Long chatId, LocalDateTime from, LocalDateTime to) {
        chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found: " + chatId));
        messageService.clearChatMessagesInRange(chatId, from, to);
    }

    @Override
    @Transactional
    public void clearChatMessagesForChats(List<Long> chatIds) {
        for (Long chatId : chatIds) {
            clearChatMessages(chatId);
        }
    }

    @Override
    @Transactional
    public void clearChatMessagesInRangeForChats(List<Long> chatIds, LocalDateTime from, LocalDateTime to) {
        for (Long chatId : chatIds) {
            clearChatMessagesInRange(chatId, from, to);
        }
    }
}