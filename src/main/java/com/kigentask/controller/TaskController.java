package com.kigentask.controller;

import com.kigentask.dto.task.CreateTaskRequest;
import com.kigentask.dto.task.TaskResponse;
import com.kigentask.dto.task.UpdateTaskRequest;
import com.kigentask.model.TaskStatus;
import com.kigentask.service.TaskService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(@Valid @RequestBody CreateTaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.createTask(request));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable Long taskId,
            @Valid @RequestBody UpdateTaskRequest request
    ) {
        return ResponseEntity.ok(taskService.updateTask(taskId, request));
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long taskId) {
        taskService.deleteTask(taskId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<List<TaskResponse>> getTasks(
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) Long assigneeUserId
    ) {
        return ResponseEntity.ok(taskService.getTasks(projectId, status, assigneeUserId));
    }
}