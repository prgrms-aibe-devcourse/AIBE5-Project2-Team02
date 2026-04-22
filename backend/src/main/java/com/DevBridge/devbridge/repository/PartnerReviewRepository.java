package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.PartnerProfile;
import com.DevBridge.devbridge.entity.PartnerReview;
import com.DevBridge.devbridge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PartnerReviewRepository extends JpaRepository<PartnerReview, Long> {

    List<PartnerReview> findByPartnerProfileOrderByCreatedAtDesc(PartnerProfile partnerProfile);

    Optional<PartnerReview> findByPartnerProfileAndReviewer(PartnerProfile partnerProfile, User reviewer);

    /** [partnerProfileId, avgRating, count] 묶음을 한 번에 가져오기 위한 통계 쿼리. */
    @Query("SELECT r.partnerProfile.id AS profileId, AVG(r.rating) AS avg, COUNT(r) AS cnt " +
           "FROM PartnerReview r " +
           "WHERE r.partnerProfile IN :profiles " +
           "GROUP BY r.partnerProfile.id")
    List<Object[]> aggregateByPartnerProfiles(@Param("profiles") List<PartnerProfile> profiles);
}
