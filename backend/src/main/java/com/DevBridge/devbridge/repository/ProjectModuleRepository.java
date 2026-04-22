package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.ProjectModule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectModuleRepository extends JpaRepository<ProjectModule, Long> {
    List<ProjectModule> findByProjectId(Long projectId);
    Optional<ProjectModule> findByProjectIdAndModuleKey(Long projectId, String moduleKey);
    long countByProjectId(Long projectId);
}
