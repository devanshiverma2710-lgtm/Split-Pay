package com.devanshi.service;

import com.devanshi.entity.Role;
import com.devanshi.entity.User;
import com.devanshi.exception.ExpenseNotFoundException;
import com.devanshi.repo.UserRepo;
import com.devanshi.security.CurrentUserService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepo userRepo;
    private final CurrentUserService currentUserService;

    public UserService(
            UserRepo userRepo,
            CurrentUserService currentUserService) {

        this.userRepo = userRepo;
        this.currentUserService = currentUserService;
    }

    public List<User> getAllUsers() {

        /*
         * Authentication is already required by SecurityConfig.
         *
         * This is useful for features such as
         * adding users to groups.
         */
        return userRepo.findAll();
    }

    public User getUserById(Integer id) {

        return userRepo.findById(id)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "User not found with id: " + id
                        ));
    }

    public User updateUser(Integer id, User user) {

        User currentUser = currentUserService.getCurrentUser();

        User existingUser = userRepo.findById(id)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "User not found with id: " + id
                        ));

        /*
         * Normal USER can update only their own profile.
         *
         * ADMIN can update any user.
         */
        boolean isAdmin =
                currentUser.getRole() == Role.ADMIN;

        boolean isOwnProfile =
                currentUser.getId().equals(id);

        if (!isOwnProfile && !isAdmin) {
            throw new RuntimeException(
                    "You are not authorized to update this user"
            );
        }

        existingUser.setName(user.getName());
        existingUser.setEmail(user.getEmail());
        existingUser.setUpiId(user.getUpiId());

        /*
         * IMPORTANT:
         * We deliberately do NOT update:
         *
         * password
         * role
         *
         * through this endpoint.
         */

        return userRepo.save(existingUser);
    }

    public void deleteUser(Integer id) {

        User currentUser = currentUserService.getCurrentUser();

        User user = userRepo.findById(id)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "User not found with id: " + id
                        ));

        /*
         * Normal USER can delete only their own account.
         *
         * ADMIN can delete any user.
         */
        boolean isAdmin =
                currentUser.getRole() == Role.ADMIN;

        boolean isOwnAccount =
                currentUser.getId().equals(id);

        if (!isOwnAccount && !isAdmin) {
            throw new RuntimeException(
                    "You are not authorized to delete this user"
            );
        }

        userRepo.delete(user);
    }
}