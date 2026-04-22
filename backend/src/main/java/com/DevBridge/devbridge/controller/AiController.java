package com.DevBridge.devbridge.controller;

import com.DevBridge.devbridge.dto.AiChatRequest;
import com.DevBridge.devbridge.dto.AiChatResponse;
import com.DevBridge.devbridge.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AiController {

    private final GeminiService geminiService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request) {
        try {
            String reply = geminiService.chat(request);
            return ResponseEntity.ok(AiChatResponse.builder().reply(reply).build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    AiChatResponse.builder().error(e.getMessage()).build()
            );
        }
    }

    /**
     * POST /api/ai/extract
     * CV/PDF 텍스트를 JSON 구조화 프로필로 추출. oneShot + responseMimeType=json 사용.
     * Body: { "systemInstruction": "...", "text": "cv 원문 텍스트" }
     */
    @PostMapping("/extract")
    public ResponseEntity<AiChatResponse> extract(@RequestBody Map<String, String> body) {
        try {
            String systemInstruction = body.getOrDefault("systemInstruction", "");
            String text = body.getOrDefault("text", "");
            String reply = geminiService.oneShot(systemInstruction, text);
            return ResponseEntity.ok(AiChatResponse.builder().reply(reply).build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    AiChatResponse.builder().error(e.getMessage()).build()
            );
        }
    }
}
