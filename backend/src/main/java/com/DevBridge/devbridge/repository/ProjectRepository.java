package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.Project;
import com.DevBridge.devbridge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.user")
    List<Project> findAllWithUser();

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.user WHERE p.user.id = :userId ORDER BY p.createdAt DESC")
    List<Project> findAllByUserId(Long userId);

    /** EvaluationService (클라이언트 시점): 내가 소유한 완료 프로젝트 목록 */
    List<Project> findByUserAndStatus(User user, Project.ProjectStatus status);
}
