package com.DevBridge.devbridge.repository;

import com.DevBridge.devbridge.entity.ClientProfile;
import com.DevBridge.devbridge.entity.ClientReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClientReviewRepository extends JpaRepository<ClientReview, Long> {

    List<ClientReview> findByClientProfile(ClientProfile clientProfile);

    @Query("SELECT cr FROM ClientReview cr WHERE cr.clientProfile IN :clientProfiles")
    List<ClientReview> findAllByClientProfiles(List<ClientProfile> clientProfiles);

    @Query("SELECT cr.clientProfile.id, AVG(cr.rating), COUNT(cr) " +
           "FROM ClientReview cr " +
           "WHERE cr.clientProfile IN :clientProfiles " +
           "GROUP BY cr.clientProfile.id")
    List<Object[]> aggregateByClientProfiles(List<ClientProfile> clientProfiles);
}
