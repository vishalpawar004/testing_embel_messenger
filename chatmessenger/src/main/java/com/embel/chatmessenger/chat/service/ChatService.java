package com.embel.chatmessenger.chat.service;

import com.embel.chatmessenger.chat.dto.ChatCreateRequest;
import com.embel.chatmessenger.chat.dto.ChatDto;

import java.util.List;

public interface ChatService {

    List<ChatDto> getChatsForUser(Long userId);

    List<ChatDto> searchChats(Long userId, String query);

    ChatDto startOneToOneChat(Long userId, ChatCreateRequest request);

    ChatDto getChatById(Long userId, Long chatId);

    void togglePin(Long userId, Long chatId, boolean pinned);

    void toggleMute(Long userId, Long chatId, boolean muted);

    // Only meaningful for ONE_TO_ONE chats (hides them from the Home list)
    void toggleArchive(Long userId, Long chatId, boolean archived);

    // Advances the user's lastReadMessageId to the latest message in the chat,
    // which is what drives ChatDto.unreadCount back to 0
    void markAsRead(Long userId, Long chatId);

    // 1-to-1 chats only - either participant can hard-clear their own personal
    // chat. PERMANENT delete: every message, file, reaction, and star for this
    // chat is removed from the database and disk, no soft-delete. Rejects group
    // chats - use GroupService.clearChatMessages for those instead.
    void clearChatMessages(Long userId, Long chatId);

    // Same, but only wipes messages sent within [from, to].
    void clearChatMessagesInRange(Long userId, Long chatId, java.time.LocalDateTime from, java.time.LocalDateTime to);
}