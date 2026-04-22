package com.DevBridge.devbridge.service;

import com.DevBridge.devbridge.dto.PartnerSummaryResponse;
import com.DevBridge.devbridge.entity.*;
import com.DevBridge.devbridge.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PartnerService {

    private final PartnerProfileRepository partnerProfileRepository;
    private final PartnerSkillRepository partnerSkillRepository;
    private final PartnerProfileStatsRepository partnerProfileStatsRepository;
    private final PartnerReviewRepository partnerReviewRepository;
    private final UserProfileDetailRepository userProfileDetailRepository;

    @Transactional(readOnly = true)
    public List<PartnerSummaryResponse> findAll() {
        List<PartnerProfile> all = partnerProfileRepository.findAllWithUser();
        if (all.isEmpty()) return Collections.emptyList();

        Map<Long, List<String>> skillsByProfile = partnerSkillRepository
                .findAllByPartnerProfiles(all).stream()
                .collect(Collectors.groupingBy(
                        ps -> ps.getPartnerProfile().getId(),
                        Collectors.mapping(ps -> ps.getSkill().getName(), Collectors.toList())));

        Map<Long, PartnerProfileStats> statsByProfile = partnerProfileStatsRepository
                .findAllByPartnerProfiles(all).stream()
                .collect(Collectors.toMap(s -> s.getPartnerProfile().getId(), s -> s));

        Map<Long, double[]> reviewAggByProfile = new HashMap<>();
        for (Object[] row : partnerReviewRepository.aggregateByPartnerProfiles(all)) {
            Long pid = (Long) row[0];
            Double avg = row[1] != null ? ((Number) row[1]).doubleValue() : null;
            Long cnt = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            reviewAggByProfile.put(pid, new double[]{avg != null ? avg : 0.0, cnt});
        }

        // UserProfileDetail.shortBio (프로필 편집기에서 입력한 한줄 자기소개) 우선 사용
        List<Long> userIds = all.stream()
                .map(p -> p.getUser() != null ? p.getUser().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
        Map<Long, String> shortBioByUserId = userIds.isEmpty()
                ? Collections.emptyMap()
                : userProfileDetailRepository.findAllByUserIdIn(userIds).stream()
                        .filter(d -> d.getUser() != null && d.getShortBio() != null && !d.getShortBio().isBlank())
                        .collect(Collectors.toMap(d -> d.getUser().getId(), UserProfileDetail::getShortBio, (a, b) -> a));

        return all.stream()
                .map(pp -> toSummary(pp,
                        skillsByProfile.getOrDefault(pp.getId(), Collections.emptyList()),
                        statsByProfile.get(pp.getId()),
                        reviewAggByProfile.get(pp.getId()),
                        pp.getUser() != null ? shortBioByUserId.get(pp.getUser().getId()) : null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PartnerSummaryResponse findById(Long id) {
        PartnerProfile pp = partnerProfileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("파트너를 찾을 수 없습니다. id=" + id));
        List<String> skillNames = partnerSkillRepository.findByPartnerProfile(pp).stream()
                .map(s -> s.getSkill().getName())
                .collect(Collectors.toList());
        PartnerProfileStats stats = partnerProfileStatsRepository.findByPartnerProfile(pp).orElse(null);
        List<Object[]> agg = partnerReviewRepository.aggregateByPartnerProfiles(List.of(pp));
        double[] reviewAgg = null;
        if (!agg.isEmpty()) {
            Object[] row = agg.get(0);
            Double avg = row[1] != null ? ((Number) row[1]).doubleValue() : null;
            Long cnt = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            reviewAgg = new double[]{avg != null ? avg : 0.0, cnt};
        }
        return toSummary(pp, skillNames, stats, reviewAgg, detailShortBio(pp));
    }

    private String detailShortBio(PartnerProfile pp) {
        if (pp.getUser() == null) return null;
        return userProfileDetailRepository.findByUserId(pp.getUser().getId())
                .map(UserProfileDetail::getShortBio)
                .filter(s -> s != null && !s.isBlank())
                .orElse(null);
    }

    // ----------------------------------------------------
    // 매핑 로직
    // ----------------------------------------------------
    private PartnerSummaryResponse toSummary(PartnerProfile pp, List<String> skillNames,
                                             PartnerProfileStats stats, double[] reviewAgg, String detailShortBio) {
        User user = pp.getUser();
        Double reviewAvg = reviewAgg != null ? reviewAgg[0] : null;
        Integer reviewCnt = reviewAgg != null ? (int) reviewAgg[1] : 0;
        Double effectiveRating = reviewAvg != null && reviewAgg[1] > 0
                ? reviewAvg
                : (stats != null ? stats.getRating() : 0.0);

        // 표시명은 항상 username 으로 통일 (회원가입 시 이름 입력 없음)
        String username = user != null ? user.getUsername() : null;

        // Hero 이미지 경로 생성
        String heroPath = pp.getHeroKey() != null && !pp.getHeroKey().isBlank()
                ? "/hero/" + pp.getHeroKey()
                : "/hero/hero_default.png";

        return PartnerSummaryResponse.builder()
                .id(pp.getId())
                .username(username)
                .name(username)
                .title(pp.getTitle())
                .avatarColor(pp.getAvatarColor())
                .heroKey(pp.getHeroKey() != null ? pp.getHeroKey() : "default")
                .heroImg(heroPath)
                .profileImageUrl(user != null ? user.getProfileImageUrl() : null)
                .slogan(pp.getSlogan())
                .sloganSub(pp.getSloganSub())
                .shortBio(detailShortBio != null ? detailShortBio : pp.getShortBio())
                .desc(pp.getBio())
                .tags(skillNames.stream().limit(5).collect(Collectors.toList()))
                .serviceField(pp.getServiceField())
                .partnerType(partnerTypeLabel(pp.getPartnerType()))
                .workPref(workPrefLabel(pp.getWorkPreference()))
                .remote(pp.getWorkPreference() == PartnerProfile.WorkPreference.REMOTE
                        || pp.getWorkPreference() == PartnerProfile.WorkPreference.HYBRID)
                .level(devLevelLabel(pp.getDevLevel()))
                .grade(pp.getGrade() != null ? pp.getGrade().name().toLowerCase() : "silver")
                .match(computeMatchScore(pp))
                .price(pp.getSalaryMonth() != null ? pp.getSalaryMonth() / 10000 + "만원/월" : "협의")
                .period("협의")
                .email(user != null ? (user.getContactEmail() != null ? user.getContactEmail() : user.getEmail()) : null)
                .phone(user != null ? user.getPhone() : null)
                .experience(stats != null ? stats.getExperienceYears() : null)
                .completedProjects(stats != null ? stats.getCompletedProjects() : 0)
                .rating(effectiveRating)
                .reviewCount(reviewCnt)
                .skillSet(skillNames)
                .skillCategories(Collections.emptyList())
                .levelCode(devLevelCode(pp.getDevLevel()))
                .hourlyRate(pp.getSalaryHour())
                .monthlyRate(pp.getSalaryMonth() != null ? pp.getSalaryMonth() / 10000 : null)
                .responseRate(stats != null ? stats.getResponseRate() : 0)
                .repeatRate(stats != null ? stats.getRepeatRate() : 0)
                .availabilityDays(stats != null ? stats.getAvailabilityDays() : 0)
                .workPrefCode(workPrefCode(pp.getWorkPreference()))
                .build();
    }

    // ----- enum -> 한글 라벨 매핑 -----
    private static String partnerTypeLabel(PartnerProfile.PartnerType t) {
        if (t == null) return "개인";
        return switch (t) {
            case INDIVIDUAL -> "개인";
            case TEAM -> "팀";
            case SOLE_PROPRIETOR, CORPORATION -> "기업";
        };
    }

    private static String workPrefLabel(PartnerProfile.WorkPreference w) {
        if (w == null) return "재택 선호";
        return switch (w) {
            case REMOTE -> "재택 선호";
            case ONSITE -> "상주 선호";
            case HYBRID -> "하이브리드";
        };
    }

    private static String devLevelLabel(PartnerProfile.DevLevel l) {
        if (l == null) return "주니어";
        return switch (l) {
            case JUNIOR -> "주니어";
            case MIDDLE -> "미들";
            case SENIOR_5_7Y, SENIOR_7_10Y -> "시니어";
            case LEAD -> "리드";
        };
    }

    private static Integer devLevelCode(PartnerProfile.DevLevel l) {
        if (l == null) return 0;
        return switch (l) {
            case JUNIOR -> 0;
            case MIDDLE -> 1;
            case SENIOR_5_7Y, SENIOR_7_10Y -> 2;
            case LEAD -> 3;
        };
    }

    private static Integer workPrefCode(PartnerProfile.WorkPreference w) {
        if (w == null) return 0;
        return switch (w) {
            case REMOTE -> 0;
            case ONSITE -> 1;
            case HYBRID -> 2;
        };
    }

    /** 임시 매칭 점수: id 기반 60~99 사이 결정적 값. 추후 추천 로직으로 대체. */
    private static Integer computeMatchScore(PartnerProfile pp) {
        if (pp == null || pp.getId() == null) return 70;
        return 60 + (int) ((pp.getId() * 7 + 13) % 40);
    }
}

