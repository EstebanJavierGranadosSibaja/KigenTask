package com.kigentask.dto.task;

import com.kigentask.model.TaskPriority;
import com.kigentask.model.TaskStatus;
import java.time.Instant;
import java.time.LocalDate;

public record TaskResponse(
        Long id,
        Long projectId,
        Long reporterUserId,
        Long assigneeUserId,
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        LocalDate dueDate,
        Instant createdAt,
        Instant updatedAt
) {
}