package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.User;
import com.DevBridge.devbridge.entity.UserInterestPartner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserInterestPartnerRepository extends JpaRepository<UserInterestPartner, Long> {
    List<UserInterestPartner> findByUser(User user);
    Optional<UserInterestPartner> findByUserIdAndPartnerProfileId(Long userId, Long partnerProfileId);
    void deleteByUserIdAndPartnerProfileId(Long userId, Long partnerProfileId);
    boolean existsByUserIdAndPartnerProfileId(Long userId, Long partnerProfileId);
}
