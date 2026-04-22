package com.DevBridge.devbridge.dto;

import com.DevBridge.devbridge.entity.User;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SignupRequest {
    // 1. 기본 유저 정보 (Signup.jsx)
    private String email;
    private String phone;
    private String username;
    private String password;
    private User.UserType userType;
    private String interests;
    private LocalDate birthDate;

    // 2. 클라이언트용 추가 정보 (ClientRegister.jsx)
    private String clientType; 
    private String slogan;

    // 3. 파트너용 추가 정보 (PartnerRegister.jsx)
    private String workCategory;
    private String jobRoles; // JSON String (e.g. ["프론트엔드", "백엔드"])
    private String partnerType;
    private String preferredProjectType;
    private String workAvailableHours; // JSON String (e.g. ["오전", "오후"])
    private String communicationChannels; // JSON String (e.g. ["카카오톡", "슬랙"])
    private String devLevel;
    private String devExperience;
    private String workPreference;
    private Integer salaryHour;
    private Integer salaryMonth;
    private String githubUrl;
    private String blogUrl;
    private String youtubeUrl;
    private String hashtags; // JSON String
    private String bio; // 자기소개
    
    // 기술 스택 (N:M 매핑용)
    private List<String> skills;
}
