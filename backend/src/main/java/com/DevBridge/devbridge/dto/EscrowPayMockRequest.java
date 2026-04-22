package com.DevBridge.devbridge.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscrowPayMockRequest {
    /** 등록된 PaymentMethod id */
    private Long paymentMethodId;
    /** 강제 실패 시뮬레이션 */
    private Boolean simulateFail;
}
