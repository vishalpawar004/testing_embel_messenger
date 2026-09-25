package com.embel.chatmessenger.admin.controller;

import com.embel.chatmessenger.admin.dto.ClearChatMessagesRequest;
import com.embel.chatmessenger.admin.service.AdminChatService;
import com.embel.chatmessenger.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

// Restricted to SUPER_ADMIN via SecurityConfig ("/api/admin/**"). Unlike
// AdminGroupController's group-scoped clear (which needs a groupId), these
// work directly on a raw chatId - covering 1-to-1 AND group chats alike,
// since a chatId alone identifies either type.
@RestController
@RequestMapping("/api/admin/chats")
@RequiredArgsConstructor
@Tag(name = "Admin - Chats", description = "SUPER_ADMIN only. Permanently clear ANY chat's messages - 1-to-1 or group - by chatId, single or in bulk.")
@SecurityRequirement(name = "bearerAuth")
public class AdminChatController {

    private final AdminChatService adminChatService;

    @Operation(
        summary = "Clear one chat, any type (PERMANENT)",
        description = "Works on a 1-to-1 OR a group chat - pass its chatId directly, no need to know if it's a group. "
            + "HARD delete: every message, attachment file, reaction, and star for this chat is permanently removed "
            + "from the database and disk. Cannot be undone. Leave from/to out for a full clear; supply both for a "
            + "date-range clear."
    )
    @DeleteMapping("/{chatId}/messages")
    public ApiResponse<String> clearChatMessages(
            @Parameter(description = "Works for either a 1-to-1 or a group chat's id") @PathVariable Long chatId,
            @Parameter(description = "Optional - ISO date-time, e.g. 2026-01-01T00:00:00. Omit for a full clear.")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @Parameter(description = "Optional - ISO date-time. Must be supplied together with 'from'.")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        if (from != null && to != null) {
            adminChatService.clearChatMessagesInRange(chatId, from, to);
        } else {
            adminChatService.clearChatMessages(chatId);
        }
        return ApiResponse.success("Chat cleared");
    }

    @Operation(
        summary = "Clear multiple chats at once, any mix of types (PERMANENT, bulk)",
        description = "chatIds can be a mix of 1-to-1 and group chat ids in the same call. Each is cleared "
            + "independently - one bad id does not roll back the others already done. Leave from/to out for a full "
            + "clear of every chat listed; supply both for a date-range clear applied to all of them. "
            + "HARD delete - real SQL DELETE statements, not a soft-delete flag."
    )
    @DeleteMapping("/clear-messages")
    public ApiResponse<String> clearChatMessagesBulk(@Valid @RequestBody ClearChatMessagesRequest request) {
        if (request.getFrom() != null && request.getTo() != null) {
            adminChatService.clearChatMessagesInRangeForChats(request.getChatIds(), request.getFrom(), request.getTo());
        } else {
            adminChatService.clearChatMessagesForChats(request.getChatIds());
        }
        return ApiResponse.success("Chats cleared for " + request.getChatIds().size() + " chat(s)");
    }
}