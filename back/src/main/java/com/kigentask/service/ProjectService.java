package com.kigentask.service;

import com.kigentask.dto.project.CreateProjectRequest;
import com.kigentask.dto.project.ProjectResponse;
import com.kigentask.dto.project.UpdateProjectRequest;
import com.kigentask.exception.BadRequestException;
import com.kigentask.exception.ConflictException;
import com.kigentask.exception.NotFoundException;
import com.kigentask.model.Project;
import com.kigentask.model.User;
import com.kigentask.repository.ProjectRepository;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final CurrentUserService currentUserService;

    public ProjectService(ProjectRepository projectRepository, CurrentUserService currentUserService) {
        this.projectRepository = projectRepository;
        this.currentUserService = currentUserService;
    }

    public ProjectResponse createProject(CreateProjectRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        String projectName = normalizeRequired(request.name(), "name");
        String projectKey = normalizeProjectKey(request.projectKey());

        if (projectRepository.existsByProjectKey(projectKey)) {
            throw new ConflictException("Project key is already in use");
        }
        if (projectRepository.existsByOwnerIdAndName(currentUser.getId(), projectName)) {
            throw new ConflictException("You already have a project with this name");
        }

        Project project = new Project();
        project.setOwner(currentUser);
        project.setName(projectName);
        project.setProjectKey(projectKey);
        project.setDescription(normalizeOptional(request.description()));

        return toResponse(projectRepository.save(project));
    }

    public List<ProjectResponse> getCurrentUserProjects() {
        Long currentUserId = currentUserService.getCurrentUserId();
        return projectRepository.findByOwnerIdOrderByCreatedAtDesc(currentUserId).stream()
                .map(this::toResponse)
                .toList();
    }

    public ProjectResponse getProjectById(Long projectId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        Project project = projectRepository.findByIdAndOwnerId(projectId, currentUserId)
                .orElseThrow(() -> new NotFoundException("Project not found"));
        return toResponse(project);
    }

    public ProjectResponse updateProject(Long projectId, UpdateProjectRequest request) {
        Long currentUserId = currentUserService.getCurrentUserId();
        Project project = projectRepository.findByIdAndOwnerId(projectId, currentUserId)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        if (hasNoUpdates(request)) {
            throw new BadRequestException("At least one field must be provided to update");
        }

        if (request.name() != null) {
            String normalizedName = normalizeRequired(request.name(), "name");
            if (projectRepository.existsByOwnerIdAndNameAndIdNot(currentUserId, normalizedName, projectId)) {
                throw new ConflictException("You already have a project with this name");
            }
            project.setName(normalizedName);
        }

        if (request.projectKey() != null) {
            String normalizedKey = normalizeProjectKey(request.projectKey());
            if (projectRepository.existsByProjectKeyAndIdNot(normalizedKey, projectId)) {
                throw new ConflictException("Project key is already in use");
            }
            project.setProjectKey(normalizedKey);
        }

        if (request.description() != null) {
            project.setDescription(normalizeOptional(request.description()));
        }

        return toResponse(projectRepository.save(project));
    }

    public void deleteProject(Long projectId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        Project project = projectRepository.findByIdAndOwnerId(projectId, currentUserId)
                .orElseThrow(() -> new NotFoundException("Project not found"));
        projectRepository.delete(project);
    }

    private ProjectResponse toResponse(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getOwner().getId(),
                project.getName(),
                project.getProjectKey(),
                project.getDescription(),
                project.getCreatedAt(),
                project.getUpdatedAt()
        );
    }

    private String normalizeProjectKey(String value) {
        return normalizeRequired(value, "projectKey").toUpperCase(Locale.ROOT);
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException(fieldName + " is required");
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private boolean hasNoUpdates(UpdateProjectRequest request) {
        return request.name() == null
                && request.projectKey() == null
                && request.description() == null;
    }
}