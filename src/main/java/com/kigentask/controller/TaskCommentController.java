package com.kigentask.controller;

import com.kigentask.dto.comment.CommentResponse;
import com.kigentask.dto.comment.CreateCommentRequest;
import com.kigentask.service.TaskCommentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tasks/{taskId}/comments")
public class TaskCommentController {

    private final TaskCommentService taskCommentService;

    public TaskCommentController(TaskCommentService taskCommentService) {
        this.taskCommentService = taskCommentService;
    }

    @PostMapping
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable Long taskId,
            @Valid @RequestBody CreateCommentRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskCommentService.addComment(taskId, request));
    }

    @GetMapping
    public ResponseEntity<List<CommentResponse>> getCommentsByTask(@PathVariable Long taskId) {
        return ResponseEntity.ok(taskCommentService.getCommentsByTask(taskId));
    }
}