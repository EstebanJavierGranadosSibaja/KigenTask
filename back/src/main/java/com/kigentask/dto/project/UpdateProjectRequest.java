package com.kigentask.dto.project;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProjectRequest(
        @Size(max = 120, message = "name must be up to 120 characters")
        String name,

        @Pattern(
                regexp = "^[A-Za-z][A-Za-z0-9_]{1,19}$",
                message = "projectKey must start with a letter and contain only letters, numbers or underscore"
        )
        String projectKey,

        @Size(max = 3000, message = "description must be up to 3000 characters")
        String description
) {
}