package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.ClientPreferredSkill;
import com.DevBridge.devbridge.entity.ClientProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClientPreferredSkillRepository extends JpaRepository<ClientPreferredSkill, Long> {
    List<ClientPreferredSkill> findByClientProfile(ClientProfile clientProfile);

    @Query("SELECT ps FROM ClientPreferredSkill ps JOIN FETCH ps.skill WHERE ps.clientProfile IN :profiles")
    List<ClientPreferredSkill> findAllByClientProfiles(@Param("profiles") List<ClientProfile> profiles);
}
