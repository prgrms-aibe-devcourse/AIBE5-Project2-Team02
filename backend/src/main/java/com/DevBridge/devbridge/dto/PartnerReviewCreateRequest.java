package com.DevBridge.devbridge.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PartnerReviewCreateRequest {
    private Long partnerProfileId;
    private Long projectId; // optional
    private Double rating;
    private String content;
}
