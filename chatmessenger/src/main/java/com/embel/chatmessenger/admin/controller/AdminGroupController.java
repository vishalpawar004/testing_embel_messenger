package com.embel.chatmessenger.admin.controller;

import com.embel.chatmessenger.admin.dto.AdminGroupDto;
import com.embel.chatmessenger.admin.service.AdminGroupService;
import com.embel.chatmessenger.common.response.ApiResponse;
import com.embel.chatmessenger.group.dto.AddMemberRequest;
import com.embel.chatmessenger.group.dto.GroupUpdateRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/groups")
@RequiredArgsConstructor
@Tag(name = "Admin - Groups", description = "SUPER_ADMIN only - enforced at the security-filter level, a non-SUPER_ADMIN token gets a plain 403 before even reaching these methods. "
    + "Unlike the regular Groups endpoints, NONE of these require you to be a member of the group - a SUPER_ADMIN can manage any group platform-wide without ever joining it. "
    + "Every member-management endpoint here mirrors the regular /api/groups/{id}/members/** ones exactly, just membership-free.")
@SecurityRequirement(name = "bearerAuth")
public class AdminGroupController {

    private final AdminGroupService adminGroupService;

    @Operation(summary = "List every group platform-wide", description = "Includes groups you're not a member of, and their current status (ACTIVE/BANNED/DELETED).")
    @GetMapping
    public ApiResponse<List<AdminGroupDto>> getAllGroups() {
        return ApiResponse.success(adminGroupService.getAllGroups());
    }

    @Operation(summary = "Edit any group's info", description = "Works even if you're not a member of this group. Partial update - omitted fields are unchanged.")
    @PutMapping("/{groupId}")
    public ApiResponse<AdminGroupDto> updateGroup(@PathVariable Long groupId,
                                                   @RequestBody GroupUpdateRequest request) {
        return ApiResponse.success(adminGroupService.updateGroup(groupId, request));
    }

    @Operation(summary = "Ban a group platform-wide", description = "Once banned, NOBODY - including the group's own admin - can send messages into it (fails with 403, 'This group is no longer available'). The group still exists and can be unbanned later.")
    @PatchMapping("/{groupId}/ban")
    public ApiResponse<String> ban(@PathVariable Long groupId) {
        adminGroupService.banGroup(groupId);
        return ApiResponse.success("Group banned");
    }

    @Operation(summary = "Lift a group ban", description = "Restores the group to ACTIVE status, messaging works again immediately.")
    @PatchMapping("/{groupId}/unban")
    public ApiResponse<String> unban(@PathVariable Long groupId) {
        adminGroupService.unbanGroup(groupId);
        return ApiResponse.success("Group unbanned");
    }

    @Operation(summary = "Delete a group platform-wide", description = "Soft delete, independent of the group's own admin's wishes - this is a platform moderation action, separate from DELETE /api/groups/{id} which only the group's own admin can call.")
    @DeleteMapping("/{groupId}")
    public ApiResponse<String> delete(@PathVariable Long groupId) {
        adminGroupService.deleteGroup(groupId);
        return ApiResponse.success("Group deleted");
    }

    @Operation(
        summary = "Clear one group's chat (PERMANENT)",
        description = "Works even if you're not a member of this group. HARD delete - every message, attachment file, "
            + "reaction, and star for this chat is permanently removed from the database and disk. The group itself "
            + "is untouched. Cannot be undone."
    )
    @DeleteMapping("/{groupId}/messages")
    public ApiResponse<String> clearChatMessages(@PathVariable Long groupId) {
        adminGroupService.clearChatMessages(groupId);
        return ApiResponse.success("Chat cleared");
    }

    @Operation(
        summary = "Clear multiple groups' chats at once (PERMANENT, bulk)",
        description = "Same as the single-group version above, but pass several groupIds to clear them all in one call. "
            + "Each group is cleared independently - one failing (e.g. a bad id) does not roll back the others already done."
    )
    @PostMapping("/clear-messages")
    public ApiResponse<String> clearChatMessagesBulk(@Valid @RequestBody com.embel.chatmessenger.admin.dto.ClearGroupMessagesRequest request) {
        adminGroupService.clearChatMessagesForGroups(request.getGroupIds());
        return ApiResponse.success("Chats cleared for " + request.getGroupIds().size() + " group(s)");
    }

    @Operation(summary = "Add a member to any group", description = "Works even if you (the SUPER_ADMIN) aren't a member of this group.")
    @PostMapping("/{groupId}/members")
    public ApiResponse<String> addMember(@PathVariable Long groupId,
                                          @Valid @RequestBody AddMemberRequest request) {
        adminGroupService.addMember(groupId, request.getUserId());
        return ApiResponse.success("Member added");
    }

    @Operation(summary = "Remove a member from any group", description = "Kick, not a ban - same distinction as the regular Groups endpoint. Fails if the target is the group's only remaining admin.")
    @DeleteMapping("/{groupId}/members/{targetUserId}")
    public ApiResponse<String> removeMember(@PathVariable Long groupId,
                                             @PathVariable Long targetUserId) {
        adminGroupService.removeMember(groupId, targetUserId);
        return ApiResponse.success("Member removed");
    }

    @Operation(summary = "Block a member in any group", description = "Fails if the target is the group's only remaining admin.")
    @PatchMapping("/{groupId}/members/{targetUserId}/block")
    public ApiResponse<String> blockMember(@PathVariable Long groupId,
                                            @PathVariable Long targetUserId) {
        adminGroupService.blockMember(groupId, targetUserId);
        return ApiResponse.success("Member blocked from this group");
    }

    @Operation(summary = "Unblock a member in any group", description = "Fails with 403 if the target isn't currently blocked.")
    @PatchMapping("/{groupId}/members/{targetUserId}/unblock")
    public ApiResponse<String> unblockMember(@PathVariable Long groupId,
                                              @PathVariable Long targetUserId) {
        adminGroupService.unblockMember(groupId, targetUserId);
        return ApiResponse.success("Member unblocked");
    }

    @Operation(summary = "Promote a member to admin in any group", description = "Works even if you (the SUPER_ADMIN) aren't a member of this group.")
    @PutMapping("/{groupId}/members/{targetUserId}/promote")
    public ApiResponse<String> promote(@PathVariable Long groupId,
                                        @PathVariable Long targetUserId) {
        adminGroupService.promoteToAdmin(groupId, targetUserId);
        return ApiResponse.success("Member promoted to admin");
    }

    @Operation(summary = "Demote an admin to member in any group", description = "Fails if the target is that group's only remaining admin - a group can never be left with zero admins, even via this admin-only path.")
    @PutMapping("/{groupId}/members/{targetUserId}/demote")
    public ApiResponse<String> demote(@PathVariable Long groupId,
                                       @PathVariable Long targetUserId) {
        adminGroupService.demoteToMember(groupId, targetUserId);
        return ApiResponse.success("Admin demoted to member");
    }
}