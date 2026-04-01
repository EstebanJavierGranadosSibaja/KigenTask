package com.kigentask.service;

import com.kigentask.exception.NotFoundException;
import com.kigentask.exception.UnauthorizedException;
import com.kigentask.model.User;
import com.kigentask.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new UnauthorizedException("Authentication required");
        }

        String username = authentication.getName();
        return userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new NotFoundException("Authenticated user not found"));
    }

    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }
}