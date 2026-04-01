package com.kigentask.service;

import com.kigentask.dto.comment.CommentResponse;
import com.kigentask.dto.comment.CreateCommentRequest;
import com.kigentask.exception.BadRequestException;
import com.kigentask.exception.ForbiddenException;
import com.kigentask.exception.NotFoundException;
import com.kigentask.model.Task;
import com.kigentask.model.TaskComment;
import com.kigentask.model.User;
import com.kigentask.repository.TaskCommentRepository;
import com.kigentask.repository.TaskRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class TaskCommentService {

    private final TaskCommentRepository taskCommentRepository;
    private final TaskRepository taskRepository;
    private final CurrentUserService currentUserService;
    private final TaskAccessEvaluator taskAccessEvaluator;

    public TaskCommentService(
            TaskCommentRepository taskCommentRepository,
            TaskRepository taskRepository,
            CurrentUserService currentUserService,
            TaskAccessEvaluator taskAccessEvaluator
    ) {
        this.taskCommentRepository = taskCommentRepository;
        this.taskRepository = taskRepository;
        this.currentUserService = currentUserService;
        this.taskAccessEvaluator = taskAccessEvaluator;
    }

    public CommentResponse addComment(Long taskId, CreateCommentRequest request) {
        User currentUser = currentUserService.getCurrentUser();
        Task task = findTaskById(taskId);

        if (!taskAccessEvaluator.canAccessTask(task, currentUser.getId())) {
            throw new ForbiddenException("You are not allowed to comment on this task");
        }

        TaskComment comment = new TaskComment();
        comment.setTask(task);
        comment.setAuthor(currentUser);
        comment.setContent(normalizeRequired(request.content(), "content"));

        return toResponse(taskCommentRepository.save(comment));
    }

    public List<CommentResponse> getCommentsByTask(Long taskId) {
        Long currentUserId = currentUserService.getCurrentUserId();
        Task task = findTaskById(taskId);

        if (!taskAccessEvaluator.canAccessTask(task, currentUserId)) {
            throw new ForbiddenException("You are not allowed to view comments for this task");
        }

        return taskCommentRepository.findByTaskIdOrderByCreatedAtAsc(taskId).stream()
                .map(this::toResponse)
                .toList();
    }

    private Task findTaskById(Long taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new NotFoundException("Task not found"));
    }

    private CommentResponse toResponse(TaskComment comment) {
        return new CommentResponse(
                comment.getId(),
                comment.getTask().getId(),
                comment.getAuthor().getId(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException(fieldName + " is required");
        }
        return value.trim();
    }
}