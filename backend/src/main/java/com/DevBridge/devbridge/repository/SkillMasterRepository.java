package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.SkillMaster;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SkillMasterRepository extends JpaRepository<SkillMaster, Long> {
    Optional<SkillMaster> findByName(String name);
}
