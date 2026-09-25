package com.embel.chatmessenger.user.service;

import com.embel.chatmessenger.user.dto.UserDto;
import java.util.List;

public interface UserService {
    // Powers the "New chat" / "Add member" search box.
    // groupId is optional (null = no group context, e.g. a plain "new chat"
    // search). When provided, results are NOT filtered - everyone matching
    // the query still shows up - but each result's alreadyInGroup flag tells
    // the frontend whether to render them checked/disabled (WhatsApp-style)
    // instead of hiding them.
    List<UserDto> searchMembers(Long requestingUserId, String query, Long groupId);
    UserDto getProfile(Long userId);
}