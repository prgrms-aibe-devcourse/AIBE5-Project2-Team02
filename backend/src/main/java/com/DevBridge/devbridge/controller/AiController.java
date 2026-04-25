package com.DevBridge.devbridge.controller;

import com.DevBridge.devbridge.dto.AiChatRequest;
import com.DevBridge.devbridge.dto.AiChatResponse;
import com.DevBridge.devbridge.service.GeminiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final GeminiService geminiService;

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request) {
        try {
            String reply = geminiService.chat(request);
            return ResponseEntity.ok(AiChatResponse.builder().reply(reply).build());
        } catch (HttpClientErrorException e) {
            String detail = e.getStatusCode() + " | " + e.getResponseBodyAsString();
            return ResponseEntity.internalServerError().body(
                    AiChatResponse.builder().error(detail).build()
            );
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    AiChatResponse.builder().error(e.getMessage()).build()
            );
        }
    }

    @PostMapping("/extract")
    public ResponseEntity<AiChatResponse> extract(@RequestBody Map<String, String> body) {
        try {
            String systemInstruction = body.getOrDefault("systemInstruction", "");
            String text = body.getOrDefault("text", "");
            String reply = geminiService.oneShot(systemInstruction, text);
            return ResponseEntity.ok(AiChatResponse.builder().reply(reply).build());
        } catch (HttpClientErrorException e) {
            String detail = e.getStatusCode() + " | " + e.getResponseBodyAsString();
            return ResponseEntity.internalServerError().body(
                    AiChatResponse.builder().error(detail).build()
            );
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    AiChatResponse.builder().error(e.getMessage()).build()
            );
        }
    }
}
