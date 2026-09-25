package com.embel.chatmessenger.admin.service;

import com.embel.chatmessenger.admin.dto.AdminGroupDto;
import com.embel.chatmessenger.group.dto.GroupUpdateRequest;

import java.util.List;

public interface AdminGroupService {

    List<AdminGroupDto> getAllGroups();

    void banGroup(Long groupId);

    void unbanGroup(Long groupId);

    void deleteGroup(Long groupId);

    // PERMANENT hard delete of every message/file/reaction/star in this
    // group's chat - works even if the SUPER_ADMIN isn't a member. The group
    // itself is untouched. Cannot be undone.
    void clearChatMessages(Long groupId);

    // Same as above, but for several groups in one call - each is cleared
    // independently, one bulk-SQL operation per group.
    void clearChatMessagesForGroups(List<Long> groupIds);

    void clearChatMessagesInRange(Long groupId, java.time.LocalDateTime from, java.time.LocalDateTime to);

    void clearChatMessagesInRangeForGroups(List<Long> groupIds, java.time.LocalDateTime from, java.time.LocalDateTime to);

    // Everything below acts on ANY group, without requiring the SUPER_ADMIN to
    // be a member of it - this is what gives a platform admin the same day-to-day
    // control a group's own admin has, on every group at once.
    AdminGroupDto updateGroup(Long groupId, GroupUpdateRequest request);

    void addMember(Long groupId, Long userId);

    void removeMember(Long groupId, Long targetUserId);

    void blockMember(Long groupId, Long targetUserId);

    void unblockMember(Long groupId, Long targetUserId);

    void promoteToAdmin(Long groupId, Long targetUserId);

    void demoteToMember(Long groupId, Long targetUserId);
}