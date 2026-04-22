package com.DevBridge.devbridge.controller;

import com.DevBridge.devbridge.dto.MatchRequest;
import com.DevBridge.devbridge.dto.MatchScore;
import com.DevBridge.devbridge.service.MatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AI 매칭 점수 컨트롤러.
 *
 * - POST /api/match/partners : 자연어 + 후보 id → [{id, matchScore, reasons[]}]
 * - (TODO) /clients, /projects 도 같은 패턴으로 추가
 */
@RestController
@RequestMapping("/api/match")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MatchController {

    private final MatchService matchService;

    @PostMapping("/partners")
    public ResponseEntity<List<MatchScore>> matchPartners(@RequestBody MatchRequest req) {
        return ResponseEntity.ok(matchService.scorePartners(req.getQuery(), req.getCandidateIds()));
    }

    @PostMapping("/clients")
    public ResponseEntity<List<MatchScore>> matchClients(@RequestBody MatchRequest req) {
        return ResponseEntity.ok(matchService.scoreClients(req.getQuery(), req.getCandidateIds()));
    }

    @PostMapping("/projects")
    public ResponseEntity<List<MatchScore>> matchProjects(@RequestBody MatchRequest req) {
        return ResponseEntity.ok(matchService.scoreProjects(req.getQuery(), req.getCandidateIds()));
    }
}
