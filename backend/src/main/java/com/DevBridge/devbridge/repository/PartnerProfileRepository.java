package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.PartnerProfile;
import com.DevBridge.devbridge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PartnerProfileRepository extends JpaRepository<PartnerProfile, Long> {
    Optional<PartnerProfile> findByUser(User user);

    @Query("SELECT p FROM PartnerProfile p LEFT JOIN FETCH p.user")
    List<PartnerProfile> findAllWithUser();
}
