package com.demo.hrms.controller;

import com.demo.hrms.dto.ChatMessage;
import com.demo.hrms.dto.TypingNotification;
import com.demo.hrms.dto.UserJoinNotification;
import com.demo.hrms.service.ChatHistoryService;
import com.demo.hrms.service.GeminiService;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class ChatController {

    private final ChatHistoryService chatHistoryService;
    private final GeminiService geminiService;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(ChatHistoryService chatHistoryService, GeminiService geminiService, SimpMessagingTemplate messagingTemplate) {
        this.chatHistoryService = chatHistoryService;
        this.geminiService = geminiService;
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/messages")
    public ChatMessage sendMessage(ChatMessage message) {
        // 保存到历史记录（会自动设置 id 和 timestamp）
        chatHistoryService.addMessage(message);
        
        // 检查是否 @Gemini
        if (message.getContent().contains("@Gemini")) {
            // 提取提问内容（去掉 @Gemini）
            String question = message.getContent().replace("@Gemini", "").trim();
            
            // 异步调用 Gemini
            new Thread(() -> {
                String geminiReply = geminiService.chat(question);
                
                ChatMessage geminiMessage = new ChatMessage();
                geminiMessage.setSender("Gemini");
                geminiMessage.setContent(geminiReply);
                
                // 保存并广播 Gemini 回复
                chatHistoryService.addMessage(geminiMessage);
                messagingTemplate.convertAndSend("/topic/messages", geminiMessage);
            }).start();
        }
        
        return message;
    }

    @MessageMapping("/chat.join")
    @SendTo("/topic/users")
    public UserJoinNotification userJoin(UserJoinNotification notification) {
        return notification;
    }

    @MessageMapping("/chat.typing")
    @SendTo("/topic/typing")
    public TypingNotification typing(TypingNotification notification) {
        return notification;
    }
}
