package com.embel.chatmessenger.user.controller;

import com.embel.chatmessenger.common.response.ApiResponse;
import com.embel.chatmessenger.user.dto.UserDto;
import com.embel.chatmessenger.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Search for members and view profiles. This is the one search used both for starting a new 1-to-1 chat and for picking someone to add to a group.")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @Operation(
        summary = "Search members",
        description = "q matches against name, email, OR phone (any one, partial match, case-insensitive for name/email) - "
            + "the caller doesn't need to know which field they're typing. Always excludes yourself from the results. "
            + "Pass groupId when this search is for 'Add member' on a specific group: every matching user still comes back "
            + "(nobody is hidden), but each result carries alreadyInGroup=true/false so the frontend can show existing "
            + "members checked/grayed-out (WhatsApp-style) instead of filtering them out. Omit groupId for a plain "
            + "'start a new chat' search, where alreadyInGroup is always false."
    )
    @GetMapping("/search")
    public ApiResponse<List<UserDto>> search(
            @AuthenticationPrincipal Long userId,
            @Parameter(description = "Search text - matched against name, email, and phone") @RequestParam(required = false) String q,
            @Parameter(description = "Optional - flag existing members of this group instead of hiding them") @RequestParam(required = false) Long groupId) {
        return ApiResponse.success(userService.searchMembers(userId, q, groupId));
    }

    @Operation(
        summary = "Get a user's public profile",
        description = "Safe, public-facing fields only (no email/phone/role/blocked-status exposed here - that's what the SUPER_ADMIN-only /api/admin/users endpoint is for)."
    )
    @GetMapping("/{id}")
    public ApiResponse<UserDto> getProfile(@Parameter(description = "The user id to look up") @PathVariable Long id) {
        return ApiResponse.success(userService.getProfile(id));
    }

    @Operation(summary = "Get my own profile", description = "Same shape as GET /{id}, just always returns the currently logged-in user - useful for the app header/avatar on login.")
    @GetMapping("/me")
    public ApiResponse<UserDto> me(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(userService.getProfile(userId));
    }
}