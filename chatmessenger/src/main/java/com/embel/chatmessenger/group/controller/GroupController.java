package com.embel.chatmessenger.group.controller;

import com.embel.chatmessenger.common.response.ApiResponse;
import com.embel.chatmessenger.group.dto.AddMemberRequest;
import com.embel.chatmessenger.group.dto.GroupCreateRequest;
import com.embel.chatmessenger.group.dto.GroupDto;
import com.embel.chatmessenger.group.dto.GroupMemberDto;
import com.embel.chatmessenger.group.dto.GroupUpdateRequest;
import com.embel.chatmessenger.group.service.GroupService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@Tag(name = "Groups", description = "Group creation and management, scoped to groups YOU belong to. Endpoints marked 'group ADMIN only' fail with 403 for a plain member of that group - this is a per-group role, separate from the platform-wide SUPER_ADMIN role. For managing a group you're NOT a member of, see the Admin Groups section instead.")
@SecurityRequirement(name = "bearerAuth")
public class GroupController {

    private final GroupService groupService;

    @Operation(
        summary = "Create a group",
        description = "The creator automatically becomes that group's ADMIN (regardless of their platform-wide role - even "
            + "a plain USER becomes ADMIN of a group they create). Everyone in memberUserIds joins as MEMBER. This also "
            + "creates the group's linked chat and posts an auto SYSTEM message announcing the group's creation."
    )
    @PostMapping
    public ApiResponse<GroupDto> createGroup(@AuthenticationPrincipal Long userId,
                                              @Valid @RequestBody GroupCreateRequest request) {
        return ApiResponse.success(groupService.createGroup(userId, request));
    }

    @Operation(summary = "My groups", description = "Only groups you're an ACTIVE member of. Banned/deleted groups never appear here even if you were once a member.")
    @GetMapping
    public ApiResponse<List<GroupDto>> myGroups(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(groupService.getMyGroups(userId));
    }

    @Operation(summary = "Get one group's details", description = "Includes myRole (ADMIN or MEMBER) for the requesting user specifically.")
    @GetMapping("/{groupId}")
    public ApiResponse<GroupDto> getGroup(@AuthenticationPrincipal Long userId,
                                           @PathVariable Long groupId) {
        return ApiResponse.success(groupService.getGroup(userId, groupId));
    }

    @Operation(summary = "Edit group info (name/description/avatar)", description = "Group ADMIN only. Any field left out of the request body is left unchanged (partial update). Also syncs the linked chat's display name/avatar and posts an auto SYSTEM message.")
    @PutMapping("/{groupId}")
    public ApiResponse<GroupDto> updateGroup(@AuthenticationPrincipal Long userId,
                                              @PathVariable Long groupId,
                                              @RequestBody GroupUpdateRequest request) {
        return ApiResponse.success(groupService.updateGroup(userId, groupId, request));
    }

    @Operation(summary = "Delete (disband) the group", description = "Group ADMIN only. Soft delete - the group disappears from every member's list immediately, but the data isn't hard-deleted from the DB.")
    @DeleteMapping("/{groupId}")
    public ApiResponse<String> deleteGroup(@AuthenticationPrincipal Long userId,
                                            @PathVariable Long groupId) {
        groupService.deleteGroup(userId, groupId);
        return ApiResponse.success("Group deleted");
    }

    @Operation(
        summary = "Clear this group's chat (PERMANENT)",
        description = "Group ADMIN only. Unlike deleteGroup above, the group itself is untouched - only its message "
            + "history is wiped. This is a HARD delete: every message, attachment file, reaction, and star for this "
            + "chat is permanently removed from the database and disk, not soft-deleted. Cannot be undone. "
            + "Leave from/to out to wipe everything; supply BOTH (ISO date-time, e.g. 2026-01-01T00:00:00) to only "
            + "wipe messages sent within that window. A fresh system message is posted afterward either way."
    )
    @DeleteMapping("/{groupId}/messages")
    public ApiResponse<String> clearChatMessages(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long groupId,
            @Parameter(description = "Optional - ISO date-time, e.g. 2026-01-01T00:00:00. Omit for a full clear.")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime from,
            @Parameter(description = "Optional - ISO date-time. Must be supplied together with 'from', or omit both for a full clear.")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime to) {
        if (from != null && to != null) {
            groupService.clearChatMessagesInRange(userId, groupId, from, to);
        } else {
            groupService.clearChatMessages(userId, groupId);
        }
        return ApiResponse.success("Chat cleared");
    }

    @Operation(summary = "List group members", description = "Known gap: currently no membership check on this read - any logged-in user can view any group's member roster, even one they're not in.")
    @GetMapping("/{groupId}/members")
    public ApiResponse<List<GroupMemberDto>> getMembers(@PathVariable Long groupId) {
        return ApiResponse.success(groupService.getMembers(groupId));
    }

    @Operation(
        summary = "Add a member",
        description = "Group ADMIN only. Fails with 403 if the user is already an ACTIVE member, or if they're currently "
            + "BANNED from this group (unblock them first via the /unblock endpoint before re-adding). Posts an auto "
            + "SYSTEM message and sends the added user a notification."
    )
    @PostMapping("/{groupId}/members")
    public ApiResponse<String> addMember(@AuthenticationPrincipal Long userId,
                                          @PathVariable Long groupId,
                                          @Valid @RequestBody AddMemberRequest request) {
        groupService.addMember(userId, groupId, request.getUserId());
        return ApiResponse.success("Member added");
    }

    @Operation(summary = "Remove (kick) a member", description = "Group ADMIN only. This is a kick, not a ban - the removed person CAN be added back later via /members. Fails if the target is the group's only remaining admin.")
    @DeleteMapping("/{groupId}/members/{targetUserId}")
    public ApiResponse<String> removeMember(@AuthenticationPrincipal Long userId,
                                             @PathVariable Long groupId,
                                             @PathVariable Long targetUserId) {
        groupService.removeMember(userId, groupId, targetUserId);
        return ApiResponse.success("Member removed");
    }

    @Operation(summary = "Block a member", description = "Group ADMIN only. Unlike remove/kick, a blocked member CANNOT be re-added until explicitly unblocked first. Fails if the target is the only remaining admin, or if you try to block yourself.")
    @PatchMapping("/{groupId}/members/{targetUserId}/block")
    public ApiResponse<String> blockMember(@AuthenticationPrincipal Long userId,
                                            @PathVariable Long groupId,
                                            @PathVariable Long targetUserId) {
        groupService.blockMember(userId, groupId, targetUserId);
        return ApiResponse.success("Member blocked from this group");
    }

    @Operation(summary = "Unblock a member", description = "Group ADMIN only. Fails with 403 if the target isn't currently blocked.")
    @PatchMapping("/{groupId}/members/{targetUserId}/unblock")
    public ApiResponse<String> unblockMember(@AuthenticationPrincipal Long userId,
                                              @PathVariable Long groupId,
                                              @PathVariable Long targetUserId) {
        groupService.unblockMember(userId, groupId, targetUserId);
        return ApiResponse.success("Member unblocked");
    }

    @Operation(
        summary = "Leave a group",
        description = "Any active member can leave. If you're the group's ONLY admin and other members remain, this fails "
            + "with 403 - promote someone else to admin first, or delete the group instead."
    )
    @PostMapping("/{groupId}/leave")
    public ApiResponse<String> leaveGroup(@AuthenticationPrincipal Long userId,
                                           @PathVariable Long groupId) {
        groupService.leaveGroup(userId, groupId);
        return ApiResponse.success("You left the group");
    }

    @Operation(summary = "Promote a member to group admin", description = "Group ADMIN only. A group can have more than one admin.")
    @PutMapping("/{groupId}/members/{targetUserId}/promote")
    public ApiResponse<String> promote(@AuthenticationPrincipal Long userId,
                                        @PathVariable Long groupId,
                                        @PathVariable Long targetUserId) {
        groupService.promoteToAdmin(userId, groupId, targetUserId);
        return ApiResponse.success("Member promoted to admin");
    }

    @Operation(summary = "Demote an admin to plain member", description = "Group ADMIN only. Fails with 403 if the target is the group's only remaining admin - a group can never be left with zero admins.")
    @PutMapping("/{groupId}/members/{targetUserId}/demote")
    public ApiResponse<String> demote(@AuthenticationPrincipal Long userId,
                                       @PathVariable Long groupId,
                                       @PathVariable Long targetUserId) {
        groupService.demoteToMember(userId, groupId, targetUserId);
        return ApiResponse.success("Admin demoted to member");
    }
}