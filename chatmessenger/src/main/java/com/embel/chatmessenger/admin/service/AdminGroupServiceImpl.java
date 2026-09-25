package com.embel.chatmessenger.admin.service;

import com.embel.chatmessenger.admin.dto.AdminGroupDto;
import com.embel.chatmessenger.chat.entity.Chat;
import com.embel.chatmessenger.chat.repository.ChatRepository;
import com.embel.chatmessenger.exception.AccessDeniedCustomException;
import com.embel.chatmessenger.exception.GroupNotFoundException;
import com.embel.chatmessenger.exception.ResourceNotFoundException;
import com.embel.chatmessenger.group.dto.GroupUpdateRequest;
import com.embel.chatmessenger.group.entity.Group;
import com.embel.chatmessenger.group.entity.GroupMember;
import com.embel.chatmessenger.group.enums.GroupRole;
import com.embel.chatmessenger.group.enums.GroupStatus;
import com.embel.chatmessenger.group.enums.MemberStatus;
import com.embel.chatmessenger.group.repository.GroupMemberRepository;
import com.embel.chatmessenger.group.repository.GroupRepository;
import com.embel.chatmessenger.message.service.MessageService;
import com.embel.chatmessenger.notification.enums.NotificationType;
import com.embel.chatmessenger.notification.service.NotificationService;
import com.embel.chatmessenger.user.entity.User;
import com.embel.chatmessenger.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminGroupServiceImpl implements AdminGroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final com.embel.chatmessenger.group.repository.GroupBanRepository groupBanRepository;
    private final UserRepository userRepository;
    private final ChatRepository chatRepository;
    private final MessageService messageService;
    private final NotificationService notificationService;

    @Override
    public List<AdminGroupDto> getAllGroups() {
        return groupRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void banGroup(Long groupId) {
        Group group = requireGroup(groupId);
        group.setStatus(GroupStatus.BANNED);
        groupRepository.save(group);
        announce(groupId, "This group has been banned by a platform admin");
    }

    @Override
    @Transactional
    public void unbanGroup(Long groupId) {
        Group group = requireGroup(groupId);
        group.setStatus(GroupStatus.ACTIVE);
        groupRepository.save(group);
        announce(groupId, "This group's ban has been lifted by a platform admin");
    }

    @Override
    @Transactional
    public void deleteGroup(Long groupId) {
        requireGroup(groupId);

        chatRepository.findByGroupId(groupId).ifPresent(chat -> {
            messageService.clearChatMessages(chat.getId());
            chatRepository.delete(chat);
        });
        notificationService.deleteAllForGroup(groupId);
        groupMemberRepository.hardDeleteByGroupId(groupId);
        groupBanRepository.hardDeleteByGroupId(groupId);
        groupRepository.deleteById(groupId);
    }

    @Override
    @Transactional
    public void clearChatMessages(Long groupId) {
        requireGroup(groupId);
        Long chatId = chatRepository.findByGroupId(groupId).map(Chat::getId)
                .orElseThrow(() -> new ResourceNotFoundException("This group has no chat"));
        messageService.clearChatMessages(chatId);
    }

    @Override
    @Transactional
    public void clearChatMessagesForGroups(List<Long> groupIds) {
        for (Long groupId : groupIds) {
            clearChatMessages(groupId);
        }
    }

    @Override
    @Transactional
    public void clearChatMessagesInRange(Long groupId, java.time.LocalDateTime from, java.time.LocalDateTime to) {
        requireGroup(groupId);
        Long chatId = chatRepository.findByGroupId(groupId).map(Chat::getId)
                .orElseThrow(() -> new ResourceNotFoundException("This group has no chat"));
        messageService.clearChatMessagesInRange(chatId, from, to);
    }

    @Override
    @Transactional
    public void clearChatMessagesInRangeForGroups(List<Long> groupIds, java.time.LocalDateTime from, java.time.LocalDateTime to) {
        for (Long groupId : groupIds) {
            clearChatMessagesInRange(groupId, from, to);
        }
    }

    @Override
    @Transactional
    public AdminGroupDto updateGroup(Long groupId, GroupUpdateRequest request) {
        Group group = requireGroup(groupId);
        if (request.getName() != null && !request.getName().isBlank()) group.setName(request.getName());
        if (request.getDescription() != null) group.setDescription(request.getDescription());
        if (request.getAvatar() != null) group.setAvatar(request.getAvatar());
        group = groupRepository.save(group);

        Group finalGroup = group;
        chatRepository.findByGroupId(groupId).ifPresent(chat -> {
            chat.setName(finalGroup.getName());
            chat.setAvatar(finalGroup.getAvatar());
            chatRepository.save(chat);
        });
        announce(groupId, "A platform admin updated the group info");
        return toDto(group);
    }

    @Override
    @Transactional
    public void addMember(Long groupId, Long userId) {
        requireGroup(groupId);
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        if (groupBanRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new AccessDeniedCustomException("User is banned from this group - unblock them first");
        }
        if (groupMemberRepository.findByGroupIdAndUserId(groupId, userId).isPresent()) {
            throw new AccessDeniedCustomException("User is already a member of this group");
        }
        GroupMember member = new GroupMember();
        member.setGroupId(groupId);
        member.setUserId(userId);
        member.setRole(GroupRole.MEMBER);
        member.setStatus(MemberStatus.ACTIVE);
        groupMemberRepository.save(member);

        bumpMemberCount(groupId);
        announce(groupId, "A platform admin added " + nameOf(userId) + " to the group");
        notificationService.notify(userId, "Added to a group",
                "A platform admin added you to \"" + groupName(groupId) + "\"",
                NotificationType.OTHER, null, groupId);
    }

    @Override
    @Transactional
    public void removeMember(Long groupId, Long targetUserId) {
        guardNotLastAdmin(groupId, targetUserId, "remove");
        GroupMember target = requireMember(groupId, targetUserId);
        groupMemberRepository.delete(target);
        bumpMemberCount(groupId);
        announce(groupId, "A platform admin removed " + nameOf(targetUserId) + " from the group");
        notificationService.notify(targetUserId, "Removed from a group",
                "A platform admin removed you from \"" + groupName(groupId) + "\"",
                NotificationType.OTHER, null, groupId);
    }

    @Override
    @Transactional
    public void blockMember(Long groupId, Long targetUserId) {
        guardNotLastAdmin(groupId, targetUserId, "block");
        GroupMember target = requireMember(groupId, targetUserId);

        groupMemberRepository.delete(target);

        if (!groupBanRepository.existsByGroupIdAndUserId(groupId, targetUserId)) {
            com.embel.chatmessenger.group.entity.GroupBan ban = new com.embel.chatmessenger.group.entity.GroupBan();
            ban.setGroupId(groupId);
            ban.setUserId(targetUserId);
            groupBanRepository.save(ban);
        }

        bumpMemberCount(groupId);
        announce(groupId, "A platform admin blocked " + nameOf(targetUserId) + " from the group");
        notificationService.notify(targetUserId, "Blocked from a group",
                "You were blocked from \"" + groupName(groupId) + "\" by a platform admin",
                NotificationType.OTHER, null, groupId);
    }

    @Override
    @Transactional
    public void unblockMember(Long groupId, Long targetUserId) {
        if (!groupBanRepository.existsByGroupIdAndUserId(groupId, targetUserId)) {
            throw new AccessDeniedCustomException("This member is not currently blocked");
        }
        groupBanRepository.deleteByGroupIdAndUserId(groupId, targetUserId);
        announce(groupId, "A platform admin unblocked " + nameOf(targetUserId));
    }

    @Override
    @Transactional
    public void promoteToAdmin(Long groupId, Long targetUserId) {
        GroupMember target = requireMember(groupId, targetUserId);
        target.setRole(GroupRole.ADMIN);
        groupMemberRepository.save(target);
        announce(groupId, "A platform admin made " + nameOf(targetUserId) + " a group admin");
        notificationService.notify(targetUserId, "You're now a group admin",
                "A platform admin made you an admin of \"" + groupName(groupId) + "\"",
                NotificationType.OTHER, null, groupId);
    }

    @Override
    @Transactional
    public void demoteToMember(Long groupId, Long targetUserId) {
        guardNotLastAdmin(groupId, targetUserId, "demote");
        GroupMember target = requireMember(groupId, targetUserId);
        target.setRole(GroupRole.MEMBER);
        groupMemberRepository.save(target);
        announce(groupId, "A platform admin removed " + nameOf(targetUserId) + " as group admin");
    }

    private void announce(Long groupId, String text) {
        chatRepository.findByGroupId(groupId)
                .ifPresent(chat -> messageService.sendSystemMessage(chat.getId(), text));
    }

    private String nameOf(Long userId) {
        return userRepository.findById(userId).map(User::getName).orElse("Someone");
    }

    private String groupName(Long groupId) {
        return groupRepository.findById(groupId).map(Group::getName).orElse("the group");
    }

    private void guardNotLastAdmin(Long groupId, Long targetUserId, String action) {
        GroupMember target = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId).orElse(null);
        if (target == null || target.getRole() != GroupRole.ADMIN) return;
        long activeAdmins = groupMemberRepository.countByGroupIdAndRoleAndStatus(groupId, GroupRole.ADMIN, MemberStatus.ACTIVE);
        if (activeAdmins <= 1) {
            throw new AccessDeniedCustomException("Cannot " + action + " the only remaining admin of this group");
        }
    }

    private void bumpMemberCount(Long groupId) {
        Group group = requireGroup(groupId);
        long count = groupMemberRepository.countByGroupIdAndStatus(groupId, MemberStatus.ACTIVE);
        group.setMemberCount((int) count);
        groupRepository.save(group);
    }

    private Group requireGroup(Long groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found"));
    }

    private GroupMember requireMember(Long groupId, Long userId) {
        return groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this group"));
    }

    private AdminGroupDto toDto(Group group) {
        AdminGroupDto dto = new AdminGroupDto();
        dto.setId(group.getId());
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setMemberCount(group.getMemberCount());
        dto.setCreatedBy(group.getCreatedBy());
        dto.setStatus(group.getStatus());
        return dto;
    }
}