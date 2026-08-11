package com.demo.hrms.controller;

import com.demo.hrms.dto.ChatMessage;
import com.demo.hrms.service.ChatHistoryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatHistoryController {

    private final ChatHistoryService chatHistoryService;

    public ChatHistoryController(ChatHistoryService chatHistoryService) {
        this.chatHistoryService = chatHistoryService;
    }

    @GetMapping("/history")
    public List<ChatMessage> getHistory() {
        return chatHistoryService.getHistory();
    }
}
