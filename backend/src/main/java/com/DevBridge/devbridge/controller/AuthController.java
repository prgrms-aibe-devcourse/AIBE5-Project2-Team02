package com.DevBridge.devbridge.controller;

import com.DevBridge.devbridge.dto.AuthResponse;
import com.DevBridge.devbridge.dto.LoginRequest;
import com.DevBridge.devbridge.dto.SignupRequest;
import com.DevBridge.devbridge.entity.User;
import com.DevBridge.devbridge.security.JwtUtil;
import com.DevBridge.devbridge.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;

    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@RequestBody SignupRequest request) {
        try {
            User user = authService.signup(request);
            String token = jwtUtil.issue(user.getId(), user.getEmail(),
                    user.getUserType() != null ? user.getUserType().name() : "GUEST");
            return ResponseEntity.ok(AuthResponse.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .username(user.getUsername())
                    .phone(user.getPhone())
                    .birthDate(user.getBirthDate())
                    .userType(user.getUserType())
                    .token(token)
                    .message("회원가입이 완료되었습니다.")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message(e.getMessage())
                    .build());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        try {
            User user = authService.login(request);
            String token = jwtUtil.issue(user.getId(), user.getEmail(),
                    user.getUserType() != null ? user.getUserType().name() : "GUEST");
            return ResponseEntity.ok(AuthResponse.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .username(user.getUsername())
                    .phone(user.getPhone())
                    .birthDate(user.getBirthDate())
                    .userType(user.getUserType())
                    .token(token)
                    .message("로그인에 성공했습니다.")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message(e.getMessage())
                    .build());
        }
    }

    /**
     * 소셜 로그인 (구글 등). 프론트가 OAuth 제공자에서 검증한 이메일을 전달하면,
     * 해당 이메일로 등록된 User 에 대해 JWT 를 발급한다.
     * 미가입 이메일은 400 으로 응답하여 호출부에서 회원가입 플로우로 안내.
     */
    @PostMapping("/social-login")
    public ResponseEntity<AuthResponse> socialLogin(@RequestBody java.util.Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message("이메일이 필요합니다.")
                    .build());
        }
        try {
            User user = authService.socialLogin(email);
            String token = jwtUtil.issue(user.getId(), user.getEmail(),
                    user.getUserType() != null ? user.getUserType().name() : "GUEST");
            return ResponseEntity.ok(AuthResponse.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .username(user.getUsername())
                    .phone(user.getPhone())
                    .birthDate(user.getBirthDate())
                    .userType(user.getUserType())
                    .token(token)
                    .message("로그인에 성공했습니다.")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message(e.getMessage())
                    .build());
        }
    }
}
