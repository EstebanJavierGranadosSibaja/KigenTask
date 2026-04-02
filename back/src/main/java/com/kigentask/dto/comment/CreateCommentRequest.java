package com.kigentask.dto.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
        @NotBlank(message = "content is required")
        @Size(max = 3000, message = "content must be up to 3000 characters")
        String content
) {
}