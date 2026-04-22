package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.User;
import com.DevBridge.devbridge.entity.UserSkillDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserSkillDetailRepository extends JpaRepository<UserSkillDetail, Long> {
    List<UserSkillDetail> findByUserOrderBySortOrderAscIdAsc(User user);
    void deleteByUser(User user);
}
