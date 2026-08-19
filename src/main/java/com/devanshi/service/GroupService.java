package com.devanshi.service;

import com.devanshi.entity.Group;
import com.devanshi.entity.User;
import com.devanshi.exception.ExpenseNotFoundException;
import com.devanshi.repo.ExpenseShareRepo;
import com.devanshi.repo.GroupRepo;
import com.devanshi.repo.UserRepo;
import org.springframework.stereotype.Service;
import com.devanshi.dto.BalanceDTO;
import com.devanshi.entity.ExpenseShare;
import com.devanshi.dto.SettlementDTO;

import java.util.ArrayList;
import java.util.Comparator;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Service
public class GroupService {

    private final GroupRepo groupRepo;
    private final UserRepo userRepo;
    private final ExpenseShareRepo expenseShareRepo;

    public GroupService(
            GroupRepo groupRepo,
            UserRepo userRepo,
            ExpenseShareRepo expenseShareRepo) {

        this.groupRepo = groupRepo;
        this.userRepo = userRepo;
        this.expenseShareRepo = expenseShareRepo;
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

    public List<BalanceDTO> getGroupBalances(Integer groupId) {

        Group group = groupRepo.findById(groupId)
                .orElseThrow(() ->
                        new RuntimeException("Group not found"));

        List<ExpenseShare> shares =
                expenseShareRepo.findByExpenseGroupId(groupId);

        Map<Integer, BigDecimal> balances = new HashMap<>();

        // Initially everyone owes 0
        for (User user : group.getUsers()) {
            balances.put(
                    user.getId(),
                    BigDecimal.ZERO
            );
        }

        // Calculate what each user owes
        for (ExpenseShare share : shares) {

            Integer userId = share.getUser().getId();

            balances.put(
                    userId,
                    balances.get(userId)
                            .subtract(share.getAmount())
            );
        }

        // Add what each user paid
        for (ExpenseShare share : shares) {

            User payer = share.getExpense().getPaidBy();

            Integer payerId = payer.getId();

            balances.put(
                    payerId,
                    balances.get(payerId)
                            .add(share.getAmount())
            );
        }

        return group.getUsers()
                .stream()
                .map(user -> new BalanceDTO(
                        user.getId(),
                        user.getName(),
                        balances.get(user.getId())
                ))
                .toList();
    }

    public List<SettlementDTO> getGroupSettlements(Integer groupId) {

        List<BalanceDTO> balances = getGroupBalances(groupId);

        List<BalanceDTO> creditors = balances.stream()
                .filter(b -> b.getBalance().compareTo(BigDecimal.ZERO) > 0)
                .sorted(Comparator.comparing(BalanceDTO::getBalance).reversed())
                .toList();

        List<BalanceDTO> debtors = balances.stream()
                .filter(b -> b.getBalance().compareTo(BigDecimal.ZERO) < 0)
                .sorted(Comparator.comparing(BalanceDTO::getBalance))
                .toList();

        List<SettlementDTO> settlements = new ArrayList<>();

        int i = 0;
        int j = 0;

        while (i < debtors.size() && j < creditors.size()) {

            BalanceDTO debtor = debtors.get(i);
            BalanceDTO creditor = creditors.get(j);

            BigDecimal amountOwed =
                    debtor.getBalance().abs();

            BigDecimal amountToReceive =
                    creditor.getBalance();

            BigDecimal settlementAmount =
                    amountOwed.min(amountToReceive);

            settlements.add(
                    new SettlementDTO(
                            debtor.getUserId(),
                            debtor.getUserName(),
                            creditor.getUserId(),
                            creditor.getUserName(),
                            settlementAmount
                    )
            );

            debtor.setBalance(
                    debtor.getBalance().add(settlementAmount)
            );

            creditor.setBalance(
                    creditor.getBalance().subtract(settlementAmount)
            );

            if (debtor.getBalance().compareTo(BigDecimal.ZERO) == 0) {
                i++;
            }

            if (creditor.getBalance().compareTo(BigDecimal.ZERO) == 0) {
                j++;
            }
        }

        return settlements;
    }
}