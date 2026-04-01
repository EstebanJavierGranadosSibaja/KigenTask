package com.kigentask.dto.user;

import java.time.Instant;

public record UserProfileResponse(
        Long id,
        String username,
        String email,
        String fullName,
        Boolean active,
        Instant createdAt,
        Instant updatedAt
) {
}