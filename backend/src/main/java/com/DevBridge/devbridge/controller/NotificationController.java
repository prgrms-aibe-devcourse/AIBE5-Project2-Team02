package com.DevBridge.devbridge.controller;

import com.DevBridge.devbridge.dto.NotificationResponse;
import com.DevBridge.devbridge.entity.User;
import com.DevBridge.devbridge.repository.UserRepository;
import com.DevBridge.devbridge.service.StreamChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Notification endpoints.
 * CORS handled globally by WebConfig.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final StreamChatService streamChatService;
    private final UserRepository userRepository;

    /** GET /api/notifications?userId={id} — all notifications, newest first. */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getAll(@RequestParam Long userId) {
        User user = findUserOrThrow(userId);
        List<NotificationResponse> list = streamChatService.getNotificationsForUser(user)
                .stream()
                .map(NotificationResponse::from)
                .toList();
        return ResponseEntity.ok(list);
    }

    /** GET /api/notifications/unread?userId={id} — unread notifications only. */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnread(@RequestParam Long userId) {
        User user = findUserOrThrow(userId);
        List<NotificationResponse> list = streamChatService.getUnreadNotificationsForUser(user)
                .stream()
                .map(NotificationResponse::from)
                .toList();
        return ResponseEntity.ok(list);
    }

    /** GET /api/notifications/count?userId={id} — unread count for badge display. */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@RequestParam Long userId) {
        User user = findUserOrThrow(userId);
        long count = streamChatService.countUnreadNotifications(user);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /** PATCH /api/notifications/{notificationId}/read?userId={id} */
    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<Void> markOneRead(@PathVariable Long notificationId,
                                            @RequestParam Long userId) {
        User user = findUserOrThrow(userId);
        streamChatService.markNotificationRead(notificationId, user);
        return ResponseEntity.noContent().build();
    }

    /** PATCH /api/notifications/read-all?userId={id} */
    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllRead(@RequestParam Long userId) {
        User user = findUserOrThrow(userId);
        streamChatService.markAllNotificationsRead(user);
        return ResponseEntity.noContent().build();
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
    }
}
