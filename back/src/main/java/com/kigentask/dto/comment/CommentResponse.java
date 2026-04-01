package com.kigentask.dto.comment;

import java.time.Instant;

public record CommentResponse(
        Long id,
        Long taskId,
        Long authorUserId,
        String content,
        Instant createdAt,
        Instant updatedAt
) {
}