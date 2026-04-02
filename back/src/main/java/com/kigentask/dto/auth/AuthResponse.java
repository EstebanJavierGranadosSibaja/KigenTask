package com.kigentask.dto.auth;

import java.time.Instant;

public record AuthResponse(
        String token,
        String tokenType,
        Instant expiresAt,
        AuthUserResponse user
) {
}