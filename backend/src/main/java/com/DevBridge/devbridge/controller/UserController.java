package com.DevBridge.devbridge.controller;

import com.DevBridge.devbridge.entity.User;
import com.DevBridge.devbridge.repository.UserRepository;
import com.DevBridge.devbridge.service.StreamChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Public user lookup endpoints used by the chat feature.
 * CORS handled globally by WebConfig.
 *
 * Only exposes id, username, and role — never email or personal data.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final StreamChatService streamChatService;

    /**
     * GET /api/users/search?username={username}
     *
     * Used by the chat page to look up a target user before opening a DM.
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchByUsername(@RequestParam String username) {
        return userRepository.findByUsername(username)
                .map(user -> ResponseEntity.ok(Map.of(
                        "id", user.getId(),
                        "username", user.getUsername(),
                        "userType", user.getUserType().name(),
                        "streamUserId", streamChatService.streamUserId(user)
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/users/by-email?email={email}
     *
     * Resolves a known email to the user's DB id and Stream username.
     * Used by dashboard meeting tabs to establish Stream Chat connections.
     */
    @GetMapping("/by-email")
    public ResponseEntity<?> findByEmail(@RequestParam String email) {
        return userRepository.findByEmail(email)
                .map(user -> ResponseEntity.ok(Map.of(
                        "id", user.getId(),
                        "username", user.getUsername(),
                        "userType", user.getUserType().name(),
                        "streamUserId", streamChatService.streamUserId(user)
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/users/{id}
     *
     * Lightweight public profile lookup used by dashboard meeting tabs to
     * fetch counterpart's display name, avatar, and userType for the
     * chat sidebar. Never returns email or sensitive fields.
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(user -> {
                    java.util.Map<String, Object> body = new java.util.HashMap<>();
                    body.put("id", user.getId());
                    body.put("username", user.getUsername());
                    body.put("userType", user.getUserType() != null ? user.getUserType().name() : null);
                    body.put("profileImageUrl", user.getProfileImageUrl());
                    body.put("streamUserId", streamChatService.streamUserId(user));
                    return ResponseEntity.ok(body);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
