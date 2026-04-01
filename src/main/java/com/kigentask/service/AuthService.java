package com.kigentask.service;

import com.kigentask.dto.auth.AuthResponse;
import com.kigentask.dto.auth.AuthUserResponse;
import com.kigentask.dto.auth.LoginRequest;
import com.kigentask.dto.auth.RegisterRequest;
import com.kigentask.exception.BadRequestException;
import com.kigentask.exception.ConflictException;
import com.kigentask.exception.NotFoundException;
import com.kigentask.exception.UnauthorizedException;
import com.kigentask.model.Role;
import com.kigentask.model.User;
import com.kigentask.repository.RoleRepository;
import com.kigentask.repository.UserRepository;
import com.kigentask.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final String DEFAULT_ROLE_NAME = "ROLE_USER";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
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