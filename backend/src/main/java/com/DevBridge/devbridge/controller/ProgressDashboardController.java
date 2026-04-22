package com.DevBridge.devbridge.controller;

import com.DevBridge.devbridge.dto.*;
import com.DevBridge.devbridge.service.ProgressDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 진행 프로젝트 대시보드 통합 컨트롤러.
 * - /api/projects/{pid}/dashboard            - 전체 한 번에
 * - /api/projects/{pid}/milestones           - 목록/생성 + 제출/승인/재요청
 * - /api/projects/{pid}/escrows              - 목록/생성 + Mock 결제
 * - /api/projects/{pid}/attachments          - 목록/생성/삭제
 * - /api/projects/{pid}/meeting              - 조회/upsert
 */
@RestController
@RequestMapping("/api/projects/{projectId}")
@RequiredArgsConstructor
public class ProgressDashboardController {

    private final ProgressDashboardService service;

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(@PathVariable Long projectId) {
        return guarded(() -> ResponseEntity.ok(service.dashboard(projectId)));
    }

    // ---------- Milestones ----------

    @GetMapping("/milestones")
    public ResponseEntity<?> listMilestones(@PathVariable Long projectId) {
        return guarded(() -> ResponseEntity.ok(service.listMilestones(projectId)));
    }

    @PostMapping("/milestones")
    public ResponseEntity<?> createMilestone(@PathVariable Long projectId,
                                             @RequestBody MilestoneCreateRequest req) {
        return guarded(() -> ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createMilestone(projectId, req)));
    }

    @PostMapping("/milestones/{id}/submit")
    public ResponseEntity<?> submit(@PathVariable Long projectId, @PathVariable Long id,
                                    @RequestBody(required = false) MilestoneSubmitRequest req) {
        return guarded(() -> ResponseEntity.ok(service.submit(projectId, id, req)));
    }

    @PostMapping("/milestones/{id}/approve")
    public ResponseEntity<?> approve(@PathVariable Long projectId, @PathVariable Long id) {
        return guarded(() -> ResponseEntity.ok(service.approve(projectId, id)));
    }

    @PostMapping("/milestones/{id}/request-revision")
    public ResponseEntity<?> requestRevision(@PathVariable Long projectId, @PathVariable Long id,
                                             @RequestBody(required = false) Map<String, String> body) {
        String reason = body == null ? null : body.get("reason");
        return guarded(() -> ResponseEntity.ok(service.requestRevision(projectId, id, reason)));
    }

    @PostMapping("/milestones/{id}/cancel-revision")
    public ResponseEntity<?> cancelRevision(@PathVariable Long projectId, @PathVariable Long id) {
        return guarded(() -> ResponseEntity.ok(service.cancelRevision(projectId, id)));
    }

    // ---------- Escrows ----------

    @GetMapping("/escrows")
    public ResponseEntity<?> listEscrows(@PathVariable Long projectId) {
        return guarded(() -> ResponseEntity.ok(service.listEscrows(projectId)));
    }

    @PostMapping("/escrows")
    public ResponseEntity<?> createEscrow(@PathVariable Long projectId,
                                          @RequestBody Map<String, Object> body) {
        Long milestoneId = body.get("milestoneId") == null ? null : ((Number) body.get("milestoneId")).longValue();
        Long amount = body.get("amount") == null ? null : ((Number) body.get("amount")).longValue();
        Long payeeUserId = body.get("payeeUserId") == null ? null : ((Number) body.get("payeeUserId")).longValue();
        return guarded(() -> ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createEscrow(projectId, milestoneId, amount, payeeUserId)));
    }

    @PostMapping("/escrows/{id}/pay-mock")
    public ResponseEntity<?> payMock(@PathVariable Long projectId, @PathVariable Long id,
                                     @RequestBody EscrowPayMockRequest req) {
        return guarded(() -> ResponseEntity.ok(service.payMock(projectId, id, req)));
    }

    // ---------- Attachments ----------

    @GetMapping("/attachments")
    public ResponseEntity<?> listAttachments(@PathVariable Long projectId) {
        return guarded(() -> ResponseEntity.ok(service.listAttachments(projectId)));
    }

    @PostMapping("/attachments")
    public ResponseEntity<?> createAttachment(@PathVariable Long projectId,
                                              @RequestBody AttachmentCreateRequest req) {
        return guarded(() -> ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createAttachment(projectId, req)));
    }

    @DeleteMapping("/attachments/{id}")
    public ResponseEntity<?> deleteAttachment(@PathVariable Long projectId, @PathVariable Long id) {
        return guarded(() -> {
            service.deleteAttachment(projectId, id);
            return ResponseEntity.noContent().build();
        });
    }

    // ---------- Meeting ----------

    @GetMapping("/meeting")
    public ResponseEntity<?> getMeeting(@PathVariable Long projectId) {
        return guarded(() -> {
            MeetingResponse m = service.getMeeting(projectId);
            return ResponseEntity.ok(m == null ? Map.of() : m);
        });
    }

    @PutMapping("/meeting")
    public ResponseEntity<?> upsertMeeting(@PathVariable Long projectId,
                                           @RequestBody MeetingUpsertRequest req) {
        return guarded(() -> ResponseEntity.ok(service.upsertMeeting(projectId, req)));
    }

    // ---------- Helpers ----------

    private interface GuardedAction { ResponseEntity<?> run(); }

    private static ResponseEntity<?> guarded(GuardedAction action) {
        try {
            return action.run();
        } catch (SecurityException se) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", se.getMessage()));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.badRequest().body(Map.of("message", iae.getMessage()));
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", ise.getMessage()));
        } catch (RuntimeException re) {
            String msg = re.getMessage() == null ? "처리 중 오류가 발생했습니다." : re.getMessage();
            if (msg.contains("인증")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", msg));
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", msg));
        }
    }
}
