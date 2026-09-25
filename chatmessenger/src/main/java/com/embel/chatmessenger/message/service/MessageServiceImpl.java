package com.embel.chatmessenger.message.service;

import com.embel.chatmessenger.attachment.entity.MediaFile;
import com.embel.chatmessenger.attachment.repository.MediaFileRepository;
import com.embel.chatmessenger.chat.entity.Chat;
import com.embel.chatmessenger.chat.entity.ChatParticipant;
import com.embel.chatmessenger.chat.enums.ChatType;
import com.embel.chatmessenger.chat.repository.ChatParticipantRepository;
import com.embel.chatmessenger.chat.repository.ChatRepository;
import com.embel.chatmessenger.exception.AccessDeniedCustomException;
import com.embel.chatmessenger.exception.ResourceNotFoundException;
import com.embel.chatmessenger.group.entity.Group;
import com.embel.chatmessenger.group.enums.GroupStatus;
import com.embel.chatmessenger.group.enums.MemberStatus;
import com.embel.chatmessenger.group.repository.GroupMemberRepository;
import com.embel.chatmessenger.group.repository.GroupRepository;
import com.embel.chatmessenger.message.dto.MessageDto;
import com.embel.chatmessenger.message.dto.MessageStatusUpdateRequest;
import com.embel.chatmessenger.message.dto.ReactionSummaryDto;
import com.embel.chatmessenger.message.dto.ReplyPreviewDto;
import com.embel.chatmessenger.message.dto.SendMessageRequest;
import com.embel.chatmessenger.message.entity.Message;
import com.embel.chatmessenger.message.entity.StarredMessage;
import com.embel.chatmessenger.message.enums.MessageStatus;
import com.embel.chatmessenger.message.enums.MessageType;
import com.embel.chatmessenger.message.repository.MessageRepository;
import com.embel.chatmessenger.message.repository.StarredMessageRepository;
import com.embel.chatmessenger.notification.enums.NotificationType;
import com.embel.chatmessenger.notification.service.NotificationService;
import com.embel.chatmessenger.user.entity.User;
import com.embel.chatmessenger.user.repository.UserRepository;
import com.embel.chatmessenger.websocket.PresenceService;
import com.embel.chatmessenger.websocket.dto.ChatMessagePayload;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {

    // Same limit for 1-to-1 and group messages - not configurable per-chat.
    private static final int EDIT_WINDOW_HOURS = 24;

    private final MessageRepository messageRepository;
    private final ChatRepository chatRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupRepository groupRepository;
    private final MediaFileRepository mediaFileRepository;
    private final com.embel.chatmessenger.attachment.service.FileStorageService fileStorageService;
    private final StarredMessageRepository starredMessageRepository;
    private final com.embel.chatmessenger.message.repository.MessageReactionRepository messageReactionRepository;
    private final UserRepository userRepository;
    private final PresenceService presenceService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public MessageDto sendMessage(Long senderId, SendMessageRequest request) {
        Chat chat = chatRepository.findById(request.getChatId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));

        assertIsMemberOfChat(chat, senderId);

        Message message = new Message();
        message.setChatId(chat.getId());
        message.setSenderId(senderId);
        message.setType(request.getType());
        message.setContent(request.getContent());
        message.setStatus(MessageStatus.SENDING);

        if (request.getReplyToMessageId() != null) {
            Message replyTarget = messageRepository.findById(request.getReplyToMessageId()).orElse(null);
            if (replyTarget != null && replyTarget.getChatId().equals(chat.getId())) {
                message.setReplyToMessageId(replyTarget.getId());
            }
        }
        message = messageRepository.save(message);

        try {
            if (request.getMediaFileId() != null) {
                MediaFile media = mediaFileRepository.findById(request.getMediaFileId())
                        .orElseThrow(() -> new ResourceNotFoundException("Attachment not found"));
                message.setFileUrl(media.getFileUrl());
                media.setMessageId(message.getId());
                mediaFileRepository.save(media);
            }
            message.setStatus(resolveInitialSentStatus(chat, senderId));
            message = messageRepository.save(message);
        } catch (Exception e) {
            message.setStatus(MessageStatus.FAILED);
            message = messageRepository.save(message);
        }

        MessageDto dto = toDto(message, senderId);
        messagingTemplate.convertAndSend("/topic/chat." + chat.getId(),
                new ChatMessagePayload("NEW_MESSAGE", dto));
        notifyRecipients(chat, senderId, dto);
        return dto;
    }

    private void notifyRecipients(Chat chat, Long senderId, MessageDto dto) {
        String senderName = dto.getSenderName();
        String preview = dto.getContent() != null && !dto.getContent().isBlank()
                ? dto.getContent() : "[" + dto.getType() + "]";

        if (chat.getType() == ChatType.GROUP) {
            groupMemberRepository.findByGroupIdAndStatus(chat.getGroupId(), MemberStatus.ACTIVE).stream()
                    .map(gm -> gm.getUserId())
                    .filter(uid -> !uid.equals(senderId))
                    .forEach(uid -> notificationService.notify(uid, senderName, preview,
                            NotificationType.MESSAGE, chat.getId(), chat.getGroupId()));
        } else {
            chatParticipantRepository.findByChatId(chat.getId()).stream()
                    .filter(cp -> !cp.getUserId().equals(senderId))
                    .filter(cp -> !Boolean.TRUE.equals(cp.getIsMuted()))
                    .forEach(cp -> notificationService.notify(cp.getUserId(), senderName, preview,
                            NotificationType.MESSAGE, chat.getId(), null));
        }
    }

    private MessageStatus resolveInitialSentStatus(Chat chat, Long senderId) {
        if (chat.getType() != ChatType.ONE_TO_ONE) return MessageStatus.SENT;
        Long otherUserId = chatParticipantRepository.findByChatId(chat.getId()).stream()
                .map(ChatParticipant::getUserId)
                .filter(id -> !id.equals(senderId))
                .findFirst()
                .orElse(null);
        return (otherUserId != null && presenceService.isOnline(otherUserId))
                ? MessageStatus.DELIVERED
                : MessageStatus.SENT;
    }

    @Override
    public Page<MessageDto> getMessages(Long requestingUserId, Long chatId, Pageable pageable) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        assertIsMemberOfChat(chat, requestingUserId);
        return messageRepository.findByChatIdOrderByCreatedAtDesc(chatId, pageable)
                .map(m -> toDto(m, requestingUserId));
    }

    @Override
    @Transactional
    public MessageDto updateStatus(Long requestingUserId, Long messageId, MessageStatusUpdateRequest request) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        Chat chat = chatRepository.findById(message.getChatId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        assertIsMemberOfChat(chat, requestingUserId);

        message.setStatus(request.getStatus());
        message = messageRepository.save(message);

        MessageDto dto = toDto(message, requestingUserId);
        messagingTemplate.convertAndSend("/topic/chat." + chat.getId(),
                new ChatMessagePayload("STATUS_UPDATE", dto));
        return dto;
    }

    @Override
    @Transactional
    public void softDeleteMessage(Long requestingUserId, Long messageId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        if (!message.getSenderId().equals(requestingUserId)) {
            throw new AccessDeniedCustomException("You can only delete your own messages");
        }
        Long chatId = message.getChatId();

        // HARD delete - no more "This message was deleted" tombstone. The
        // message and everything attached to it (its file, reactions, stars)
        // is permanently removed. Broadcast a minimal payload afterward so
        // any open chat window removes the bubble entirely, live.
        List<MediaFile> files = mediaFileRepository.findByMessageId(messageId);
        for (MediaFile file : files) {
            fileStorageService.deleteFile(file.getFileUrl());
        }
        mediaFileRepository.deleteByMessageId(messageId);
        messageReactionRepository.deleteByMessageId(messageId);
        starredMessageRepository.deleteByMessageId(messageId);
        messageRepository.delete(message);

        MessageDto dto = new MessageDto();
        dto.setId(messageId);
        dto.setChatId(chatId);
        dto.setDeleted(true);
        messagingTemplate.convertAndSend("/topic/chat." + chatId,
                new ChatMessagePayload("MESSAGE_DELETED", dto));
    }

    @Override
    @Transactional
    public MessageDto togglePin(Long requestingUserId, Long messageId, boolean pinned) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        Chat chat = chatRepository.findById(message.getChatId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        assertIsMemberOfChat(chat, requestingUserId);

        message.setIsPinned(pinned);
        message = messageRepository.save(message);

        MessageDto dto = toDto(message, requestingUserId);
        messagingTemplate.convertAndSend("/topic/chat." + chat.getId(),
                new ChatMessagePayload("PIN_UPDATE", dto));

        String actorName = userRepository.findById(requestingUserId).map(User::getName).orElse("Someone");
        sendSystemMessage(chat.getId(), actorName + (pinned ? " pinned a message" : " unpinned a message"));

        return dto;
    }

    @Override
    @Transactional
    public List<MessageDto> forwardMessage(Long requestingUserId, Long messageId, List<Long> targetChatIds) {
        Message original = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        if (Boolean.TRUE.equals(original.getIsDeleted())) {
            throw new AccessDeniedCustomException("Cannot forward a deleted message");
        }
        Chat sourceChat = chatRepository.findById(original.getChatId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        assertIsMemberOfChat(sourceChat, requestingUserId);

        List<MessageDto> results = new java.util.ArrayList<>();
        for (Long targetChatId : targetChatIds) {
            Chat targetChat = chatRepository.findById(targetChatId)
                    .orElseThrow(() -> new ResourceNotFoundException("Target chat not found: " + targetChatId));
            assertIsMemberOfChat(targetChat, requestingUserId);

            Message forwarded = new Message();
            forwarded.setChatId(targetChat.getId());
            forwarded.setSenderId(requestingUserId);
            forwarded.setType(original.getType());
            forwarded.setContent(original.getContent());
            forwarded.setFileUrl(original.getFileUrl());
            forwarded.setIsForwarded(true);
            forwarded.setStatus(MessageStatus.SENDING);
            forwarded = messageRepository.save(forwarded);

            forwarded.setStatus(resolveInitialSentStatus(targetChat, requestingUserId));
            forwarded = messageRepository.save(forwarded);

            MessageDto dto = toDto(forwarded, requestingUserId);
            messagingTemplate.convertAndSend("/topic/chat." + targetChat.getId(),
                    new ChatMessagePayload("NEW_MESSAGE", dto));
            notifyRecipients(targetChat, requestingUserId, dto);
            results.add(dto);
        }
        return results;
    }

    @Override
    @Transactional
    public MessageDto reactToMessage(Long requestingUserId, Long messageId, String emoji) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        Chat chat = chatRepository.findById(message.getChatId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        assertIsMemberOfChat(chat, requestingUserId);

        var existing = messageReactionRepository.findByMessageIdAndUserId(messageId, requestingUserId);
        if (existing.isPresent() && existing.get().getEmoji().equals(emoji)) {
            messageReactionRepository.deleteByMessageIdAndUserId(messageId, requestingUserId);
        } else if (existing.isPresent()) {
            com.embel.chatmessenger.message.entity.MessageReaction reaction = existing.get();
            reaction.setEmoji(emoji);
            messageReactionRepository.save(reaction);
        } else {
            com.embel.chatmessenger.message.entity.MessageReaction reaction = new com.embel.chatmessenger.message.entity.MessageReaction();
            reaction.setMessageId(messageId);
            reaction.setUserId(requestingUserId);
            reaction.setEmoji(emoji);
            messageReactionRepository.save(reaction);
        }

        MessageDto dto = toDto(message, requestingUserId);
        messagingTemplate.convertAndSend("/topic/chat." + chat.getId(),
                new ChatMessagePayload("REACTION_UPDATE", dto));
        return dto;
    }

    @Override
    public List<MessageDto> getPinnedMessages(Long requestingUserId, Long chatId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        assertIsMemberOfChat(chat, requestingUserId);
        return messageRepository.findByChatIdAndIsPinnedTrueAndIsDeletedFalse(chatId).stream()
                .map(m -> toDto(m, requestingUserId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MessageDto editMessage(Long requestingUserId, Long messageId, String newContent) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        if (!message.getSenderId().equals(requestingUserId)) {
            throw new AccessDeniedCustomException("You can only edit your own messages");
        }
        if (Boolean.TRUE.equals(message.getIsDeleted())) {
            throw new AccessDeniedCustomException("Cannot edit a deleted message");
        }
        if (message.getType() != MessageType.TEXT) {
            throw new AccessDeniedCustomException("Only text messages can be edited");
        }
        if (message.getCreatedAt().plusHours(EDIT_WINDOW_HOURS).isBefore(java.time.LocalDateTime.now())) {
            throw new AccessDeniedCustomException(
                    "This message can no longer be edited - the " + EDIT_WINDOW_HOURS + "-hour edit window has passed");
        }

        message.setContent(newContent);
        message.setIsEdited(true);
        message = messageRepository.save(message);

        Chat chat = chatRepository.findById(message.getChatId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        MessageDto dto = toDto(message, requestingUserId);
        messagingTemplate.convertAndSend("/topic/chat." + chat.getId(),
                new ChatMessagePayload("MESSAGE_EDITED", dto));
        return dto;
    }

    @Override
    @Transactional
    public MessageDto toggleStar(Long requestingUserId, Long messageId, boolean starred) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        Chat chat = chatRepository.findById(message.getChatId())
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        assertIsMemberOfChat(chat, requestingUserId);

        if (starred) {
            if (!starredMessageRepository.existsByUserIdAndMessageId(requestingUserId, messageId)) {
                StarredMessage sm = new StarredMessage();
                sm.setUserId(requestingUserId);
                sm.setMessageId(messageId);
                starredMessageRepository.save(sm);
            }
        } else {
            starredMessageRepository.deleteByUserIdAndMessageId(requestingUserId, messageId);
        }
        return toDto(message, requestingUserId);
    }

    @Override
    public List<MessageDto> getStarredMessages(Long requestingUserId) {
        return starredMessageRepository.findByUserIdOrderByCreatedAtDesc(requestingUserId).stream()
                .map(sm -> messageRepository.findById(sm.getMessageId()).orElse(null))
                .filter(m -> m != null && !Boolean.TRUE.equals(m.getIsDeleted()))
                .map(m -> toDto(m, requestingUserId))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public MessageDto sendSystemMessage(Long chatId, String content) {
        Message message = new Message();
        message.setChatId(chatId);
        message.setSenderId(null);
        message.setType(MessageType.SYSTEM);
        message.setContent(content);
        message.setStatus(MessageStatus.SENT);
        message = messageRepository.save(message);

        MessageDto dto = toDto(message, null);
        messagingTemplate.convertAndSend("/topic/chat." + chatId,
                new ChatMessagePayload("NEW_MESSAGE", dto));
        return dto;
    }

    @Override
    @Transactional
    public void clearChatMessages(Long chatId) {
        List<MediaFile> files = mediaFileRepository.findByChatId(chatId);

        messageReactionRepository.hardDeleteByChatId(chatId);
        starredMessageRepository.hardDeleteByChatId(chatId);
        mediaFileRepository.hardDeleteByChatId(chatId);
        messageRepository.hardDeleteAllByChatId(chatId);

        for (MediaFile file : files) {
            fileStorageService.deleteFile(file.getFileUrl());
        }

        messagingTemplate.convertAndSend("/topic/chat." + chatId,
                new ChatMessagePayload("CHAT_CLEARED", null));
    }

    @Override
    @Transactional
    public void clearChatMessagesInRange(Long chatId, java.time.LocalDateTime from, java.time.LocalDateTime to) {
        List<MediaFile> files = mediaFileRepository.findByChatIdAndDateRange(chatId, from, to);

        messageReactionRepository.hardDeleteByChatIdAndDateRange(chatId, from, to);
        starredMessageRepository.hardDeleteByChatIdAndDateRange(chatId, from, to);
        mediaFileRepository.hardDeleteByChatIdAndDateRange(chatId, from, to);
        messageRepository.hardDeleteByChatIdAndDateRange(chatId, from, to);

        for (MediaFile file : files) {
            fileStorageService.deleteFile(file.getFileUrl());
        }

        messagingTemplate.convertAndSend("/topic/chat." + chatId,
                new ChatMessagePayload("CHAT_CLEARED", null));
    }

    private void assertIsMemberOfChat(Chat chat, Long userId) {
        if (chat.getType() == ChatType.GROUP) {
            Group group = groupRepository.findById(chat.getGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
            if (group.getStatus() != GroupStatus.ACTIVE) {
                throw new AccessDeniedCustomException("This group is no longer available");
            }
            boolean isMember = groupMemberRepository.findByGroupIdAndUserId(chat.getGroupId(), userId)
                    .filter(gm -> gm.getStatus() == MemberStatus.ACTIVE)
                    .isPresent();
            if (!isMember) {
                throw new AccessDeniedCustomException("You are not an active member of this group chat");
            }
        } else {
            if (!chatParticipantRepository.existsByChatIdAndUserId(chat.getId(), userId)) {
                throw new AccessDeniedCustomException("You are not a participant of this chat");
            }
        }
    }

    private MessageDto toDto(Message message, Long requestingUserId) {
        MessageDto dto = new MessageDto();
        dto.setId(message.getId());
        dto.setChatId(message.getChatId());
        dto.setSenderId(message.getSenderId());

        if (message.getSenderId() != null) {
            User sender = userRepository.findById(message.getSenderId()).orElse(null);
            dto.setSenderName(sender != null ? sender.getName() : "Unknown");
        } else {
            dto.setSenderName("System");
        }

        dto.setType(message.getType());
        dto.setContent(message.getContent());
        dto.setFileUrl(message.getFileUrl());
        dto.setStatus(message.getStatus());
        dto.setPinned(Boolean.TRUE.equals(message.getIsPinned()));
        dto.setEdited(Boolean.TRUE.equals(message.getIsEdited()));
        dto.setForwarded(Boolean.TRUE.equals(message.getIsForwarded()));
        dto.setDeleted(Boolean.TRUE.equals(message.getIsDeleted()));
        dto.setStarred(requestingUserId != null
                && starredMessageRepository.existsByUserIdAndMessageId(requestingUserId, message.getId()));

        if (dto.isDeleted()) {
            dto.setContent("This message was deleted");
            dto.setFileUrl(null);
        }

        if (message.getReplyToMessageId() != null) {
            messageRepository.findById(message.getReplyToMessageId()).ifPresent(replied -> {
                ReplyPreviewDto preview = new ReplyPreviewDto();
                preview.setId(replied.getId());
                preview.setSenderId(replied.getSenderId());
                User repliedSender = replied.getSenderId() != null
                        ? userRepository.findById(replied.getSenderId()).orElse(null) : null;
                preview.setSenderName(repliedSender != null ? repliedSender.getName()
                        : (replied.getSenderId() == null ? "System" : "Unknown"));
                preview.setType(replied.getType());
                if (Boolean.TRUE.equals(replied.getIsDeleted())) {
                    preview.setContent("This message was deleted");
                    preview.setFileUrl(null);
                } else {
                    preview.setContent(replied.getContent());
                    preview.setFileUrl(replied.getFileUrl());
                }
                dto.setReplyTo(preview);
            });
        }

        dto.setCreatedAt(message.getCreatedAt());

        var allReactions = messageReactionRepository.findByMessageId(message.getId());
        java.util.Map<String, Long> counts = allReactions.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        com.embel.chatmessenger.message.entity.MessageReaction::getEmoji,
                        java.util.stream.Collectors.counting()));
        java.util.List<ReactionSummaryDto> summaries = counts.entrySet().stream()
                .map(e -> {
                    ReactionSummaryDto s = new ReactionSummaryDto();
                    s.setEmoji(e.getKey());
                    s.setCount(e.getValue());
                    return s;
                })
                .collect(Collectors.toList());
        dto.setReactions(summaries);

        if (requestingUserId != null) {
            allReactions.stream()
                    .filter(r -> r.getUserId().equals(requestingUserId))
                    .findFirst()
                    .ifPresent(r -> dto.setMyReaction(r.getEmoji()));
        }

        return dto;
    }
}