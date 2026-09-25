package com.embel.chatmessenger.message.service;

import com.embel.chatmessenger.message.dto.MessageDto;
import com.embel.chatmessenger.message.dto.MessageStatusUpdateRequest;
import com.embel.chatmessenger.message.dto.SendMessageRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MessageService {

    // For a ONE_TO_ONE chat, this auto-sets status to DELIVERED instead of SENT
    // if the recipient is currently online (see PresenceService). Group chats
    // stay at SENT (ambiguous "delivered to whom" with multiple recipients).
    // On internal failure (bad mediaFileId, etc.) returns a DTO with status
    // FAILED instead of throwing.
    MessageDto sendMessage(Long senderId, SendMessageRequest request);

    Page<MessageDto> getMessages(Long requestingUserId, Long chatId, Pageable pageable);

    MessageDto updateStatus(Long requestingUserId, Long messageId, MessageStatusUpdateRequest request);

    void softDeleteMessage(Long requestingUserId, Long messageId);

    MessageDto togglePin(Long requestingUserId, Long messageId, boolean pinned);

    List<MessageDto> getPinnedMessages(Long requestingUserId, Long chatId);

    MessageDto editMessage(Long requestingUserId, Long messageId, String newContent);

    // Forwards an existing message's content (text and/or fileUrl - files are
    // referenced, not re-uploaded) into one or more other chats you're a member
    // of. The original message must not be deleted. Each forwarded copy is
    // marked forwarded=true so the frontend can show a "Forwarded" label.
    List<MessageDto> forwardMessage(Long requestingUserId, Long messageId, java.util.List<Long> targetChatIds);

    // One reaction per user per message. Reacting again with the SAME emoji
    // removes it (toggle off); reacting with a DIFFERENT emoji replaces it.
    // Works on any message type (text/image/document/etc.), any active
    // member of the chat can react, not just admins.
    MessageDto reactToMessage(Long requestingUserId, Long messageId, String emoji);

    MessageDto toggleStar(Long requestingUserId, Long messageId, boolean starred);

    List<MessageDto> getStarredMessages(Long requestingUserId);

    // Server-generated message with no human sender (type=SYSTEM), e.g.
    // "Priya added Arjun to the group". Bypasses membership checks since it's
    // never triggered by a user's own API call - only by GroupService/AdminGroupService.
    MessageDto sendSystemMessage(Long chatId, String content);

    // PERMANENT delete - not the soft-delete tombstone. Wipes every message,
    // its linked files (DB rows AND the physical files on disk), reactions,
    // and stars for a chat, in bulk SQL statements (no loading rows into
    // memory) to keep server load low even for a chat with a lot of history.
    // Caller is responsible for authorization - this method does no permission
    // check itself, since it's only ever called from GroupService/AdminGroupService
    // after they've already verified the caller is allowed to do this.
    void clearChatMessages(Long chatId);

    // Same permanent hard-delete, but only for messages whose createdAt falls
    // within [from, to] - lets an admin wipe just a date window instead of
    // everything. Same bulk-SQL approach, same file cleanup on disk.
    void clearChatMessagesInRange(Long chatId, java.time.LocalDateTime from, java.time.LocalDateTime to);
}