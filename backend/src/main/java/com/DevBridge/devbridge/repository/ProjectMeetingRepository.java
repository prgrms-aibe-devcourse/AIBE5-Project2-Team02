package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.ProjectMeeting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProjectMeetingRepository extends JpaRepository<ProjectMeeting, Long> {

    Optional<ProjectMeeting> findByProjectId(Long projectId);
}
