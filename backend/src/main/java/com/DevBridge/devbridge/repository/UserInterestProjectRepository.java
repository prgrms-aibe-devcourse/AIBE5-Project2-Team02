package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.User;
import com.DevBridge.devbridge.entity.UserInterestProject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserInterestProjectRepository extends JpaRepository<UserInterestProject, Long> {
    List<UserInterestProject> findByUser(User user);
    Optional<UserInterestProject> findByUserIdAndProjectId(Long userId, Long projectId);
    void deleteByUserIdAndProjectId(Long userId, Long projectId);
    boolean existsByUserIdAndProjectId(Long userId, Long projectId);
}

