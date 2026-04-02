package com.kigentask.config;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.google")
public class GoogleOAuthProperties {

    private String clientId;

    @NotBlank
    private String tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo";

    public String getClientId() {
        return clientId;
    }

    public void setClientId(String clientId) {
        this.clientId = clientId == null ? null : clientId.trim();
    }

    public String getTokenInfoUrl() {
        return tokenInfoUrl;
    }

    public void setTokenInfoUrl(String tokenInfoUrl) {
        this.tokenInfoUrl = tokenInfoUrl;
    }

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank();
    }
}
