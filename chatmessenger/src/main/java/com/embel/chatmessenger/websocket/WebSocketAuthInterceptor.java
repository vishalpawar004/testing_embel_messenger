package com.embel.chatmessenger.websocket;

import com.embel.chatmessenger.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;

// Runs on every inbound STOMP frame. On CONNECT, reads the JWT the React client
// sent in the "Authorization" STOMP header and attaches it as the session's
// Principal, so later frames (SEND, SUBSCRIBE) know who the user is.
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authHeaders = accessor.getNativeHeader("Authorization");
            String token = (authHeaders != null && !authHeaders.isEmpty()) ? authHeaders.get(0) : null;

            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }

            if (token != null && jwtTokenProvider.validateToken(token)) {
                Long userId = jwtTokenProvider.getUserIdFromToken(token);
                Principal principal = new UsernamePasswordAuthenticationToken(userId, null, List.of());
                accessor.setUser(principal);
            }
        }
        return message;
    }

    // Helper used by PresenceService to pull the userId back out of a session's Principal
    public static Long extractUserId(Principal principal) {
        if (principal == null) return null;
        try {
            return (Long) ((UsernamePasswordAuthenticationToken) principal).getPrincipal();
        } catch (Exception e) {
            return null;
        }
    }
}