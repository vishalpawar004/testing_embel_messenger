package com.embel.chatmessenger.group.service;

import com.embel.chatmessenger.chat.entity.Chat;
import com.embel.chatmessenger.chat.enums.ChatType;
import com.embel.chatmessenger.chat.repository.ChatRepository;
import com.embel.chatmessenger.exception.AccessDeniedCustomException;
import com.embel.chatmessenger.exception.GroupNotFoundException;
import com.embel.chatmessenger.exception.ResourceNotFoundException;
import com.embel.chatmessenger.group.dto.GroupCreateRequest;
import com.embel.chatmessenger.group.dto.GroupDto;
import com.embel.chatmessenger.group.dto.GroupMemberDto;
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
import com.embel.chatmessenger.websocket.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupServiceImpl implements GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final com.embel.chatmessenger.group.repository.GroupBanRepository groupBanRepository;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final PresenceService presenceService;
    private final MessageService messageService;
    private final NotificationService notificationService;

//    @Override
//    @Transactional
//    public GroupDto createGroup(Long creatorUserId, GroupCreateRequest request) {
//        Group group = new Group();
//        group.setName(request.getName());
//        group.setDescription(request.getDescription());
//        group.setAvatar(request.getAvatar());
//        group.setCreatedBy(creatorUserId);
//        group.setMemberCount(1);
//        group = groupRepository.save(group);
//
//        addMemberRow(group.getId(), creatorUserId, GroupRole.ADMIN);
//
//        int added = 1;
//        List<String> addedNames = new java.util.ArrayList<>();
//        for (Long memberId : request.getMemberUserIds()) {
//            if (memberId.equals(creatorUserId)) continue;
//            User u = userRepository.findById(memberId)
//                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + memberId));
//            addMemberRow(group.getId(), memberId, GroupRole.MEMBER);
//            addedNames.add(u.getName());
//            added++;
//        }
//        group.setMemberCount(added);
//        groupRepository.save(group);
//
//        Chat chat = new Chat();
//        chat.setType(ChatType.GROUP);
//        chat.setName(group.getName());
//        chat.setAvatar(group.getAvatar());
//        chat.setCreatedBy(creatorUserId);
//        chat.setGroupId(group.getId());
//        chat = chatRepository.save(chat);
//
//        String creatorName = nameOf(creatorUserId);
//        String text = addedNames.isEmpty()
//                ? creatorName + " created this group"
//                : creatorName + " created this group and added " + String.join(", ", addedNames);
//        messageService.sendSystemMessage(chat.getId(), text);
//
//        return toDto(group, chat.getId(), GroupRole.ADMIN);
//    }
    
    
    @Override
    @Transactional
    public GroupDto createGroup(Long creatorUserId, GroupCreateRequest request) {
        Group group = new Group();
        group.setName(request.getName());
        group.setDescription(request.getDescription());
        group.setAvatar(request.getAvatar());
        group.setCreatedBy(creatorUserId);
        group.setMemberCount(1);
        group = groupRepository.save(group);

        java.util.Set<Long> addedUserIds = new java.util.HashSet<>();
        addMemberRow(group.getId(), creatorUserId, GroupRole.ADMIN);
        addedUserIds.add(creatorUserId);

        int added = 1;
        List<String> addedNames = new java.util.ArrayList<>();
        for (Long memberId : request.getMemberUserIds()) {
            if (addedUserIds.contains(memberId)) continue;
            User u = userRepository.findById(memberId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + memberId));
            addMemberRow(group.getId(), memberId, GroupRole.MEMBER);
            addedUserIds.add(memberId);
            addedNames.add(u.getName());
            added++;
        }

        // Every SUPER_ADMIN is auto-added as a group ADMIN too, so platform
        // admins always have full visibility and control of every group -
        // e.g. if a group's own admin is unreachable in an emergency, a
        // SUPER_ADMIN can act immediately through the normal group endpoints,
        // not just the separate /api/admin/groups/** override path.
        List<User> superAdmins = userRepository.findByRole(
                com.embel.chatmessenger.user.enums.UserRole.SUPER_ADMIN);
        for (User admin : superAdmins) {
            if (addedUserIds.contains(admin.getId())) continue;
            addMemberRow(group.getId(), admin.getId(), GroupRole.ADMIN);
            addedUserIds.add(admin.getId());
            addedNames.add(admin.getName() + " (platform admin)");
            added++;
        }

        group.setMemberCount(added);
        groupRepository.save(group);

        Chat chat = new Chat();
        chat.setType(ChatType.GROUP);
        chat.setName(group.getName());
        chat.setAvatar(group.getAvatar());
        chat.setCreatedBy(creatorUserId);
        chat.setGroupId(group.getId());
        chat = chatRepository.save(chat);

        String creatorName = nameOf(creatorUserId);
        String text = addedNames.isEmpty()
                ? creatorName + " created this group"
                : creatorName + " created this group and added " + String.join(", ", addedNames);
        messageService.sendSystemMessage(chat.getId(), text);

        return toDto(group, chat.getId(), GroupRole.ADMIN);
    }
    

    private void addMemberRow(Long groupId, Long userId, GroupRole role) {
        GroupMember member = new GroupMember();
        member.setGroupId(groupId);
        member.setUserId(userId);
        member.setRole(role);
        member.setStatus(MemberStatus.ACTIVE);
        groupMemberRepository.save(member);
    }

    @Override
    public List<GroupDto> getMyGroups(Long userId) {
        return groupMemberRepository.findByUserIdAndStatus(userId, MemberStatus.ACTIVE).stream()
                .map(gm -> {
                    Group group = groupRepository.findById(gm.getGroupId()).orElse(null);
                    if (group == null || group.getStatus() != GroupStatus.ACTIVE) return null;
                    Long chatId = chatRepository.findByGroupId(group.getId())
                            .map(Chat::getId).orElse(null);
                    return toDto(group, chatId, gm.getRole());
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    @Override
    public GroupDto getGroup(Long userId, Long groupId) {
        GroupMember member = requireActiveMember(groupId, userId);
        Group group = requireActiveGroup(groupId);
        Long chatId = chatRepository.findByGroupId(groupId).map(Chat::getId).orElse(null);
        return toDto(group, chatId, member.getRole());
    }

    @Override
    public List<GroupMemberDto> getMembers(Long groupId) {
        return groupMemberRepository.findByGroupIdAndStatus(groupId, MemberStatus.ACTIVE).stream()
                .map(gm -> {
                    User user = userRepository.findById(gm.getUserId()).orElse(null);
                    GroupMemberDto dto = new GroupMemberDto();
                    dto.setUserId(gm.getUserId());
                    dto.setName(user != null ? user.getName() : "Unknown");
                    dto.setAvatar(user != null ? user.getAvatar() : null);
                    dto.setRole(gm.getRole());
                    dto.setStatus(gm.getStatus());
                    dto.setOnline(presenceService.isOnline(gm.getUserId()));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addMember(Long actingUserId, Long groupId, Long newUserId) {
        requireAdmin(groupId, actingUserId);
        userRepository.findById(newUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + newUserId));

        if (groupBanRepository.existsByGroupIdAndUserId(groupId, newUserId)) {
            throw new AccessDeniedCustomException("User is banned from this group - unblock them first");
        }
        var existing = groupMemberRepository.findByGroupIdAndUserId(groupId, newUserId);
        if (existing.isPresent()) {
            throw new AccessDeniedCustomException("User is already a member of this group");
        }
        addMemberRow(groupId, newUserId, GroupRole.MEMBER);
        bumpMemberCount(groupId);
        announce(groupId, nameOf(actingUserId) + " added " + nameOf(newUserId) + " to the group");
        notificationService.notify(newUserId, "Added to a group",
                nameOf(actingUserId) + " added you to \"" + groupName(groupId) + "\"",
                NotificationType.OTHER, null, groupId);
    }

    @Override
    @Transactional
    public void removeMember(Long actingUserId, Long groupId, Long targetUserId) {
        requireAdmin(groupId, actingUserId);
        guardNotLastAdmin(groupId, targetUserId, "remove");
        GroupMember target = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this group"));
        groupMemberRepository.delete(target);
        bumpMemberCount(groupId);
        announce(groupId, nameOf(actingUserId) + " removed " + nameOf(targetUserId) + " from the group");
        notificationService.notify(targetUserId, "Removed from a group",
                nameOf(actingUserId) + " removed you from \"" + groupName(groupId) + "\"",
                NotificationType.OTHER, null, groupId);
    }

    @Override
    @Transactional
    public void blockMember(Long actingUserId, Long groupId, Long targetUserId) {
        requireAdmin(groupId, actingUserId);
        if (actingUserId.equals(targetUserId)) {
            throw new AccessDeniedCustomException("You cannot block yourself");
        }
        guardNotLastAdmin(groupId, targetUserId, "block");
        GroupMember target = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this group"));

        groupMemberRepository.delete(target);

        if (!groupBanRepository.existsByGroupIdAndUserId(groupId, targetUserId)) {
            com.embel.chatmessenger.group.entity.GroupBan ban = new com.embel.chatmessenger.group.entity.GroupBan();
            ban.setGroupId(groupId);
            ban.setUserId(targetUserId);
            groupBanRepository.save(ban);
        }

        bumpMemberCount(groupId);
        announce(groupId, nameOf(actingUserId) + " blocked " + nameOf(targetUserId) + " from the group");
        notificationService.notify(targetUserId, "Blocked from a group",
                "You were blocked from \"" + groupName(groupId) + "\"",
                NotificationType.OTHER, null, groupId);
    }

    @Override
    @Transactional
    public void unblockMember(Long actingUserId, Long groupId, Long targetUserId) {
        requireAdmin(groupId, actingUserId);
        if (!groupBanRepository.existsByGroupIdAndUserId(groupId, targetUserId)) {
            throw new AccessDeniedCustomException("This member is not currently blocked");
        }
        groupBanRepository.deleteByGroupIdAndUserId(groupId, targetUserId);
        announce(groupId, nameOf(actingUserId) + " unblocked " + nameOf(targetUserId));
    }

    @Override
    @Transactional
    public void leaveGroup(Long userId, Long groupId) {
        GroupMember member = requireActiveMember(groupId, userId);
        if (member.getRole() == GroupRole.ADMIN) {
            long otherActiveMembers = groupMemberRepository.countByGroupIdAndStatus(groupId, MemberStatus.ACTIVE) - 1;
            long otherAdmins = groupMemberRepository.countByGroupIdAndRoleAndStatus(groupId, GroupRole.ADMIN, MemberStatus.ACTIVE) - 1;
            if (otherAdmins <= 0 && otherActiveMembers > 0) {
                throw new AccessDeniedCustomException(
                        "You are the only admin. Promote another member to admin before leaving, or delete the group.");
            }
        }
        groupMemberRepository.delete(member);
        bumpMemberCount(groupId);
        announce(groupId, nameOf(userId) + " left the group");
    }

    @Override
    @Transactional
    public void promoteToAdmin(Long actingUserId, Long groupId, Long targetUserId) {
        requireAdmin(groupId, actingUserId);
        GroupMember target = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this group"));
        target.setRole(GroupRole.ADMIN);
        groupMemberRepository.save(target);
        announce(groupId, nameOf(actingUserId) + " made " + nameOf(targetUserId) + " an admin");
        notificationService.notify(targetUserId, "You're now a group admin",
                nameOf(actingUserId) + " made you an admin of \"" + groupName(groupId) + "\"",
                NotificationType.OTHER, null, groupId);
    }

    @Override
    @Transactional
    public void demoteToMember(Long actingUserId, Long groupId, Long targetUserId) {
        requireAdmin(groupId, actingUserId);
        guardNotLastAdmin(groupId, targetUserId, "demote");
        GroupMember target = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found in this group"));
        if (target.getRole() != GroupRole.ADMIN) {
            throw new AccessDeniedCustomException("This member is not an admin");
        }
        target.setRole(GroupRole.MEMBER);
        groupMemberRepository.save(target);
        announce(groupId, nameOf(actingUserId) + " removed " + nameOf(targetUserId) + " as admin");
    }

    @Override
    @Transactional
    public GroupDto updateGroup(Long actingUserId, Long groupId, GroupUpdateRequest request) {
        requireAdmin(groupId, actingUserId);
        Group group = requireActiveGroup(groupId);

        if (request.getName() != null && !request.getName().isBlank()) group.setName(request.getName());
        if (request.getDescription() != null) group.setDescription(request.getDescription());
        if (request.getAvatar() != null) group.setAvatar(request.getAvatar());
        group = groupRepository.save(group);
        final Group updatedGroup = group;

        chatRepository.findByGroupId(groupId).ifPresent(chat -> {
            chat.setName(updatedGroup.getName());
            chat.setAvatar(updatedGroup.getAvatar());
            chatRepository.save(chat);
        });

        announce(groupId, nameOf(actingUserId) + " updated the group info");

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, actingUserId).orElse(null);
        Long chatId = chatRepository.findByGroupId(groupId).map(Chat::getId).orElse(null);
        return toDto(group, chatId, member != null ? member.getRole() : GroupRole.ADMIN);
    }

    @Override
    @Transactional
    public void deleteGroup(Long actingUserId, Long groupId) {
        requireAdmin(groupId, actingUserId);
        requireActiveGroup(groupId);

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
    public void clearChatMessages(Long actingUserId, Long groupId) {
        requireAdmin(groupId, actingUserId);
        requireActiveGroup(groupId);
        Long chatId = chatRepository.findByGroupId(groupId).map(Chat::getId)
                .orElseThrow(() -> new ResourceNotFoundException("This group has no chat"));
        messageService.clearChatMessages(chatId);
    }

    @Override
    @Transactional
    public void clearChatMessagesInRange(Long actingUserId, Long groupId, java.time.LocalDateTime from, java.time.LocalDateTime to) {
        requireAdmin(groupId, actingUserId);
        requireActiveGroup(groupId);
        Long chatId = chatRepository.findByGroupId(groupId).map(Chat::getId)
                .orElseThrow(() -> new ResourceNotFoundException("This group has no chat"));
        messageService.clearChatMessagesInRange(chatId, from, to);
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
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found"));
        long count = groupMemberRepository.countByGroupIdAndStatus(groupId, MemberStatus.ACTIVE);
        group.setMemberCount((int) count);
        groupRepository.save(group);
    }

    private GroupMember requireActiveMember(Long groupId, Long userId) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new AccessDeniedCustomException("You are not a member of this group"));
        if (member.getStatus() != MemberStatus.ACTIVE) {
            throw new AccessDeniedCustomException("You are not an active member of this group");
        }
        return member;
    }

    private void requireAdmin(Long groupId, Long userId) {
        GroupMember member = requireActiveMember(groupId, userId);
        if (member.getRole() != GroupRole.ADMIN) {
            throw new AccessDeniedCustomException("Only the group admin can perform this action");
        }
    }

    private Group requireActiveGroup(Long groupId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new GroupNotFoundException("Group not found"));
        if (group.getStatus() != GroupStatus.ACTIVE) {
            throw new GroupNotFoundException("This group is no longer available");
        }
        return group;
    }

    private GroupDto toDto(Group group, Long chatId, GroupRole myRole) {
        GroupDto dto = new GroupDto();
        dto.setId(group.getId());
        dto.setChatId(chatId);
        dto.setName(group.getName());
        dto.setDescription(group.getDescription());
        dto.setAvatar(group.getAvatar());
        dto.setMemberCount(group.getMemberCount());
        dto.setStatus(group.getStatus());
        dto.setMyRole(myRole != null ? myRole.name() : null);
        return dto;
    }
}