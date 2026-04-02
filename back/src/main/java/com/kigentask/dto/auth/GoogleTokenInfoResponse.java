package com.kigentask.dto.auth;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GoogleTokenInfoResponse(
        String aud,
        String email,
        @JsonProperty("email_verified")
        String emailVerified,
        String name,
        String sub
) {
}
