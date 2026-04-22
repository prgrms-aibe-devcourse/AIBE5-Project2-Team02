package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.ClientProfile;
import com.DevBridge.devbridge.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ClientProfileRepository extends JpaRepository<ClientProfile, Long> {
    Optional<ClientProfile> findByUser(User user);

    @Query("SELECT c FROM ClientProfile c LEFT JOIN FETCH c.user")
    List<ClientProfile> findAllWithUser();
}
