package com.DevBridge.devbridge.controller;

import com.DevBridge.devbridge.dto.PartnerSummaryResponse;
import com.DevBridge.devbridge.service.PartnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/partners")
@RequiredArgsConstructor
public class PartnerController {

    private final PartnerService partnerService;

    /**
     * 파트너 전체 목록.
     * - PartnerSearch.jsx에서 클라이언트 필터링/검색 수행.
     * - 추후 서버 페이지네이션/필터 도입 가능.
     */
    @GetMapping
    public List<PartnerSummaryResponse> list() {
        return partnerService.findAll();
    }

    /** 파트너 상세 (id = partner_profile.id) */
    @GetMapping("/{id}")
    public ResponseEntity<PartnerSummaryResponse> detail(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(partnerService.findById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

