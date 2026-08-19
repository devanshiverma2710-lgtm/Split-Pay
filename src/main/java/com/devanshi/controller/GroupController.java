package com.devanshi.controller;

import com.devanshi.dto.SettlementDTO;
import com.devanshi.entity.Group;
import com.devanshi.service.GroupService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.devanshi.dto.BalanceDTO;
import java.util.List;


@RestController
@RequestMapping("/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    @GetMapping
    public ResponseEntity<List<Group>> getAllGroups() {
        return ResponseEntity.ok(
                groupService.getAllGroups()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<Group> getGroupById(
            @PathVariable Integer id) {

        return ResponseEntity.ok(
                groupService.getGroupById(id)
        );
    }

    @GetMapping("/{groupId}/balances")
    public ResponseEntity<List<BalanceDTO>> getGroupBalances(
            @PathVariable Integer groupId) {

        return ResponseEntity.ok(
                groupService.getGroupBalances(groupId)
        );
    }

    @GetMapping("/{groupId}/settlements")
    public ResponseEntity<List<SettlementDTO>> getGroupSettlements(
            @PathVariable Integer groupId) {

        return ResponseEntity.ok(
                groupService.getGroupSettlements(groupId)
        );
    }

    @PostMapping
    public ResponseEntity<Group> createGroup(
            @Valid @RequestBody Group group) {

        return new ResponseEntity<>(
                groupService.createGroup(group),
                HttpStatus.CREATED
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<Group> updateGroup(
            @PathVariable Integer id,
            @Valid @RequestBody Group group) {

        return ResponseEntity.ok(
                groupService.updateGroup(id, group)
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteGroup(
            @PathVariable Integer id) {

        groupService.deleteGroup(id);

        return ResponseEntity.ok(
                "Group deleted successfully"
        );
    }

    @PostMapping("/{groupId}/users/{userId}")
    public ResponseEntity<Group> addUserToGroup(
            @PathVariable Integer groupId,
            @PathVariable Integer userId) {

        return ResponseEntity.ok(
                groupService.addUserToGroup(groupId, userId)
        );
    }
}