package com.kigentask.dto.auth;

public record AuthUserResponse(
        Long id,
        String username,
        String email,
        String fullName
) {
}