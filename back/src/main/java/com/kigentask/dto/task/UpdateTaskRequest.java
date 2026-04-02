package com.kigentask.dto.task;

import com.kigentask.model.TaskPriority;
import com.kigentask.model.TaskStatus;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record UpdateTaskRequest(
        @Size(max = 200, message = "title must be up to 200 characters")
        String title,

        @Size(max = 5000, message = "description must be up to 5000 characters")
        String description,

        TaskStatus status,
        TaskPriority priority,
        Long assigneeUserId,
        Boolean clearAssignee,
        @FutureOrPresent(message = "dueDate must be today or a future date")
        LocalDate dueDate
) {
}