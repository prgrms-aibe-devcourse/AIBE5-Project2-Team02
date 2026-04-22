package com.DevBridge.devbridge.controller;

import com.DevBridge.devbridge.dto.UpdateUserBasicInfoRequest;
import com.DevBridge.devbridge.dto.UserProfileDetailRequest;
import com.DevBridge.devbridge.dto.UserProfileDetailResponse;
import com.DevBridge.devbridge.security.AuthContext;
import com.DevBridge.devbridge.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 사용자 프로필 세부 정보 (UserProfileDetail + Skills/Careers/Educations/Awards/Certifications) 통합 컨트롤러.
 * - PartnerProfile.jsx, Client_Profile.jsx 의 "전체 설정 저장하기" 에서 호출.
 */
@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    /** 현재 로그인 사용자의 프로필 세부 정보 조회. */
    @GetMapping("/me/detail")
    public ResponseEntity<?> myDetail() {
        Long userId = AuthContext.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "로그인이 필요합니다."));
        }
        try {
            UserProfileDetailResponse res = profileService.getDetail(userId);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** 다른 사용자의 프로필 세부 정보 조회 (username 기준, public). 카드 → 상세보기 진입 시 사용. */
    @GetMapping("/{username}/detail")
    public ResponseEntity<?> publicDetail(@PathVariable String username) {
        try {
            UserProfileDetailResponse res = profileService.getDetailByUsername(username);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** 현재 로그인 사용자의 프로필 세부 정보 일괄 저장 (upsert). */
    @PutMapping("/me/detail")
    public ResponseEntity<?> saveMyDetail(@RequestBody UserProfileDetailRequest req) {
        Long userId = AuthContext.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "로그인이 필요합니다."));
        }
        try {
            UserProfileDetailResponse res = profileService.saveDetail(userId, req);
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    /** 마이페이지에서 사용자 기본 정보 업데이트 (phone, birthDate, region, serviceField/industry 등). */
    @PutMapping("/me/basic")
    public ResponseEntity<?> updateMyBasicInfo(@RequestBody UpdateUserBasicInfoRequest req) {
        Long userId = AuthContext.currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "로그인이 필요합니다."));
        }
        try {
            Map<String, Object> response = profileService.updateBasicInfo(userId, req);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
