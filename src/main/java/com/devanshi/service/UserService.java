package com.devanshi.service;

import com.devanshi.entity.User;
import com.devanshi.exception.ExpenseNotFoundException;
import com.devanshi.repo.UserRepo;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    private final UserRepo userRepo;

    public UserService(UserRepo userRepo) {
        this.userRepo = userRepo;
    }
    public List<User> getAllUsers(){
        return userRepo.findAll();
    }
    public User getUserById(Integer id) {
        return userRepo.findById(id)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "User not found with id: " + id
                        ));
    }
    public User addUser(User user) {
        return userRepo.save(user);
    }
    public User updateUser(Integer id, User user) {

        User existingUser = userRepo.findById(id)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "User not found with id: " + id
                        ));

        existingUser.setName(user.getName());
        existingUser.setEmail(user.getEmail());

        return userRepo.save(existingUser);
    }
    public void deleteUser(Integer id) {

        if (!userRepo.existsById(id)) {
            throw new ExpenseNotFoundException(
                    "User not found with id: " + id
            );
        }

        userRepo.deleteById(id);
    }

}
