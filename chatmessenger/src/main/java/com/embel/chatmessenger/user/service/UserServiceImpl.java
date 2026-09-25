package com.embel.chatmessenger.user.service;

import com.embel.chatmessenger.exception.ResourceNotFoundException;
import com.embel.chatmessenger.group.enums.MemberStatus;
import com.embel.chatmessenger.group.repository.GroupMemberRepository;
import com.embel.chatmessenger.user.dto.UserDto;
import com.embel.chatmessenger.user.entity.User;
import com.embel.chatmessenger.user.repository.UserRepository;
import com.embel.chatmessenger.websocket.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final PresenceService presenceService;

    @Override
    public List<UserDto> searchMembers(Long requestingUserId, String query, Long groupId) {
        Set<Long> alreadyInGroup = groupId != null
                ? groupMemberRepository.findByGroupIdAndStatus(groupId, MemberStatus.ACTIVE).stream()
                    .map(gm -> gm.getUserId())
                    .collect(Collectors.toSet())
                : Set.of();

        return userRepository.findAll().stream()
                .filter(u -> !u.getId().equals(requestingUserId))
                .filter(u -> !Boolean.TRUE.equals(u.getIsDeleted()))
                .filter(u -> matches(u, query))
                .map(u -> toDto(u, alreadyInGroup.contains(u.getId())))
                .collect(Collectors.toList());
    }

    // Matches on name OR email OR phone - whichever one the query looks like,
    // the person doesn't have to pick a field, they can just type anything.
    private boolean matches(User u, String query) {
        if (query == null || query.isBlank()) return true;
        String q = query.toLowerCase().trim();
        boolean nameMatch = u.getName() != null && u.getName().toLowerCase().contains(q);
        boolean emailMatch = u.getEmail() != null && u.getEmail().toLowerCase().contains(q);
        boolean phoneMatch = u.getPhone() != null && u.getPhone().contains(query.trim());
        return nameMatch || emailMatch || phoneMatch;
    }

    @Override
    public UserDto getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toDto(user, false);
    }

    private UserDto toDto(User user, boolean alreadyInGroup) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setPhone(user.getPhone());
        dto.setAvatar(user.getAvatar());
        dto.setOnline(presenceService.isOnline(user.getId()));
        dto.setAlreadyInGroup(alreadyInGroup);
        return dto;
    }
}