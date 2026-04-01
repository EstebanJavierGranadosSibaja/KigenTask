package com.kigentask.dto.task;

import com.kigentask.model.TaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateTaskRequest(
        @NotNull(message = "projectId is required")
        Long projectId,

        @NotBlank(message = "title is required")
        @Size(max = 200, message = "title must be up to 200 characters")
        String title,

        @Size(max = 5000, message = "description must be up to 5000 characters")
        String description,

        Long assigneeUserId,
        TaskPriority priority,
        LocalDate dueDate
) {
}