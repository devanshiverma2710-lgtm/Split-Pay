package com.devanshi.service;

import com.devanshi.dto.ExpenseDTO;
import com.devanshi.dto.SplitExpenseRequest;
import com.devanshi.entity.Expense;
import com.devanshi.entity.ExpenseShare;
import com.devanshi.entity.Group;
import com.devanshi.entity.User;
import com.devanshi.exception.ExpenseNotFoundException;
import com.devanshi.repo.ExpenseRepo;
import com.devanshi.repo.ExpenseShareRepo;
import com.devanshi.repo.GroupRepo;
import com.devanshi.security.CurrentUserService;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepo expenseRepo;
    private final ExpenseShareRepo expenseShareRepo;
    private final GroupRepo groupRepo;
    private final CurrentUserService currentUserService;

    public ExpenseService(
            ExpenseRepo expenseRepo,
            ExpenseShareRepo expenseShareRepo,
            GroupRepo groupRepo,
            CurrentUserService currentUserService
    ) {
        this.expenseRepo = expenseRepo;
        this.expenseShareRepo = expenseShareRepo;
        this.groupRepo = groupRepo;
        this.currentUserService = currentUserService;
    }


    // Get all expenses accessible to current user
    public List<ExpenseDTO> getAllExpenses() {

        User currentUser = currentUserService.getCurrentUser();

        return expenseRepo.findAll()
                .stream()
                .filter(expense ->
                        canAccessExpense(expense, currentUser)
                )
                .map(this::convertToDTO)
                .toList();
    }


    // Get expense by ID
    public ExpenseDTO getExpenseById(Integer id) {

        Expense expense = expenseRepo.findById(id)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "Expense not found with id: " + id
                        ));

        checkAccess(expense);

        return convertToDTO(expense);
    }


    // Add personal expense
    public ExpenseDTO addExpense(ExpenseDTO dto) {

        dto.setDate(LocalDate.now());

        Expense expense = convertToEntity(dto);

        Expense savedExpense = expenseRepo.save(expense);

        return convertToDTO(savedExpense);
    }


    // Update expense
    public ExpenseDTO updateExpense(
            Integer id,
            ExpenseDTO dto
    ) {

        Expense existingExpense = expenseRepo.findById(id)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "Expense not found with id: " + id
                        ));

        // Only the person who paid can modify the expense
        checkOwnership(existingExpense);

        existingExpense.setTitle(dto.getTitle());
        existingExpense.setCategory(dto.getCategory());
        existingExpense.setAmount(dto.getAmount());
        existingExpense.setNote(dto.getNote());
        existingExpense.setDate(dto.getDate());

        Expense updatedExpense =
                expenseRepo.save(existingExpense);

        return convertToDTO(updatedExpense);
    }


    // Delete expense
    public void deleteExpense(Integer id) {

        Expense expense = expenseRepo.findById(id)
                .orElseThrow(() ->
                        new ExpenseNotFoundException(
                                "Expense not found with id: " + id
                        ));

        // Only the person who paid can delete the expense
        checkOwnership(expense);

        expenseRepo.deleteById(id);
    }


    // Get expenses by category
    public List<ExpenseDTO> getExpensesByCategory(
            String category
    ) {

        User currentUser = currentUserService.getCurrentUser();

        return expenseRepo.findByCategory(category)
                .stream()
                .filter(expense ->
                        canAccessExpense(expense, currentUser)
                )
                .map(this::convertToDTO)
                .toList();
    }


    // Convert DTO to Entity
    private Expense convertToEntity(
            ExpenseDTO dto
    ) {

        Expense expense = new Expense();

        expense.setTitle(dto.getTitle());
        expense.setCategory(dto.getCategory());
        expense.setAmount(dto.getAmount());
        expense.setNote(dto.getNote());
        expense.setDate(dto.getDate());

        // Automatically assign logged-in user
        User currentUser =
                currentUserService.getCurrentUser();

        expense.setPaidBy(currentUser);

        return expense;
    }


    // Convert Entity to DTO
    private ExpenseDTO convertToDTO(
            Expense expense
    ) {

        ExpenseDTO dto = new ExpenseDTO();

        dto.setId(expense.getId());
        dto.setTitle(expense.getTitle());
        dto.setCategory(expense.getCategory());
        dto.setAmount(expense.getAmount());
        dto.setNote(expense.getNote());
        dto.setDate(expense.getDate());

        // Group expense
        if (expense.getGroup() != null) {

            dto.setGroupExpense(true);

            dto.setGroupId(
                    expense.getGroup().getId()
            );

            Integer currentUserId =
                    currentUserService.getCurrentUserId();

            // Find logged-in user's share
            expenseShareRepo
                    .findByExpenseIdAndUserId(
                            expense.getId(),
                            currentUserId
                    )
                    .ifPresent(share ->
                            dto.setUserShare(
                                    share.getAmount()
                            )
                    );

        } else {

            // Personal expense
            dto.setGroupExpense(false);
            dto.setGroupId(null);

            dto.setUserShare(
                    expense.getAmount()
            );
        }

        return dto;
    }


    // Create split expense
    public Expense createSplitExpense(
            SplitExpenseRequest request
    ) {

        // Logged-in user from JWT
        User paidBy =
                currentUserService.getCurrentUser();

        // Find group
        Group group =
                groupRepo.findById(
                                request.getGroupId()
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Group not found"
                                ));


        // Logged-in user must belong to group
        if (!isGroupMember(group, paidBy)) {

            throw new RuntimeException(
                    "You are not a member of this group"
            );
        }


        // Create expense
        Expense expense = new Expense();

        expense.setTitle(request.getTitle());
        expense.setAmount(request.getAmount());
        expense.setCategory(request.getCategory());
        expense.setNote(request.getNote());

        expense.setDate(LocalDate.now());

        expense.setGroup(group);

        // Logged-in user is automatically payer
        expense.setPaidBy(paidBy);


        // Save expense
        Expense savedExpense =
                expenseRepo.save(expense);


        // Calculate equal share
        int numberOfMembers =
                group.getUsers().size();

        if (numberOfMembers == 0) {

            throw new RuntimeException(
                    "Group must have at least one member"
            );
        }


        BigDecimal shareAmount =
                request.getAmount()
                        .divide(
                                BigDecimal.valueOf(
                                        numberOfMembers
                                ),
                                2,
                                java.math.RoundingMode.HALF_UP
                        );


        // Create share for every group member
        for (User user : group.getUsers()) {

            ExpenseShare share =
                    new ExpenseShare();

            share.setExpense(savedExpense);
            share.setUser(user);
            share.setAmount(shareAmount);

            expenseShareRepo.save(share);
        }


        return savedExpense;
    }


    // Get expenses by group
    public List<ExpenseDTO> getExpensesByGroup(
            Integer groupId
    ) {

        User currentUser =
                currentUserService.getCurrentUser();

        Group group =
                groupRepo.findById(groupId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Group not found"
                                ));

        // User must belong to the group
        if (!isGroupMember(group, currentUser)) {

            throw new RuntimeException(
                    "You are not a member of this group"
            );
        }

        return expenseRepo
                .findByGroupId(groupId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }


    /*
     * Check whether the current user can VIEW an expense.
     *
     * Personal expense:
     *      only the payer can view it.
     *
     * Group expense:
     *      any member of that group can view it.
     */
    private boolean canAccessExpense(
            Expense expense,
            User currentUser
    ) {

        // Personal expense
        if (expense.getGroup() == null) {

            return expense.getPaidBy() != null
                    && expense.getPaidBy()
                    .getId()
                    .equals(currentUser.getId());
        }


        // Group expense
        return isGroupMember(
                expense.getGroup(),
                currentUser
        );
    }


    /*
     * Check whether the current user can VIEW
     * a specific expense.
     */
    private void checkAccess(
            Expense expense
    ) {

        User currentUser =
                currentUserService.getCurrentUser();

        if (!canAccessExpense(expense, currentUser)) {

            throw new RuntimeException(
                    "You are not authorized to access this expense"
            );
        }
    }


    /*
     * Only the person who paid for the expense
     * can update or delete it.
     */
    private void checkOwnership(
            Expense expense
    ) {

        User currentUser =
                currentUserService.getCurrentUser();

        if (expense.getPaidBy() == null ||
                !expense.getPaidBy()
                        .getId()
                        .equals(currentUser.getId())) {

            throw new RuntimeException(
                    "You are not authorized to modify this expense"
            );
        }
    }


    /*
     * Check group membership.
     */
    private boolean isGroupMember(
            Group group,
            User user
    ) {

        return group.getUsers()
                .stream()
                .anyMatch(groupUser ->
                        groupUser.getId()
                                .equals(user.getId())
                );
    }
}