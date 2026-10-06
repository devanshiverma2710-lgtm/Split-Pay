package com.devanshi.controller;

import com.devanshi.dto.BalanceDTO;
import com.devanshi.dto.SettlementDTO;
import com.devanshi.entity.Group;
import com.devanshi.entity.Payment;
import com.devanshi.service.GroupService;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/groups")
public class GroupController {

    private final GroupService groupService;

    public GroupController(GroupService groupService) {
        this.groupService = groupService;
    }

    // ==============================
    // GET ALL GROUPS
    // ==============================

    @GetMapping
    public ResponseEntity<List<Group>> getAllGroups() {

        return ResponseEntity.ok(
                groupService.getAllGroups()
        );
    }

    // ==============================
    // GET GROUP BY ID
    // ==============================

    @GetMapping("/{id}")
    public ResponseEntity<Group> getGroupById(
            @PathVariable Integer id
    ) {

        return ResponseEntity.ok(
                groupService.getGroupById(id)
        );
    }

    // ==============================
    // GET GROUP BALANCES
    // ==============================

    @GetMapping("/{groupId}/balances")
    public ResponseEntity<List<BalanceDTO>> getGroupBalances(
            @PathVariable Integer groupId
    ) {

        return ResponseEntity.ok(
                groupService.getGroupBalances(groupId)
        );
    }

    // ==============================
    // GET GROUP SETTLEMENTS
    // ==============================

    @GetMapping("/{groupId}/settlements")
    public ResponseEntity<List<SettlementDTO>> getGroupSettlements(
            @PathVariable Integer groupId
    ) {

        return ResponseEntity.ok(
                groupService.getGroupSettlements(groupId)
        );
    }

    // ==============================
    // CREATE GROUP
    // ==============================

    @PostMapping
    public ResponseEntity<Group> createGroup(
            @Valid @RequestBody Group group
    ) {

        Group createdGroup =
                groupService.createGroup(group);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdGroup);
    }

    // ==============================
    // CREATE PAYMENTS FROM SETTLEMENTS
    // ==============================

    @PostMapping("/{groupId}/payments")
    public ResponseEntity<List<Payment>> createGroupPayments(
            @PathVariable Integer groupId
    ) {

        return ResponseEntity.ok(
                groupService.createPaymentsFromSettlements(
                        groupId
                )
        );
    }

    // ==============================
    // UPDATE GROUP
    // ==============================

    @PutMapping("/{id}")
    public ResponseEntity<Group> updateGroup(
            @PathVariable Integer id,
            @Valid @RequestBody Group group
    ) {

        return ResponseEntity.ok(
                groupService.updateGroup(id, group)
        );
    }

    // ==============================
    // DELETE GROUP
    // ==============================

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteGroup(
            @PathVariable Integer id
    ) {

        groupService.deleteGroup(id);

        return ResponseEntity.ok(
                "Group deleted successfully"
        );
    }

    // ==============================
    // ADD USER TO GROUP
    // ==============================

    @PostMapping("/{groupId}/users/{userId}")
    public ResponseEntity<Group> addUserToGroup(
            @PathVariable Integer groupId,
            @PathVariable Integer userId
    ) {

        return ResponseEntity.ok(
                groupService.addUserToGroup(
                        groupId,
                        userId
                )
        );
    }
}