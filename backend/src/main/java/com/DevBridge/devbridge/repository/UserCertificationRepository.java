package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.User;
import com.DevBridge.devbridge.entity.UserCertification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserCertificationRepository extends JpaRepository<UserCertification, Long> {
    List<UserCertification> findByUserOrderBySortOrderAscIdAsc(User user);
    void deleteByUser(User user);
}
