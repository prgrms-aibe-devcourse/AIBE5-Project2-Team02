package com.DevBridge.devbridge.dto;

import lombok.Data;
import java.util.List;

/**
 * 프론트에서 받는 AI 채팅 요청
 * - systemInstruction: 페이지별 역할 프롬프트 (예: "너는 프로젝트 작성 도우미야")
 * - history: 대화 히스토리. role은 "user" 또는 "model"
 */
@Data
public class AiChatRequest {
    private String systemInstruction;
    private List<Message> history;

    @Data
    public static class Message {
        private String role; // "user" | "model"
        private String text;
    }
}
