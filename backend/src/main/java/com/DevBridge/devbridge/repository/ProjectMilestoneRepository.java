package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.ProjectMilestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectMilestoneRepository extends JpaRepository<ProjectMilestone, Long> {

    List<ProjectMilestone> findByProjectIdOrderBySeqAsc(Long projectId);

    Optional<ProjectMilestone> findByIdAndProjectId(Long id, Long projectId);

    long countByProjectIdAndStatusNot(Long projectId, ProjectMilestone.MilestoneStatus status);
}
