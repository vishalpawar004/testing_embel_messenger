package com.embel.chatmessenger.websocket;

import com.embel.chatmessenger.message.dto.SendMessageRequest;
import com.embel.chatmessenger.message.service.MessageService;
import com.embel.chatmessenger.websocket.dto.TypingPayload;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

// STOMP destinations the React client sends TO (prefixed with /app, see WebSocketConfig).
// Broadcasts go out on /topic/chat.{chatId} and /topic/chat.{chatId}.typing.
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    // Client sends to: /app/chat.send  with body = SendMessageRequest JSON
    // (this reuses the same validation + persistence + broadcast as the REST endpoint)
    @MessageMapping("/chat.send")
    public void sendMessage(SendMessageRequest request, Principal principal) {
        Long senderId = WebSocketAuthInterceptor.extractUserId(principal);
        if (senderId == null) return; // unauthenticated frame, ignore
        messageService.sendMessage(senderId, request);
    }

    // Client sends to: /app/chat.typing with body = TypingPayload JSON
    @MessageMapping("/chat.typing")
    public void typing(TypingPayload payload, Principal principal) {
        Long userId = WebSocketAuthInterceptor.extractUserId(principal);
        if (userId == null) return;
        payload.setUserId(userId);
        messagingTemplate.convertAndSend("/topic/chat." + payload.getChatId() + ".typing", payload);
    }
}