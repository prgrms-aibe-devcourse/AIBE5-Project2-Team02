package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.PartnerProfile;
import com.DevBridge.devbridge.entity.PartnerProfileStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PartnerProfileStatsRepository extends JpaRepository<PartnerProfileStats, Long> {
    Optional<PartnerProfileStats> findByPartnerProfile(PartnerProfile partnerProfile);

    @Query("SELECT s FROM PartnerProfileStats s WHERE s.partnerProfile IN :profiles")
    List<PartnerProfileStats> findAllByPartnerProfiles(@Param("profiles") List<PartnerProfile> profiles);
}
