package com.DevBridge.devbridge.service;

import com.DevBridge.devbridge.dto.ClientReviewCreateRequest;
import com.DevBridge.devbridge.entity.*;
import com.DevBridge.devbridge.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ClientReviewService {

    private final ClientReviewRepository  clientReviewRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final UserRepository          userRepository;
    private final ProjectRepository       projectRepository;

    @Transactional
    public void create(Long reviewerUserId, ClientReviewCreateRequest req) {
        if (req.getRating() == null || req.getRating() < 0.5 || req.getRating() > 5.0) {
            throw new RuntimeException("rating 은 0.5 ~ 5.0 사이여야 합니다.");
        }
        User reviewer = userRepository.findById(reviewerUserId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        ClientProfile cp = clientProfileRepository.findById(req.getClientProfileId())
                .orElseThrow(() -> new RuntimeException("클라이언트 프로필을 찾을 수 없습니다."));
        if (cp.getUser() != null && cp.getUser().getId().equals(reviewerUserId)) {
            throw new RuntimeException("본인 프로필에는 후기를 남길 수 없습니다.");
        }
        Project project = req.getProjectId() != null
                ? projectRepository.findById(req.getProjectId()).orElse(null)
                : null;

        // Upsert by (clientProfile, reviewer, project) so each project gets its own review
        ClientReview entity = (project != null)
                ? clientReviewRepository
                        .findByClientProfileAndReviewerAndProject(cp, reviewer, project)
                        .orElse(ClientReview.builder()
                                .clientProfile(cp)
                                .reviewer(reviewer)
                                .project(project)
                                .build())
                : ClientReview.builder()
                        .clientProfile(cp)
                        .reviewer(reviewer)
                        .project(project)
                        .build();

        entity.setRating(req.getRating());
        entity.setExpertise(req.getExpertise());
        entity.setSchedule(req.getSchedule());
        entity.setCommunication(req.getCommunication());
        entity.setProactivity(req.getProactivity());
        entity.setContent(req.getContent());
        clientReviewRepository.save(entity);
    }
}
