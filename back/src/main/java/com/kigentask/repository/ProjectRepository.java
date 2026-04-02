package com.kigentask.repository;

import com.kigentask.model.Project;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {

    List<Project> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    Optional<Project> findByIdAndOwnerId(Long id, Long ownerId);

    boolean existsByProjectKey(String projectKey);

    boolean existsByOwnerIdAndName(Long ownerId, String name);

    boolean existsByProjectKeyAndIdNot(String projectKey, Long id);

    boolean existsByOwnerIdAndNameAndIdNot(Long ownerId, String name, Long id);
}