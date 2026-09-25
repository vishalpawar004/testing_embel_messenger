package com.embel.chatmessenger.admin.service;

import com.embel.chatmessenger.admin.dto.AdminDashboardStatsDto;
import com.embel.chatmessenger.admin.dto.AdminUserDto;
import com.embel.chatmessenger.chat.repository.ChatRepository;
import com.embel.chatmessenger.exception.AccessDeniedCustomException;
import com.embel.chatmessenger.exception.ResourceNotFoundException;
import com.embel.chatmessenger.group.repository.GroupRepository;
import com.embel.chatmessenger.message.repository.MessageRepository;
import com.embel.chatmessenger.user.entity.User;
import com.embel.chatmessenger.user.enums.UserStatus;
import com.embel.chatmessenger.user.repository.UserRepository;
import com.embel.chatmessenger.websocket.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final ChatRepository chatRepository;
    private final MessageRepository messageRepository;
    private final PresenceService presenceService;

    @Override
    public List<AdminUserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()))
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void blockUser(Long actingSuperAdminId, Long targetUserId) {
        if (actingSuperAdminId.equals(targetUserId)) {
            throw new AccessDeniedCustomException("You cannot block your own account");
        }
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setIsBlocked(true);
        syncStatus(user);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void unblockUser(Long actingSuperAdminId, Long targetUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setIsBlocked(false);
        syncStatus(user);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void deleteUser(Long actingSuperAdminId, Long targetUserId) {
        if (actingSuperAdminId.equals(targetUserId)) {
            throw new AccessDeniedCustomException("You cannot delete your own account");
        }
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setIsDeleted(true);
        syncStatus(user);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void restoreUser(Long targetUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setIsDeleted(false);
        syncStatus(user);
        userRepository.save(user);
    }

    // Keeps User.status truthful. isBlocked/isDeleted remain the flags every
    // other check actually reads (login, JwtAuthenticationFilter) - this just
    // makes sure `status` always reflects them instead of sitting unused at
    // its default ACTIVE value forever.
    private void syncStatus(User user) {
        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            user.setStatus(UserStatus.DELETED);
        } else if (Boolean.TRUE.equals(user.getIsBlocked())) {
            user.setStatus(UserStatus.BLOCKED);
        } else {
            user.setStatus(UserStatus.ACTIVE);
        }
    }

    @Override
    public AdminDashboardStatsDto getDashboardStats() {
        AdminDashboardStatsDto dto = new AdminDashboardStatsDto();
        dto.setTotalUsers(userRepository.count());
        dto.setBlockedUsers(userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getIsBlocked())).count());
        dto.setTotalGroups(groupRepository.count());
        dto.setTotalChats(chatRepository.count());
        dto.setTotalMessages(messageRepository.countByIsDeletedFalse());
        return dto;
    }

    private AdminUserDto toDto(User user) {
        AdminUserDto dto = new AdminUserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setRole(user.getRole());
        dto.setStatus(user.getStatus());
        dto.setBlocked(Boolean.TRUE.equals(user.getIsBlocked()));
        dto.setOnline(presenceService.isOnline(user.getId()));
        return dto;
    }
}