package com.demo.hrms.service;

import com.demo.hrms.dto.ChatMessage;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.UUID;

@Service
public class ChatHistoryService {
    
    private static final int MAX_MESSAGES = 200;
    private static final String HISTORY_FILE = "chat-history.json";
    private final ObjectMapper objectMapper;
    private final List<ChatMessage> messageHistory = new LinkedList<>();
    
    public ChatHistoryService() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }
    
    @PostConstruct
    public void init() {
        loadFromFile();
    }
    
    public synchronized void addMessage(ChatMessage message) {
        if (message.getId() == null) {
            message.setId(UUID.randomUUID().toString());
        }
        if (message.getTimestamp() == null || message.getTimestamp().isEmpty()) {
            message.setTimestamp(java.time.LocalDateTime.now().toString());
        }
        
        messageHistory.add(message);
        
        // 超过200条时移除最早的
        while (messageHistory.size() > MAX_MESSAGES) {
            messageHistory.remove(0);
        }
        
        // 写入文件
        saveToFile();
    }
    
    public synchronized List<ChatMessage> getHistory() {
        return new ArrayList<>(messageHistory);
    }
    
    private synchronized void saveToFile() {
        try {
            File file = new File(HISTORY_FILE);
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(file, messageHistory);
        } catch (IOException e) {
            System.err.println("Failed to save chat history: " + e.getMessage());
        }
    }
    
    private synchronized void loadFromFile() {
        try {
            File file = new File(HISTORY_FILE);
            if (file.exists()) {
                List<ChatMessage> loaded = objectMapper.readValue(file, new TypeReference<List<ChatMessage>>() {});
                if (loaded != null) {
                    messageHistory.clear();
                    messageHistory.addAll(loaded);
                }
            }
        } catch (IOException e) {
            System.err.println("Failed to load chat history: " + e.getMessage());
        }
    }
}
