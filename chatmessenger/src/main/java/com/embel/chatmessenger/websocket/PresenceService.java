package com.embel.chatmessenger.websocket;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Simple in-memory presence tracker (matches the "no Redis at this scale" decision
// in the requirements doc). Fine for a single-instance deployment.
@Service
public class PresenceService {

    private final Map<Long, LocalDateTime> onlineUsers = new ConcurrentHashMap<>();
    private final SimpMessageSendingOperations messagingTemplate;

    public PresenceService(SimpMessageSendingOperations messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void markOnline(Long userId) {
        onlineUsers.put(userId, LocalDateTime.now());
        messagingTemplate.convertAndSend("/topic/presence", Map.of("userId", userId, "online", true));
    }

    public void markOffline(Long userId) {
        onlineUsers.remove(userId);
        messagingTemplate.convertAndSend("/topic/presence", Map.of("userId", userId, "online", false));
    }

    public boolean isOnline(Long userId) {
        return onlineUsers.containsKey(userId);
    }

    @EventListener
    public void handleConnected(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Long userId = WebSocketAuthInterceptor.extractUserId(accessor.getUser());
        if (userId != null) markOnline(userId);
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Long userId = WebSocketAuthInterceptor.extractUserId(accessor.getUser());
        if (userId != null) markOffline(userId);
    }
}