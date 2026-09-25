package com.embel.chatmessenger.group.service;

import com.embel.chatmessenger.group.dto.GroupCreateRequest;
import com.embel.chatmessenger.group.dto.GroupDto;
import com.embel.chatmessenger.group.dto.GroupMemberDto;
import com.embel.chatmessenger.group.dto.GroupUpdateRequest;

import java.util.List;

public interface GroupService {

    GroupDto createGroup(Long creatorUserId, GroupCreateRequest request);

    List<GroupDto> getMyGroups(Long userId);

    GroupDto getGroup(Long userId, Long groupId);

    List<GroupMemberDto> getMembers(Long groupId);

    void addMember(Long actingUserId, Long groupId, Long newUserId);

    void removeMember(Long actingUserId, Long groupId, Long targetUserId);

    void blockMember(Long actingUserId, Long groupId, Long targetUserId);

    void unblockMember(Long actingUserId, Long groupId, Long targetUserId);

    // Blocked if the leaving user is the last ACTIVE admin while other active
    // members remain - they must promote someone else first, or delete the group.
    void leaveGroup(Long userId, Long groupId);

    void promoteToAdmin(Long actingUserId, Long groupId, Long targetUserId);

    // Blocked if the target is the last ACTIVE admin (would leave the group adminless)
    void demoteToMember(Long actingUserId, Long groupId, Long targetUserId);

    GroupDto updateGroup(Long actingUserId, Long groupId, GroupUpdateRequest request);

    // Group ADMIN disbanding their own group (distinct from a SUPER_ADMIN's
    // platform-wide moderation delete - see admin/service/AdminGroupService)
    void deleteGroup(Long actingUserId, Long groupId);

    // PERMANENT hard delete of every message in this group's chat (files,
    // reactions, stars included) - NOT the same as deleteGroup above, the
    // group itself stays intact, only its chat history is wiped. Posts a
    // fresh "X cleared this chat" system message afterward.
    void clearChatMessages(Long actingUserId, Long groupId);

    // Same as above, but only wipes messages whose createdAt falls in [from, to].
    void clearChatMessagesInRange(Long actingUserId, Long groupId, java.time.LocalDateTime from, java.time.LocalDateTime to);
}