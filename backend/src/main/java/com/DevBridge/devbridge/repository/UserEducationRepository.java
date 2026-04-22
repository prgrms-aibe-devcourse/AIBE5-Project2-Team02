package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.User;
import com.DevBridge.devbridge.entity.UserEducation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserEducationRepository extends JpaRepository<UserEducation, Long> {
    List<UserEducation> findByUserOrderBySortOrderAscIdAsc(User user);
    void deleteByUser(User user);
}
