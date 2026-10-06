import "./Expenses.css";
import { useEffect, useState } from "react";
import api from "../services/api";

function Expenses({ onBack }) {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");

    // Fetch expenses
    useEffect(() => {
        api.get("/expenses")
            .then((response) => {
                console.log("All expenses:", response.data);

                setExpenses(response.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error fetching expenses:", error);
                setLoading(false);
            });
    }, []);

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) {
            return "N/A";
        }

        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return "N/A";
        }

        return date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    // Filter expenses
    const filteredExpenses = expenses.filter((expense) => {
        if (filter === "personal") {
            return !expense.groupExpense;
        }

        if (filter === "group") {
            return expense.groupExpense;
        }

        return true;
    });

    // Calculate YOUR spending
    const totalExpenses = filteredExpenses.reduce(
        (total, expense) =>
            total + Number(expense.userShare ?? expense.amount ?? 0),
        0
    );

    // Number of group expenses
    const groupExpenseCount = filteredExpenses.filter(
        (expense) => expense.groupExpense
    ).length;

    // Number of personal expenses
    const personalExpenseCount = filteredExpenses.filter(
        (expense) => !expense.groupExpense
    ).length;

    return (
        <div className="expenses-page">

            {/* Header */}
            <div className="expenses-header">

                <button
                    className="back-button"
                    onClick={onBack}
                >
                    ←
                </button>

                <div>
                    <h1>Expenses</h1>

                    <p>
                        View and manage your spending
                    </p>
                </div>

            </div>

            {/* Summary */}
            <div className="expenses-summary">

                <div className="expenses-summary-card">

                    <span>
                        Your spending
                    </span>

                    <h2>
                        ₹{totalExpenses.toLocaleString("en-IN")}
                    </h2>

                    <small>
                        Based on your share
                    </small>

                </div>

                <div className="expenses-summary-card">

                    <span>
                        Expenses shown
                    </span>

                    <h2>
                        {filteredExpenses.length}
                    </h2>

                    <small>
                        {personalExpenseCount} personal
                        {" · "}
                        {groupExpenseCount} shared
                    </small>

                </div>

            </div>

            {/* Main Expense Container */}
            <div className="all-expenses-card">

                {/* Header */}
                <div className="all-expenses-header">

                    <div>
                        <h2>
                            Expense history
                        </h2>

                        <p>
                            Your complete spending activity
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="expense-filters">

                        <button
                            className={
                                filter === "all"
                                    ? "filter-button active"
                                    : "filter-button"
                            }
                            onClick={() => setFilter("all")}
                        >
                            All
                        </button>

                        <button
                            className={
                                filter === "personal"
                                    ? "filter-button active"
                                    : "filter-button"
                            }
                            onClick={() => setFilter("personal")}
                        >
                            Personal
                        </button>

                        <button
                            className={
                                filter === "group"
                                    ? "filter-button active"
                                    : "filter-button"
                            }
                            onClick={() => setFilter("group")}
                        >
                            Group
                        </button>

                    </div>

                </div>

                {/* Loading */}
                {loading && (
                    <div className="expense-message">
                        Loading expenses...
                    </div>
                )}

                {/* Empty */}
                {!loading && filteredExpenses.length === 0 && (
                    <div className="expense-message">
                        No expenses found.
                    </div>
                )}

                {/* Expense List */}
                {!loading && filteredExpenses.length > 0 && (
                    <div className="expense-table">

                        {filteredExpenses
                            .slice()
                            .sort(
                                (a, b) =>
                                    new Date(b.date) -
                                    new Date(a.date)
                            )
                            .map((expense) => {

                                const isGroupExpense =
                                    expense.groupExpense === true;

                                const yourShare = Number(
                                    expense.userShare ??
                                    expense.amount ??
                                    0
                                );

                                const totalBill = Number(
                                    expense.amount ?? 0
                                );

                                return (
                                    <div
                                        className={
                                            isGroupExpense
                                                ? "expense-table-row group-expense-row"
                                                : "expense-table-row"
                                        }
                                        key={expense.id}
                                    >

                                        {/* Expense information */}
                                        <div className="expense-info">

                                            <div
                                                className={
                                                    isGroupExpense
                                                        ? "expense-category-icon group-icon"
                                                        : "expense-category-icon"
                                                }
                                            >
                                                {isGroupExpense
                                                    ? "G"
                                                    : expense.category
                                                        ? expense.category
                                                            .charAt(0)
                                                            .toUpperCase()
                                                        : "E"}
                                            </div>

                                            <div>

                                                <h3>
                                                    {expense.title}
                                                </h3>

                                                <p>
                                                    {expense.category || "Other"}

                                                    {isGroupExpense && (
                                                        <span className="group-label">
                                                            Group expense
                                                        </span>
                                                    )}
                                                </p>

                                            </div>

                                        </div>

                                        {/* Details */}
                                        <div className="expense-note">

                                            {isGroupExpense ? (
                                                <div className="group-expense-details">

                                                    <span>
                                                        Your share: ₹
                                                        {yourShare.toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </span>

                                                    <small>
                                                        Total bill: ₹
                                                        {totalBill.toLocaleString(
                                                            "en-IN"
                                                        )}
                                                    </small>

                                                </div>
                                            ) : (
                                                <span>
                                                    {expense.note || "No note"}
                                                </span>
                                            )}

                                        </div>

                                        {/* Date */}
                                        <div className="expense-date">

                                            {formatDate(expense.date)}

                                        </div>

                                        {/* Amount */}
                                        <div className="expense-amount">

                                            ₹
                                            {yourShare.toLocaleString(
                                                "en-IN"
                                            )}

                                        </div>

                                    </div>
                                );
                            })}

                    </div>
                )}

            </div>

        </div>
    );
}

export default Expenses;