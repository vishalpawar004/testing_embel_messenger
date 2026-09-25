package com.embel.chatmessenger.chat.controller;

import com.embel.chatmessenger.chat.dto.ChatCreateRequest;
import com.embel.chatmessenger.chat.dto.ChatDto;
import com.embel.chatmessenger.chat.service.ChatService;
import com.embel.chatmessenger.common.response.ApiResponse;
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
@RequestMapping("/api/chats")
@RequiredArgsConstructor
@Tag(name = "Chats", description = "The Home screen. GET /api/chats alone returns both 1-to-1 and group chats together, sorted by recent activity - that single call is what populates the whole Home screen list.")
@SecurityRequirement(name = "bearerAuth")
public class ChatController {

    private final ChatService chatService;

    @Operation(
        summary = "Home screen - my chats",
        description = "Returns 1-to-1 AND group chats together in one list, sorted by most recent message first. "
            + "Each entry includes: last message preview, unreadCount, pinned/muted state, and online status/count. "
            + "Archived 1-to-1 chats are excluded from this list automatically."
    )
    @GetMapping
    public ApiResponse<List<ChatDto>> getMyChats(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(chatService.getChatsForUser(userId));
    }

    @Operation(summary = "Search my chats", description = "Searches only within your own existing chat list by name - NOT the same as /api/users/search, which searches all platform members to start a new chat.")
    @GetMapping("/search")
    public ApiResponse<List<ChatDto>> searchChats(@AuthenticationPrincipal Long userId,
                                                   @Parameter(description = "Text to match against chat/group names") @RequestParam String q) {
        return ApiResponse.success(chatService.searchChats(userId, q));
    }

    @Operation(
        summary = "Start (or reopen) a 1-to-1 chat",
        description = "If a chat with this person already exists, returns that same chat instead of creating a duplicate. "
            + "If it was previously archived, sending this un-archives it automatically."
    )
    @PostMapping
    public ApiResponse<ChatDto> startChat(@AuthenticationPrincipal Long userId,
                                           @Valid @RequestBody ChatCreateRequest request) {
        return ApiResponse.success(chatService.startOneToOneChat(userId, request));
    }

    @Operation(summary = "Get one chat's details", description = "Header info for a chat screen - name, avatar, online status/member count. Call /api/messages/chat/{chatId} separately for the actual message history.")
    @GetMapping("/{chatId}")
    public ApiResponse<ChatDto> getChat(@AuthenticationPrincipal Long userId,
                                         @PathVariable Long chatId) {
        return ApiResponse.success(chatService.getChatById(userId, chatId));
    }

    @Operation(summary = "Pin or unpin a chat", description = "Home-screen-list pin, NOT the same as pinning a message inside a chat (see /api/messages/{id}/pin for that).")
    @PatchMapping("/{chatId}/pin")
    public ApiResponse<String> pin(@AuthenticationPrincipal Long userId,
                                    @PathVariable Long chatId,
                                    @Parameter(description = "true to pin, false to unpin") @RequestParam boolean pinned) {
        chatService.togglePin(userId, chatId, pinned);
        return ApiResponse.success("Updated");
    }

    @Operation(summary = "Mute or unmute a chat", description = "Muted 1-to-1 chats don't generate notifications on new messages (see the Notifications module).")
    @PatchMapping("/{chatId}/mute")
    public ApiResponse<String> mute(@AuthenticationPrincipal Long userId,
                                     @PathVariable Long chatId,
                                     @Parameter(description = "true to mute, false to unmute") @RequestParam boolean muted) {
        chatService.toggleMute(userId, chatId, muted);
        return ApiResponse.success("Updated");
    }

    @Operation(
        summary = "Archive or unarchive a chat",
        description = "1-to-1 chats only - fails with 403 if called on a group chat (leave the group instead). "
            + "Archiving hides the chat from the Home list entirely until either side messages again, which un-archives it automatically."
    )
    @PatchMapping("/{chatId}/archive")
    public ApiResponse<String> archive(@AuthenticationPrincipal Long userId,
                                        @PathVariable Long chatId,
                                        @Parameter(description = "true to archive, false to restore") @RequestParam boolean archived) {
        chatService.toggleArchive(userId, chatId, archived);
        return ApiResponse.success("Updated");
    }

    @Operation(
        summary = "Mark a chat as read",
        description = "Call this the moment a chat screen opens. It clears unreadCount back to 0 AND flips every unread "
            + "message from the other side to READ status, broadcasting that live to them over WebSocket - this is what "
            + "makes read-receipts work, there's no separate 'mark as read' call needed per-message."
    )
    @PatchMapping("/{chatId}/read")
    public ApiResponse<String> markAsRead(@AuthenticationPrincipal Long userId,
                                           @PathVariable Long chatId) {
        chatService.markAsRead(userId, chatId);
        return ApiResponse.success("Marked as read");
    }

    @Operation(
        summary = "Clear this 1-to-1 chat (PERMANENT)",
        description = "1-to-1 chats only - either participant can do this for their own conversation. HARD delete: "
            + "every message, attachment file, reaction, and star for this chat is permanently removed from the "
            + "database and disk, not soft-deleted. Cannot be undone. Fails with 403 if called on a group chat - "
            + "use DELETE /api/groups/{groupId}/messages for those instead. "
            + "Leave from/to out to wipe everything; supply BOTH (ISO date-time) to only wipe that window."
    )
    @DeleteMapping("/{chatId}/messages")
    public ApiResponse<String> clearChatMessages(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long chatId,
            @Parameter(description = "Optional - ISO date-time, e.g. 2026-01-01T00:00:00. Omit for a full clear.")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime from,
            @Parameter(description = "Optional - ISO date-time. Must be supplied together with 'from'.")
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.LocalDateTime to) {
        if (from != null && to != null) {
            chatService.clearChatMessagesInRange(userId, chatId, from, to);
        } else {
            chatService.clearChatMessages(userId, chatId);
        }
        return ApiResponse.success("Chat cleared");
    }
}