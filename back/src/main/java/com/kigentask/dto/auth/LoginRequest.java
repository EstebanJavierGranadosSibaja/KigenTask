package com.kigentask.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "usernameOrEmail is required")
        @Size(max = 120, message = "usernameOrEmail must be up to 120 characters")
        String usernameOrEmail,

        @NotBlank(message = "password is required")
        @Size(max = 100, message = "password must be up to 100 characters")
        String password
) {
}