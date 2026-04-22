package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.ProjectEscrow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectEscrowRepository extends JpaRepository<ProjectEscrow, Long> {

    List<ProjectEscrow> findByProjectIdOrderByIdAsc(Long projectId);

    Optional<ProjectEscrow> findByMilestoneId(Long milestoneId);
}
