package com.kigentask.dto.project;

import java.time.Instant;

public record ProjectResponse(
        Long id,
        Long ownerUserId,
        String name,
        String projectKey,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
}