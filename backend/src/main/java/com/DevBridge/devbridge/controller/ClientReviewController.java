package com.DevBridge.devbridge.controller;

import com.DevBridge.devbridge.dto.ClientReviewCreateRequest;
import com.DevBridge.devbridge.security.AuthContext;
import com.DevBridge.devbridge.service.ClientReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ClientReviewController {

    private final ClientReviewService service;

    /** Partner writes a review about a client. JWT required. */
    @PostMapping("/client")
    public ResponseEntity<?> create(@RequestBody ClientReviewCreateRequest req) {
        Long userId = AuthContext.currentUserId();
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("message", "로그인이 필요합니다."));
        try {
            service.create(userId, req);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
