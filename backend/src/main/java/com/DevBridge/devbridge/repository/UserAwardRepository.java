package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.User;
import com.DevBridge.devbridge.entity.UserAward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAwardRepository extends JpaRepository<UserAward, Long> {
    List<UserAward> findByUserOrderBySortOrderAscIdAsc(User user);
    void deleteByUser(User user);
}
