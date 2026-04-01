package com.kigentask.service;

import com.kigentask.dto.user.UserProfileResponse;
import com.kigentask.model.User;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final CurrentUserService currentUserService;

    public UserService(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    public UserProfileResponse getCurrentUserProfile() {
        User user = currentUserService.getCurrentUser();
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                user.getActive(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}