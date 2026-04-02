package com.kigentask.service;

import com.kigentask.dto.task.CreateTaskRequest;
import com.kigentask.dto.task.TaskResponse;
import com.kigentask.dto.task.UpdateTaskRequest;
import com.kigentask.exception.BadRequestException;
import com.kigentask.exception.ForbiddenException;
import com.kigentask.exception.NotFoundException;
import com.kigentask.model.Project;
import com.kigentask.model.Task;
import com.kigentask.model.TaskPriority;
import com.kigentask.model.TaskStatus;
import com.kigentask.model.User;
import com.kigentask.repository.ProjectRepository;
import com.kigentask.repository.TaskRepository;
import com.kigentask.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final TaskAccessEvaluator taskAccessEvaluator;

    public TaskService(
            TaskRepository taskRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository,
            CurrentUserService currentUserService,
            TaskAccessEvaluator taskAccessEvaluator
    ) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.taskAccessEvaluator = taskAccessEvaluator;
    }

    public TaskResponse createTask(CreateTaskRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        Project project = projectRepository.findById(request.projectId())
                .orElseThrow(() -> new NotFoundException("Project not found"));

        if (!taskAccessEvaluator.canCreateTask(project, currentUser.getId())) {
            throw new ForbiddenException("You are not allowed to create tasks in this project");
        }

        Task task = new Task();
        task.setProject(project);
        task.setReporter(currentUser);
        task.setTitle(normalizeRequired(request.title(), "title"));
        task.setDescription(normalizeOptional(request.description()));
        task.setPriority(request.priority() == null ? TaskPriority.MEDIUM : request.priority());
        task.setDueDate(request.dueDate());

        if (request.assigneeUserId() != null) {
            User assignee = userRepository.findById(request.assigneeUserId())
                    .orElseThrow(() -> new NotFoundException("Assignee user not found"));
            task.setAssignee(assignee);
        }

        return toResponse(taskRepository.save(task));
    }

    public TaskResponse updateTask(Long taskId, UpdateTaskRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        if (!taskAccessEvaluator.canEditTask(task, currentUser.getId())) {
            throw new ForbiddenException("You are not allowed to update this task");
        }

        if (hasNoUpdates(request)) {
            throw new BadRequestException("At least one field must be provided to update");
        }

        if (request.title() != null) {
            task.setTitle(normalizeRequired(request.title(), "title"));
        }
        if (request.description() != null) {
            task.setDescription(normalizeOptional(request.description()));
        }
        if (request.status() != null) {
            task.setStatus(request.status());
        }
        if (request.priority() != null) {
            task.setPriority(request.priority());
        }
        if (request.dueDate() != null) {
            task.setDueDate(request.dueDate());
        }

        if (Boolean.TRUE.equals(request.clearAssignee())) {
            task.setAssignee(null);
        } else if (request.assigneeUserId() != null) {
            User assignee = userRepository.findById(request.assigneeUserId())
                    .orElseThrow(() -> new NotFoundException("Assignee user not found"));
            task.setAssignee(assignee);
        }

        return toResponse(taskRepository.save(task));
    }

    public void deleteTask(Long taskId) {
        User currentUser = currentUserService.getCurrentUser();
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));

        if (!taskAccessEvaluator.canDeleteTask(task, currentUser.getId())) {
            throw new ForbiddenException("You are not allowed to delete this task");
        }

        taskRepository.delete(task);
    }

    public List<TaskResponse> getTasks(Long projectId, TaskStatus status, Long assigneeUserId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        List<Task> tasks = taskRepository.searchAccessibleTasks(currentUserId, projectId, assigneeUserId);
        return tasks.stream()
            .filter(task -> status == null || task.getStatus() == status)
                .map(this::toResponse)
                .toList();
    }

    private TaskResponse toResponse(Task task) {
        Long assigneeUserId = task.getAssignee() == null ? null : task.getAssignee().getId();
        return new TaskResponse(
                task.getId(),
                task.getProject().getId(),
                task.getReporter().getId(),
                assigneeUserId,
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                task.getCreatedAt(),
                task.getUpdatedAt()
        );
    }

    private boolean hasNoUpdates(UpdateTaskRequest request) {
        return request.title() == null
                && request.description() == null
                && request.status() == null
                && request.priority() == null
                && request.assigneeUserId() == null
                && request.dueDate() == null
                && !Boolean.TRUE.equals(request.clearAssignee());
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
}