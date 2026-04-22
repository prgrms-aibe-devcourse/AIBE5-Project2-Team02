package com.DevBridge.devbridge.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MilestoneSubmitRequest {
    private String note;
    private String fileUrl;
}
