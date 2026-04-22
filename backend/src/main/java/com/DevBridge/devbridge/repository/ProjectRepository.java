package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.user")
    List<Project> findAllWithUser();

    @Query("SELECT p FROM Project p LEFT JOIN FETCH p.user WHERE p.user.id = :userId ORDER BY p.createdAt DESC")
    List<Project> findAllByUserId(Long userId);
}
