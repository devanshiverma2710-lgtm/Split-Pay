package com.devanshi.service;

import com.devanshi.dto.BalanceDTO;
import com.devanshi.dto.SettlementDTO;
import com.devanshi.entity.*;
import com.devanshi.exception.ExpenseNotFoundException;
import com.devanshi.repo.ExpenseRepo;
import com.devanshi.repo.ExpenseShareRepo;
import com.devanshi.repo.GroupRepo;
import com.devanshi.repo.PaymentRepo;
import com.devanshi.repo.UserRepo;
import com.devanshi.security.CurrentUserService;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GroupService {

    private final GroupRepo groupRepo;
    private final UserRepo userRepo;
    private final ExpenseShareRepo expenseShareRepo;
    private final PaymentService paymentService;
    private final PaymentRepo paymentRepo;
    private final ExpenseRepo expenseRepo;
    private final CurrentUserService currentUserService;

    public GroupService(
            GroupRepo groupRepo,
            UserRepo userRepo,
            ExpenseShareRepo expenseShareRepo,
            PaymentService paymentService,
            PaymentRepo paymentRepo,
            ExpenseRepo expenseRepo,
            CurrentUserService currentUserService
    ) {
        this.groupRepo = groupRepo;
        this.userRepo = userRepo;
        this.expenseShareRepo = expenseShareRepo;
        this.paymentService = paymentService;
        this.paymentRepo = paymentRepo;
        this.expenseRepo = expenseRepo;
        this.currentUserService = currentUserService;
    }


    // Get only groups belonging to the logged-in user
    public List<Group> getAllGroups() {

        User currentUser =
                currentUserService.getCurrentUser();

        return groupRepo.findAll()
                .stream()
                .filter(group ->
                        isGroupMember(group, currentUser)
                )
                .toList();
    }


    // Get group by ID
    public Group getGroupById(Integer id) {

        Group group =
                groupRepo.findById(id)
                        .orElseThrow(() ->
                                new ExpenseNotFoundException(
                                        "Group not found with id: "
                                                + id
                                ));

        checkGroupMembership(group);

        return group;
    }


    // Create group
    // Create group
    public Group createGroup(Group group) {

        User currentUser =
                currentUserService.getCurrentUser();

        /*
         * Do not trust users sent by frontend.
         * The logged-in user automatically becomes
         * the first member of the group.
         */
        group.getUsers().clear();

        group.getUsers().add(currentUser);

        return groupRepo.save(group);
    }


    // Update group
    public Group updateGroup(
            Integer id,
            Group group
    ) {

        Group existingGroup =
                groupRepo.findById(id)
                        .orElseThrow(() ->
                                new ExpenseNotFoundException(
                                        "Group not found with id: "
                                                + id
                                ));

        checkGroupMembership(existingGroup);

        existingGroup.setName(group.getName());

        /*
         * Do not replace the users list from the request.
         *
         * Otherwise a frontend request could accidentally
         * remove existing members or inject unauthorized users.
         */

        return groupRepo.save(existingGroup);
    }


    // Delete group
    public void deleteGroup(Integer id) {

        Group group =
                groupRepo.findById(id)
                        .orElseThrow(() ->
                                new ExpenseNotFoundException(
                                        "Group not found with id: "
                                                + id
                                ));

        checkGroupMembership(group);

        groupRepo.deleteById(id);
    }


    // Add user to group
    public Group addUserToGroup(
            Integer groupId,
            Integer userId
    ) {

        Group group =
                groupRepo.findById(groupId)
                        .orElseThrow(() ->
                                new ExpenseNotFoundException(
                                        "Group not found with id: "
                                                + groupId
                                ));


        // Logged-in user must already belong to group
        checkGroupMembership(group);


        User user =
                userRepo.findById(userId)
                        .orElseThrow(() ->
                                new ExpenseNotFoundException(
                                        "User not found with id: "
                                                + userId
                                ));


        // Avoid duplicate members
        if (!isGroupMember(group, user)) {
            group.getUsers().add(user);
        }

        return groupRepo.save(group);
    }


    // Get balances
    public List<BalanceDTO> getGroupBalances(
            Integer groupId
    ) {

        Group group =
                groupRepo.findById(groupId)
                        .orElseThrow(() ->
                                new ExpenseNotFoundException(
                                        "Group not found with id: "
                                                + groupId
                                ));


        checkGroupMembership(group);


        List<ExpenseShare> shares =
                expenseShareRepo.findByExpenseGroupId(groupId);


        Map<Integer, BigDecimal> balances =
                new HashMap<>();


        // Initially everyone owes 0
        for (User user : group.getUsers()) {

            balances.put(
                    user.getId(),
                    BigDecimal.ZERO
            );
        }


        // Subtract what each user owes
        for (ExpenseShare share : shares) {

            Integer userId =
                    share.getUser().getId();


            balances.put(
                    userId,
                    balances.getOrDefault(
                            userId,
                            BigDecimal.ZERO
                    ).subtract(
                            share.getAmount()
                    )
            );
        }


        // Add/subtract completed payments
        List<Payment> paidPayments =
                paymentRepo.findByGroupIdAndStatus(
                        groupId,
                        PaymentStatus.PAID
                );


        for (Payment payment : paidPayments) {

            Integer fromUserId =
                    payment.getFromUser().getId();

            Integer toUserId =
                    payment.getToUser().getId();


            balances.put(
                    fromUserId,
                    balances.getOrDefault(
                            fromUserId,
                            BigDecimal.ZERO
                    ).add(
                            payment.getAmount()
                    )
            );


            balances.put(
                    toUserId,
                    balances.getOrDefault(
                            toUserId,
                            BigDecimal.ZERO
                    ).subtract(
                            payment.getAmount()
                    )
            );
        }


        // Add the full amount paid by each user
        List<Expense> expenses =
                expenseRepo.findByGroupId(groupId);


        for (Expense expense : expenses) {

            User payer =
                    expense.getPaidBy();


            if (payer == null) {
                continue;
            }


            Integer payerId =
                    payer.getId();


            balances.put(
                    payerId,
                    balances.getOrDefault(
                            payerId,
                            BigDecimal.ZERO
                    ).add(
                            expense.getAmount()
                    )
            );
        }


        return group.getUsers()
                .stream()
                .map(user ->
                        new BalanceDTO(
                                user.getId(),
                                user.getName(),
                                balances.getOrDefault(
                                        user.getId(),
                                        BigDecimal.ZERO
                                )
                        )
                )
                .toList();
    }


    // Calculate settlements
    public List<SettlementDTO> getGroupSettlements(
            Integer groupId
    ) {

        // getGroupBalances also checks membership
        List<BalanceDTO> balances =
                getGroupBalances(groupId);


        List<BalanceDTO> creditors =
                balances.stream()
                        .filter(b ->
                                b.getBalance()
                                        .compareTo(
                                                BigDecimal.ZERO
                                        ) > 0
                        )
                        .sorted(
                                Comparator.comparing(
                                        BalanceDTO::getBalance
                                ).reversed()
                        )
                        .toList();


        List<BalanceDTO> debtors =
                balances.stream()
                        .filter(b ->
                                b.getBalance()
                                        .compareTo(
                                                BigDecimal.ZERO
                                        ) < 0
                        )
                        .sorted(
                                Comparator.comparing(
                                        BalanceDTO::getBalance
                                )
                        )
                        .toList();


        List<SettlementDTO> settlements =
                new ArrayList<>();


        int i = 0;
        int j = 0;


        while (
                i < debtors.size()
                        &&
                        j < creditors.size()
        ) {

            BalanceDTO debtor =
                    debtors.get(i);

            BalanceDTO creditor =
                    creditors.get(j);


            BigDecimal amountOwed =
                    debtor.getBalance().abs();


            BigDecimal amountToReceive =
                    creditor.getBalance();


            BigDecimal settlementAmount =
                    amountOwed.min(
                            amountToReceive
                    );


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
                    debtor.getBalance()
                            .add(
                                    settlementAmount
                            )
            );


            creditor.setBalance(
                    creditor.getBalance()
                            .subtract(
                                    settlementAmount
                            )
            );


            if (
                    debtor.getBalance()
                            .compareTo(
                                    BigDecimal.ZERO
                            ) == 0
            ) {

                i++;
            }


            if (
                    creditor.getBalance()
                            .compareTo(
                                    BigDecimal.ZERO
                            ) == 0
            ) {

                j++;
            }
        }


        return settlements;
    }


    // Create payment from settlements
    public List<Payment> createPaymentsFromSettlements(
            Integer groupId
    ) {

        Group group =
                groupRepo.findById(groupId)
                        .orElseThrow(() ->
                                new ExpenseNotFoundException(
                                        "Group not found with id: "
                                                + groupId
                                ));


        checkGroupMembership(group);


        User currentUser =
                currentUserService.getCurrentUser();


        List<SettlementDTO> settlements =
                getGroupSettlements(groupId);


        List<Payment> payments =
                new ArrayList<>();


        /*
         * A user can only create a payment where
         * THEY are the debtor.
         *
         * We must not create payments on behalf
         * of other users.
         */
        for (SettlementDTO settlement : settlements) {

            if (
                    !settlement.getFromUserId()
                            .equals(
                                    currentUser.getId()
                            )
            ) {

                continue;
            }


            Payment payment =
                    paymentService
                            .createPaymentFromSettlement(
                                    groupId,
                                    currentUser.getId(),
                                    settlement.getToUserId(),
                                    settlement.getAmount()
                            );


            payments.add(payment);
        }


        return payments;
    }


    // Check whether current user belongs to group
    private void checkGroupMembership(
            Group group
    ) {

        User currentUser =
                currentUserService.getCurrentUser();

        if (!isGroupMember(group, currentUser)) {

            throw new RuntimeException(
                    "You are not a member of this group"
            );
        }
    }


    // Check membership using user IDs
    private boolean isGroupMember(
            Group group,
            User user
    ) {

        if (group.getUsers() == null) {
            return false;
        }

        return group.getUsers()
                .stream()
                .anyMatch(groupUser ->
                        groupUser.getId()
                                .equals(user.getId())
                );
    }
}