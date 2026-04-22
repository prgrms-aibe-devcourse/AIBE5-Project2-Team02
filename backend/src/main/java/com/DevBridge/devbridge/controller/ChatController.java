package com.DevBridge.devbridge.controller;

import com.DevBridge.devbridge.config.StreamChatConfig;
import com.DevBridge.devbridge.dto.ChatRoomResponse;
import com.DevBridge.devbridge.dto.ChatTokenResponse;
import com.DevBridge.devbridge.dto.CreateDmRoomRequest;
import com.DevBridge.devbridge.dto.CreateNegotiationRoomRequest;
import com.DevBridge.devbridge.entity.ChatRoom;
import com.DevBridge.devbridge.entity.User;
import com.DevBridge.devbridge.repository.UserRepository;
import com.DevBridge.devbridge.service.StreamChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Chat endpoints.
 * CORS is handled globally by WebConfig — no @CrossOrigin needed here.
 *
 * Authentication: userId is passed as a query param because Spring Security
 * is not yet active. When enabled, replace @RequestParam Long userId with
 * the authenticated principal from JwtAuthenticationFilter / AuthContext.
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final StreamChatService streamChatService;
    private final UserRepository userRepository;
    private final StreamChatConfig streamChatConfig;

    /**
     * GET /api/chat/token?userId={id}
     *
     * Returns a Stream Chat token for the requesting user.
     * The frontend calls this after login and passes the result to StreamChat.connectUser().
     */
    @GetMapping("/token")
    public ResponseEntity<?> getToken(@RequestParam Long userId) {
        User user = findUserOrThrow(userId);
        try {
            streamChatService.upsertStreamUser(user);
        } catch (Exception e) {
            System.err.println("[StreamChat] Warning: upsertStreamUser failed for user "
                    + userId + ": " + e.getMessage()
                    + " — token still issued.");
        }
        String token = streamChatService.generateToken(user);
        return ResponseEntity.ok(ChatTokenResponse.builder()
                .apiKey(streamChatConfig.getApiKey())
                .token(token)
                .streamUserId(streamChatService.streamUserId(user))
                .build());
    }

    /**
     * POST /api/chat/rooms/dm?userId={id}
     * Body: { targetUserId }
     */
    @PostMapping("/rooms/dm")
    public ResponseEntity<?> getOrCreateDmRoom(@RequestParam Long userId,
                                               @RequestBody CreateDmRoomRequest request) {
        User requester = findUserOrThrow(userId);
        User target = findUserOrThrow(request.getTargetUserId());
        if (requester.getId().equals(target.getId())) {
            return ResponseEntity.badRequest().body("Cannot open a DM with yourself.");
        }
        try {
            ChatRoom room = streamChatService.getOrCreateDirectMessageRoom(requester, target);
            return ResponseEntity.ok(ChatRoomResponse.from(room));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    /**
     * POST /api/chat/rooms/negotiation?userId={id}
     * Body: { contractNegotiationId, clientUserId, partnerUserId }
     */
    @PostMapping("/rooms/negotiation")
    public ResponseEntity<?> getOrCreateNegotiationRoom(@RequestParam Long userId,
                                                        @RequestBody CreateNegotiationRoomRequest request) {
        User client = findUserOrThrow(request.getClientUserId());
        User partner = findUserOrThrow(request.getPartnerUserId());
        if (!userId.equals(client.getId()) && !userId.equals(partner.getId())) {
            return ResponseEntity.status(403).body("Not a participant in this negotiation.");
        }
        ChatRoom room = streamChatService.getOrCreateNegotiationRoom(
                request.getContractNegotiationId(), client, partner);
        return ResponseEntity.ok(ChatRoomResponse.from(room));
    }

    /**
     * GET /api/chat/rooms?userId={id}
     */
    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomResponse>> getRooms(@RequestParam Long userId) {
        User user = findUserOrThrow(userId);
        List<ChatRoomResponse> rooms = streamChatService.getRoomsForUser(user)
                .stream()
                .map(ChatRoomResponse::from)
                .toList();
        return ResponseEntity.ok(rooms);
    }

    /**
     * GET /api/chat/rooms/{roomId}
     */
    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<?> getRoom(@PathVariable Long roomId) {
        return streamChatService.getRoomById(roomId)
                .map(r -> ResponseEntity.ok(ChatRoomResponse.from(r)))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * GET /api/chat/health
     */
    @GetMapping("/health")
    public ResponseEntity<?> checkStreamHealth() {
        try {
            io.getstream.chat.java.models.App.get().request();
            return ResponseEntity.ok(Map.of("status", "ok", "stream", "connected"));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "status", "error",
                    "stream", "disconnected",
                    "detail", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()
            ));
        }
    }

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
    }
}
