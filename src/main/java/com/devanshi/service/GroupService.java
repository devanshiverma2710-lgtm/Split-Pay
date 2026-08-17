package com.devanshi.service;

import com.devanshi.entity.Group;
import com.devanshi.entity.User;
import com.devanshi.exception.ExpenseNotFoundException;
import com.devanshi.repo.GroupRepo;
import com.devanshi.repo.UserRepo;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GroupService {

    private final GroupRepo groupRepo;
    private final UserRepo userRepo;

    public GroupService(GroupRepo groupRepo, UserRepo userRepo) {
        this.groupRepo = groupRepo;
        this.userRepo = userRepo;
    }

    public List<Group> getAllGroups() {
        return groupRepo.findAll();
    }

    public Group getGroupById(Integer id) {
        return groupRepo.findById(id)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "Group not found with id: " + id
                        ));
    }

    public Group createGroup(Group group) {
        return groupRepo.save(group);
    }

    public Group updateGroup(Integer id, Group group) {

        Group existingGroup = groupRepo.findById(id)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "Group not found with id: " + id
                        ));

        existingGroup.setName(group.getName());

        return groupRepo.save(existingGroup);
    }

    public void deleteGroup(Integer id) {

        if (!groupRepo.existsById(id)) {
            throw new ExpenseNotFoundException(
                    "Group not found with id: " + id
            );
        }

        groupRepo.deleteById(id);
    }

    public Group addUserToGroup(Integer groupId, Integer userId) {

        Group group = groupRepo.findById(groupId)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "Group not found with id: " + groupId
                        ));

        User user = userRepo.findById(userId)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "User not found with id: " + userId
                        ));

        group.getUsers().add(user);

        return groupRepo.save(group);
    }
}