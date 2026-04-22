package com.DevBridge.devbridge.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProjectApplicationResponse {
    private Long id;
    private Long projectId;
    private String projectTitle;
    private String projectDesc;
    private String projectStatus; // Project.status (RECRUITING/IN_PROGRESS/...)
    private Long projectOwnerUserId;
    private String projectOwnerUsername;

    private Long partnerUserId;
    private String partnerUsername;  // 파트너 표시명 (users.username)
    private Long partnerProfileId;  // PartnerProfile.id (있다면)

    private String status;          // ProjectApplication.Status
    private String message;
    private LocalDateTime appliedAt;
    private LocalDateTime updatedAt;
}
