package com.embel.chatmessenger.chat.service;

import com.embel.chatmessenger.chat.dto.ChatCreateRequest;
import com.embel.chatmessenger.chat.dto.ChatDto;
import com.embel.chatmessenger.chat.entity.Chat;
import com.embel.chatmessenger.chat.entity.ChatParticipant;
import com.embel.chatmessenger.chat.enums.ChatType;
import com.embel.chatmessenger.chat.repository.ChatParticipantRepository;
import com.embel.chatmessenger.chat.repository.ChatRepository;
import com.embel.chatmessenger.exception.AccessDeniedCustomException;
import com.embel.chatmessenger.exception.ResourceNotFoundException;
import com.embel.chatmessenger.group.entity.Group;
import com.embel.chatmessenger.group.entity.GroupMember;
import com.embel.chatmessenger.group.enums.GroupStatus;
import com.embel.chatmessenger.group.enums.MemberStatus;
import com.embel.chatmessenger.group.repository.GroupMemberRepository;
import com.embel.chatmessenger.group.repository.GroupRepository;
import com.embel.chatmessenger.message.dto.MessageStatusUpdateRequest;
import com.embel.chatmessenger.message.entity.Message;
import com.embel.chatmessenger.message.enums.MessageStatus;
import com.embel.chatmessenger.message.repository.MessageRepository;
import com.embel.chatmessenger.message.service.MessageService;
import com.embel.chatmessenger.user.entity.User;
import com.embel.chatmessenger.user.repository.UserRepository;
import com.embel.chatmessenger.websocket.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatRepository chatRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final MessageRepository messageRepository;
    private final MessageService messageService;
    private final UserRepository userRepository;
    private final PresenceService presenceService;

    @Override
    public List<ChatDto> getChatsForUser(Long userId) {
        List<ChatDto> result = chatParticipantRepository.findByUserId(userId).stream()
                .filter(cp -> !Boolean.TRUE.equals(cp.getIsArchived()))
                .map(cp -> {
                    Chat chat = chatRepository.findById(cp.getChatId()).orElse(null);
                    if (chat == null || chat.getType() != ChatType.ONE_TO_ONE) return null;
                    return toOneToOneDto(chat, cp, userId);
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());

        List<ChatDto> groupChats = groupMemberRepository.findByUserIdAndStatus(userId, MemberStatus.ACTIVE).stream()
                .map(gm -> {
                    Group group = groupRepository.findById(gm.getGroupId()).orElse(null);
                    if (group == null || group.getStatus() != GroupStatus.ACTIVE) return null;
                    Chat chat = chatRepository.findByGroupId(group.getId()).orElse(null);
                    if (chat == null) return null;
                    return toGroupDto(chat, group, gm);
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());

        result.addAll(groupChats);
        // Pinned chats first (regardless of type), then most recent activity within each group.
        result.sort(Comparator.comparing(ChatDto::isPinned).reversed()
                .thenComparing(ChatDto::getLastMessageAt, Comparator.nullsLast(Comparator.reverseOrder())));
        return result;
    }

    @Override
    public List<ChatDto> searchChats(Long userId, String query) {
        String q = query == null ? "" : query.toLowerCase();
        return getChatsForUser(userId).stream()
                .filter(c -> c.getName() != null && c.getName().toLowerCase().contains(q))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ChatDto startOneToOneChat(Long userId, ChatCreateRequest request) {
        Long targetUserId = request.getTargetUserId();
        if (targetUserId.equals(userId)) {
            throw new AccessDeniedCustomException("Cannot start a chat with yourself");
        }
        userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        List<ChatParticipant> mine = chatParticipantRepository.findByUserId(userId);
        for (ChatParticipant cp : mine) {
            boolean theirsToo = chatParticipantRepository.existsByChatIdAndUserId(cp.getChatId(), targetUserId);
            if (theirsToo) {
                Chat existing = chatRepository.findById(cp.getChatId()).orElse(null);
                if (existing != null && existing.getType() == ChatType.ONE_TO_ONE) {
                    if (Boolean.TRUE.equals(cp.getIsArchived())) {
                        cp.setIsArchived(false);
                        chatParticipantRepository.save(cp);
                    }
                    return toOneToOneDto(existing, cp, userId);
                }
            }
        }

        Chat chat = new Chat();
        chat.setType(ChatType.ONE_TO_ONE);
        chat.setCreatedBy(userId);
        chat = chatRepository.save(chat);

        ChatParticipant p1 = new ChatParticipant();
        p1.setChatId(chat.getId());
        p1.setUserId(userId);
        chatParticipantRepository.save(p1);

        ChatParticipant p2 = new ChatParticipant();
        p2.setChatId(chat.getId());
        p2.setUserId(targetUserId);
        chatParticipantRepository.save(p2);

        return toOneToOneDto(chat, p1, userId);
    }

    @Override
    public ChatDto getChatById(Long userId, Long chatId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        if (chat.getType() == ChatType.GROUP) {
            Group group = groupRepository.findById(chat.getGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group not found"));
            GroupMember gm = groupMemberRepository.findByGroupIdAndUserId(group.getId(), userId)
                    .filter(m -> m.getStatus() == MemberStatus.ACTIVE)
                    .orElseThrow(() -> new AccessDeniedCustomException("You are not a member of this group"));
            return toGroupDto(chat, group, gm);
        } else {
            ChatParticipant cp = chatParticipantRepository.findByChatIdAndUserId(chatId, userId)
                    .orElseThrow(() -> new AccessDeniedCustomException("You are not a participant of this chat"));
            return toOneToOneDto(chat, cp, userId);
        }
    }

    @Override
    @Transactional
    public void togglePin(Long userId, Long chatId, boolean pinned) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        if (chat.getType() == ChatType.GROUP) {
            GroupMember member = groupMemberRepository.findByGroupIdAndUserId(chat.getGroupId(), userId)
                    .filter(gm -> gm.getStatus() == MemberStatus.ACTIVE)
                    .orElseThrow(() -> new AccessDeniedCustomException("You are not a member of this group"));
            member.setIsPinned(pinned);
            groupMemberRepository.save(member);
        } else {
            ChatParticipant cp = chatParticipantRepository.findByChatIdAndUserId(chatId, userId)
                    .orElseThrow(() -> new AccessDeniedCustomException("You are not a participant of this chat"));
            cp.setIsPinned(pinned);
            chatParticipantRepository.save(cp);
        }
    }

    @Override
    @Transactional
    public void toggleMute(Long userId, Long chatId, boolean muted) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        if (chat.getType() == ChatType.GROUP) {
            GroupMember member = groupMemberRepository.findByGroupIdAndUserId(chat.getGroupId(), userId)
                    .filter(gm -> gm.getStatus() == MemberStatus.ACTIVE)
                    .orElseThrow(() -> new AccessDeniedCustomException("You are not a member of this group"));
            member.setIsMuted(muted);
            groupMemberRepository.save(member);
        } else {
            ChatParticipant cp = chatParticipantRepository.findByChatIdAndUserId(chatId, userId)
                    .orElseThrow(() -> new AccessDeniedCustomException("You are not a participant of this chat"));
            cp.setIsMuted(muted);
            chatParticipantRepository.save(cp);
        }
    }

    @Override
    @Transactional
    public void toggleArchive(Long userId, Long chatId, boolean archived) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        if (chat.getType() != ChatType.ONE_TO_ONE) {
            throw new AccessDeniedCustomException("Archiving is only available for direct chats - leave a group instead");
        }
        ChatParticipant cp = chatParticipantRepository.findByChatIdAndUserId(chatId, userId)
                .orElseThrow(() -> new AccessDeniedCustomException("You are not a participant of this chat"));
        cp.setIsArchived(archived);
        chatParticipantRepository.save(cp);
    }

    @Override
    @Transactional
    public void markAsRead(Long userId, Long chatId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        Long latestMessageId = messageRepository.findFirstByChatIdAndIsDeletedFalseOrderByCreatedAtDesc(chatId)
                .map(Message::getId)
                .orElse(null);
        if (latestMessageId == null) return;

        Long previousLastRead;
        if (chat.getType() == ChatType.GROUP) {
            GroupMember member = groupMemberRepository.findByGroupIdAndUserId(chat.getGroupId(), userId)
                    .filter(gm -> gm.getStatus() == MemberStatus.ACTIVE)
                    .orElseThrow(() -> new AccessDeniedCustomException("You are not a member of this group"));
            previousLastRead = member.getLastReadMessageId() != null ? member.getLastReadMessageId() : 0L;
            member.setLastReadMessageId(latestMessageId);
            groupMemberRepository.save(member);
        } else {
            ChatParticipant cp = chatParticipantRepository.findByChatIdAndUserId(chatId, userId)
                    .orElseThrow(() -> new AccessDeniedCustomException("You are not a participant of this chat"));
            previousLastRead = cp.getLastReadMessageId() != null ? cp.getLastReadMessageId() : 0L;
            cp.setLastReadMessageId(latestMessageId);
            chatParticipantRepository.save(cp);
        }

        // Flip every newly-read message (sent by the OTHER side) to READ and
        // broadcast it, so the sender's tick marks update live. Re-uses
        // MessageService.updateStatus so starred/replyTo/etc stay correct in
        // the broadcast payload instead of duplicating DTO-building logic here.
        List<Message> justRead = messageRepository.findByChatIdAndIdGreaterThanAndSenderIdNotAndIsDeletedFalse(
                chatId, previousLastRead, userId);
        MessageStatusUpdateRequest readRequest = new MessageStatusUpdateRequest();
        readRequest.setStatus(MessageStatus.READ);
        for (Message m : justRead) {
            if (m.getStatus() == MessageStatus.SENT || m.getStatus() == MessageStatus.DELIVERED) {
                messageService.updateStatus(userId, m.getId(), readRequest);
            }
        }
    }

    @Override
    @Transactional
    public void clearChatMessages(Long userId, Long chatId) {
        Chat chat = requireOneToOneChatParticipant(userId, chatId);
        messageService.clearChatMessages(chat.getId());
    }

    @Override
    @Transactional
    public void clearChatMessagesInRange(Long userId, Long chatId, java.time.LocalDateTime from, java.time.LocalDateTime to) {
        Chat chat = requireOneToOneChatParticipant(userId, chatId);
        messageService.clearChatMessagesInRange(chat.getId(), from, to);
    }

    private Chat requireOneToOneChatParticipant(Long userId, Long chatId) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat not found"));
        if (chat.getType() != ChatType.ONE_TO_ONE) {
            throw new AccessDeniedCustomException(
                    "This is a group chat - use DELETE /api/groups/{groupId}/messages to clear it instead");
        }
        if (!chatParticipantRepository.existsByChatIdAndUserId(chatId, userId)) {
            throw new AccessDeniedCustomException("You are not a participant of this chat");
        }
        return chat;
    }

    private ChatDto toOneToOneDto(Chat chat, ChatParticipant myParticipant, Long requestingUserId) {
        User other = chatParticipantRepository.findByChatId(chat.getId()).stream()
                .filter(p -> !p.getUserId().equals(requestingUserId))
                .findFirst()
                .flatMap(p -> userRepository.findById(p.getUserId()))
                .orElse(null);

        ChatDto dto = new ChatDto();
        dto.setId(chat.getId());
        dto.setType(chat.getType());
        dto.setName(other != null ? other.getName() : "Unknown user");
        dto.setAvatar(other != null ? other.getAvatar() : null);
        dto.setPinned(Boolean.TRUE.equals(myParticipant.getIsPinned()));
        dto.setMuted(Boolean.TRUE.equals(myParticipant.getIsMuted()));
        dto.setOnlineMemberCount(other != null && presenceService.isOnline(other.getId()) ? 1 : 0);
        applyLastMessage(dto, chat.getId());

        long lastRead = myParticipant.getLastReadMessageId() != null ? myParticipant.getLastReadMessageId() : 0L;
        dto.setUnreadCount(messageRepository.countByChatIdAndIdGreaterThanAndSenderIdNotAndIsDeletedFalse(
                chat.getId(), lastRead, requestingUserId));
        return dto;
    }

    private ChatDto toGroupDto(Chat chat, Group group, GroupMember myMembership) {
        ChatDto dto = new ChatDto();
        dto.setId(chat.getId());
        dto.setType(chat.getType());
        dto.setName(group.getName());
        dto.setAvatar(group.getAvatar());
        dto.setGroupId(group.getId());
        dto.setPinned(Boolean.TRUE.equals(myMembership.getIsPinned()));
        dto.setMuted(Boolean.TRUE.equals(myMembership.getIsMuted()));

        long onlineCount = groupMemberRepository.findByGroupIdAndStatus(group.getId(), MemberStatus.ACTIVE).stream()
                .filter(gm -> presenceService.isOnline(gm.getUserId()))
                .count();
        dto.setOnlineMemberCount((int) onlineCount);
        applyLastMessage(dto, chat.getId());

        long lastRead = myMembership.getLastReadMessageId() != null ? myMembership.getLastReadMessageId() : 0L;
        dto.setUnreadCount(messageRepository.countByChatIdAndIdGreaterThanAndSenderIdNotAndIsDeletedFalse(
                chat.getId(), lastRead, myMembership.getUserId()));
        return dto;
    }

    private void applyLastMessage(ChatDto dto, Long chatId) {
        messageRepository.findFirstByChatIdAndIsDeletedFalseOrderByCreatedAtDesc(chatId)
                .ifPresent(m -> {
                    dto.setLastMessage(buildPreview(m));
                    dto.setLastMessageAt(m.getCreatedAt());
                });
    }

    private String buildPreview(Message m) {
        if (m.getContent() != null && !m.getContent().isBlank()) return m.getContent();
        if (m.getFileUrl() != null) return "[" + m.getType() + "]";
        return "";
    }
}