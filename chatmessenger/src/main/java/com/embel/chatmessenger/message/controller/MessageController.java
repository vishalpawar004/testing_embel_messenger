package com.embel.chatmessenger.message.controller;

import com.embel.chatmessenger.common.response.ApiResponse;
import com.embel.chatmessenger.common.response.PageResponse;
import com.embel.chatmessenger.message.dto.ForwardMessageRequest;
import com.embel.chatmessenger.message.dto.MessageDto;
import com.embel.chatmessenger.message.dto.MessageStatusUpdateRequest;
import com.embel.chatmessenger.message.dto.ReactRequest;
import com.embel.chatmessenger.message.dto.SendMessageRequest;
import com.embel.chatmessenger.message.dto.UpdateMessageContentRequest;
import com.embel.chatmessenger.message.service.MessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Tag(name = "Messages", description = "Send, edit, pin, star, and read messages inside a chat (1-to-1 or group). Every endpoint here requires you to be an active member of the chat/group the message belongs to.")
@SecurityRequirement(name = "bearerAuth")
public class MessageController {

    private final MessageService messageService;

    @Operation(
        summary = "Send a message",
        description = "Sends a TEXT message, or a file message (set mediaFileId from a prior /api/attachments/upload call). "
            + "Optionally set replyToMessageId to quote an earlier message in the same chat. "
            + "For a 1-to-1 chat, the returned status is DELIVERED instead of SENT if the recipient is online right now. "
            + "If something fails internally (e.g. a bad mediaFileId), you still get a 200 response back with status: FAILED - "
            + "this endpoint does not throw a 500 for that case, so always check the status field."
    )
    @PostMapping
    public ApiResponse<MessageDto> send(@AuthenticationPrincipal Long userId,
                                         @Valid @RequestBody SendMessageRequest request) {
        return ApiResponse.success(messageService.sendMessage(userId, request));
    }

    @Operation(
        summary = "Get message history for a chat",
        description = "Paged, newest-first. Use this to load a chat when it's first opened, then rely on the WebSocket "
            + "(/topic/chat.{chatId}) for anything sent after that."
    )
    @GetMapping("/chat/{chatId}")
    public ApiResponse<PageResponse<MessageDto>> getMessages(
            @AuthenticationPrincipal Long userId,
            @Parameter(description = "The chat to fetch history for") @PathVariable Long chatId,
            @Parameter(description = "0-based page index") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Messages per page") @RequestParam(defaultValue = "30") int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return ApiResponse.success(PageResponse.from(messageService.getMessages(userId, chatId, pageable)));
    }

    @Operation(
        summary = "Edit a message",
        description = "Sender-only. Only TEXT messages can be edited (not IMAGE/DOCUMENT/etc.). "
            + "Sets edited: true on the message and broadcasts a MESSAGE_EDITED event over the chat's WebSocket topic. "
            + "Fails with 403 if you're not the original sender."
    )
    @PatchMapping("/{messageId}")
    public ApiResponse<MessageDto> edit(@AuthenticationPrincipal Long userId,
                                         @Parameter(description = "The message to edit") @PathVariable Long messageId,
                                         @Valid @RequestBody UpdateMessageContentRequest request) {
        return ApiResponse.success(messageService.editMessage(userId, messageId, request.getContent()));
    }

    @Operation(
        summary = "Manually set a message's delivery status",
        description = "Normally you don't need this - DELIVERED is set automatically on send if the recipient is online, "
            + "and READ is set automatically when the recipient calls PATCH /api/chats/{chatId}/read. "
            + "Use this only for edge cases where you need to force a specific status."
    )
    @PatchMapping("/{messageId}/status")
    public ApiResponse<MessageDto> updateStatus(@AuthenticationPrincipal Long userId,
                                                 @PathVariable Long messageId,
                                                 @Valid @RequestBody MessageStatusUpdateRequest request) {
        return ApiResponse.success(messageService.updateStatus(userId, messageId, request));
    }

    @Operation(
        summary = "Forward a message",
        description = "Forwards to one or more destination chats at once (1-to-1 and/or group, mixed is fine). "
            + "The original must not be deleted, and you must be a member of both the source chat and every "
            + "destination chat. Files are referenced, not re-uploaded. Each forwarded copy is marked "
            + "forwarded=true so the frontend can show a 'Forwarded' label."
    )
    @PostMapping("/{messageId}/forward")
    public ApiResponse<List<MessageDto>> forward(@AuthenticationPrincipal Long userId,
                                                   @PathVariable Long messageId,
                                                   @Valid @RequestBody ForwardMessageRequest request) {
        return ApiResponse.success(messageService.forwardMessage(userId, messageId, request.getChatIds()));
    }

    @Operation(
        summary = "React to a message",
        description = "One reaction per person per message - any emoji (👍❤️😂 etc.), any message type (text/image/document). "
            + "Sending the SAME emoji you already reacted with removes it (toggle off). Sending a DIFFERENT emoji "
            + "replaces your previous one. Broadcasts REACTION_UPDATE over WebSocket; the returned message's "
            + "reactions field shows the aggregated count per emoji, and myReaction shows your own current pick."
    )
    @PatchMapping("/{messageId}/react")
    public ApiResponse<MessageDto> react(@AuthenticationPrincipal Long userId,
                                          @PathVariable Long messageId,
                                          @Valid @RequestBody ReactRequest request) {
        return ApiResponse.success(messageService.reactToMessage(userId, messageId, request.getEmoji()));
    }

    @Operation(summary = "Delete a message", description = "Sender-only, soft delete. The message stays in history for everyone as a \"This message was deleted\" placeholder instead of disappearing - broadcasts MESSAGE_DELETED live over WebSocket.")
    @DeleteMapping("/{messageId}")
    public ApiResponse<String> delete(@AuthenticationPrincipal Long userId,
                                       @PathVariable Long messageId) {
        messageService.softDeleteMessage(userId, messageId);
        return ApiResponse.success("Message deleted");
    }

    @Operation(
        summary = "Pin or unpin a message",
        description = "Chat-wide - visible to EVERY member of the chat, not just you. Any active member can pin, not just admins. "
            + "Broadcasts a PIN_UPDATE event over WebSocket. For a PRIVATE bookmark only you can see, use /star instead."
    )
    @PatchMapping("/{messageId}/pin")
    public ApiResponse<MessageDto> togglePin(@AuthenticationPrincipal Long userId,
                                              @PathVariable Long messageId,
                                              @Parameter(description = "true to pin, false to unpin") @RequestParam boolean pinned) {
        return ApiResponse.success(messageService.togglePin(userId, messageId, pinned));
    }

    @Operation(summary = "List pinned messages in a chat", description = "Same list for every member of the chat.")
    @GetMapping("/chat/{chatId}/pinned")
    public ApiResponse<List<MessageDto>> getPinned(@AuthenticationPrincipal Long userId,
                                                     @PathVariable Long chatId) {
        return ApiResponse.success(messageService.getPinnedMessages(userId, chatId));
    }

    @Operation(
        summary = "Star or unstar a message",
        description = "PRIVATE bookmark - only visible to you. Not broadcast over WebSocket (unlike pin, which everyone sees). "
            + "Use this for a personal 'saved messages' feature."
    )
    @PatchMapping("/{messageId}/star")
    public ApiResponse<MessageDto> toggleStar(@AuthenticationPrincipal Long userId,
                                               @PathVariable Long messageId,
                                               @Parameter(description = "true to star, false to unstar") @RequestParam boolean starred) {
        return ApiResponse.success(messageService.toggleStar(userId, messageId, starred));
    }

    @Operation(
        summary = "List my starred messages",
        description = "Across every chat at once, not scoped to one chat - this is the data source for a 'Starred messages' tab."
    )
    @GetMapping("/starred")
    public ApiResponse<List<MessageDto>> getStarred(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(messageService.getStarredMessages(userId));
    }
}