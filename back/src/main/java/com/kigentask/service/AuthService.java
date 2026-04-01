package com.kigentask.service;

import com.kigentask.config.GoogleOAuthProperties;
import com.kigentask.dto.auth.AuthResponse;
import com.kigentask.dto.auth.AuthUserResponse;
import com.kigentask.dto.auth.GoogleLoginRequest;
import com.kigentask.dto.auth.GoogleTokenInfoResponse;
import com.kigentask.dto.auth.LoginRequest;
import com.kigentask.dto.auth.RegisterRequest;
import com.kigentask.exception.BadRequestException;
import com.kigentask.exception.ConflictException;
import com.kigentask.exception.NotFoundException;
import com.kigentask.exception.UnauthorizedException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;
import java.util.regex.Pattern;
import com.kigentask.model.Role;
import com.kigentask.model.User;
import com.kigentask.repository.RoleRepository;
import com.kigentask.repository.UserRepository;
import com.kigentask.security.JwtService;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

@Service
public class AuthService {

    private static final String DEFAULT_ROLE_NAME = "ROLE_USER";
    private static final int MIN_USERNAME_LENGTH = 3;
    private static final int MAX_USERNAME_LENGTH = 50;
    private static final Pattern USERNAME_SANITIZER = Pattern.compile("[^a-z0-9_]");

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final GoogleOAuthProperties googleOAuthProperties;
    private final RestClient restClient;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            GoogleOAuthProperties googleOAuthProperties,
            RestClient.Builder restClientBuilder
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.googleOAuthProperties = googleOAuthProperties;
        this.restClient = restClientBuilder.build();
    }

    public AuthResponse register(RegisterRequest request) {
        String username = normalizeRequired(request.username(), "username");
        String email = normalizeRequired(request.email(), "email");

        if (userRepository.existsByUsername(username)) {
            throw new ConflictException("Username is already in use");
        }
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Email is already in use");
        }

        Role defaultRole = roleRepository.findByName(DEFAULT_ROLE_NAME)
                .orElseThrow(() -> new NotFoundException("Default role ROLE_USER not found"));

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(normalizeRequired(request.password(), "password")));
        user.setFullName(normalizeOptional(request.fullName()));
        user.setActive(true);
        user.getRoles().add(defaultRole);

        User saved = userRepository.save(user);
        return buildAuthResponse(saved);
    }

    public AuthResponse login(LoginRequest request) {
        String usernameOrEmail = normalizeRequired(request.usernameOrEmail(), "usernameOrEmail");
        String password = normalizeRequired(request.password(), "password");

        User user = userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), password)
            );
        } catch (BadCredentialsException ex) {
            throw new UnauthorizedException("Invalid credentials");
        } catch (AuthenticationException ex) {
            throw new UnauthorizedException("Invalid credentials");
        }

        return buildAuthResponse(user);
    }

    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        String idToken = normalizeRequired(request.idToken(), "idToken");
        if (!googleOAuthProperties.isConfigured()) {
            throw new BadRequestException("Google sign-in is not configured on server");
        }

        GoogleTokenInfoResponse tokenInfo = fetchGoogleTokenInfo(idToken);
        validateGoogleToken(tokenInfo);

        User user = userRepository.findByEmail(tokenInfo.email().trim())
                .orElseGet(() -> createGoogleUser(tokenInfo));

        if (Boolean.FALSE.equals(user.getActive())) {
            throw new UnauthorizedException("User account is inactive");
        }

        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user);
        return new AuthResponse(
                token,
                "Bearer",
                jwtService.extractExpiration(token),
                new AuthUserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getFullName()
                )
        );
    }

    private GoogleTokenInfoResponse fetchGoogleTokenInfo(String idToken) {
        String requestUrl = googleOAuthProperties.getTokenInfoUrl()
                + "?id_token=" + URLEncoder.encode(idToken, StandardCharsets.UTF_8);

        try {
            GoogleTokenInfoResponse tokenInfo = restClient.get()
                    .uri(requestUrl)
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(GoogleTokenInfoResponse.class);

            if (tokenInfo == null) {
                throw new UnauthorizedException("Invalid Google token");
            }
            return tokenInfo;
        } catch (RestClientResponseException ex) {
            throw new UnauthorizedException("Invalid Google token");
        } catch (RestClientException ex) {
            throw new BadRequestException("Could not validate Google token");
        }
    }

    private void validateGoogleToken(GoogleTokenInfoResponse tokenInfo) {
        if (tokenInfo.email() == null || tokenInfo.email().isBlank()) {
            throw new UnauthorizedException("Google account email is required");
        }
        if (!googleOAuthProperties.getClientId().equals(tokenInfo.aud())) {
            throw new UnauthorizedException("Google token audience mismatch");
        }
        if (!"true".equalsIgnoreCase(tokenInfo.emailVerified())) {
            throw new UnauthorizedException("Google account email is not verified");
        }
    }

    private User createGoogleUser(GoogleTokenInfoResponse tokenInfo) {
        Role defaultRole = roleRepository.findByName(DEFAULT_ROLE_NAME)
                .orElseThrow(() -> new NotFoundException("Default role ROLE_USER not found"));

        String email = tokenInfo.email().trim();

        User user = new User();
        user.setEmail(email);
        user.setUsername(generateUniqueUsername(email));
        user.setPasswordHash(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setFullName(normalizeOptional(tokenInfo.name()));
        user.setActive(true);
        user.getRoles().add(defaultRole);

        return userRepository.save(user);
    }

    private String generateUniqueUsername(String email) {
        String[] parts = email.toLowerCase(Locale.ROOT).split("@", 2);
        String localPart = parts.length > 0 ? parts[0] : email;

        String baseUsername = USERNAME_SANITIZER.matcher(localPart).replaceAll("");
        if (baseUsername.length() < MIN_USERNAME_LENGTH) {
            baseUsername = "user";
        }
        if (baseUsername.length() > MAX_USERNAME_LENGTH) {
            baseUsername = baseUsername.substring(0, MAX_USERNAME_LENGTH);
        }

        String candidate = baseUsername;
        int suffix = 1;

        while (userRepository.existsByUsername(candidate)) {
            String suffixText = Integer.toString(suffix++);
            int maxBaseLength = Math.max(1, MAX_USERNAME_LENGTH - suffixText.length());
            String truncatedBase = baseUsername.length() > maxBaseLength
                    ? baseUsername.substring(0, maxBaseLength)
                    : baseUsername;
            candidate = truncatedBase + suffixText;
        }

        return candidate;
    }

    private String normalizeRequired(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new BadRequestException(fieldName + " is required");
        }
        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}