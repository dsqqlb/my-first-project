package com.demo.hrms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    private String id;
    private String sender;
    private String content;
    private String timestamp;
    private String type; // "SENT" 或 "RECEIVED"
}
