package com.embel.chatmessenger.admin.service;

import java.time.LocalDateTime;
import java.util.List;

// SUPER_ADMIN power to hard-clear ANY chat's messages, by raw chatId - works
// identically for 1-to-1 and group chats (chatId alone identifies the chat,
// no need to know if it's a group or resolve a groupId first). This is more
// general than AdminGroupService's group-scoped clear, which only covers
// groups and requires a groupId.
public interface AdminChatService {

    void clearChatMessages(Long chatId);

    void clearChatMessagesInRange(Long chatId, LocalDateTime from, LocalDateTime to);

    void clearChatMessagesForChats(List<Long> chatIds);

    void clearChatMessagesInRangeForChats(List<Long> chatIds, LocalDateTime from, LocalDateTime to);
}