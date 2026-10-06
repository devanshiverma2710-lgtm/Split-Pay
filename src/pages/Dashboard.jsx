import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

const CURRENT_USER_ID = 1;

function Dashboard() {
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const [remindedPayments, setRemindedPayments] = useState({});
  const [remindingId, setRemindingId] = useState(null);

  // =========================================
  // SELECTED MONTH
  // =========================================

  const [selectedMonthYear, setSelectedMonthYear] = useState(() => {
    const now = new Date();
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, "0");

    return `${yr}-${mo}`;
  });

  // =========================================
  // SELECTED YEAR + MONTH
  // =========================================

  const [selectedYearNum, selectedMonthNum] = useMemo(() => {
    const parts = selectedMonthYear.split("-").map(Number);

    return [
      parts[0] || new Date().getFullYear(),
      parts[1] || new Date().getMonth() + 1,
    ];
  }, [selectedMonthYear]);

  const selectedMonthIndex = selectedMonthNum - 1;

  // =========================================
  // SELECTED MONTH DATE
  // =========================================

  const selectedMonthDate = useMemo(() => {
    return new Date(
      selectedYearNum,
      selectedMonthIndex,
      1
    );
  }, [selectedYearNum, selectedMonthIndex]);

  // =========================================
  // SELECTED MONTH NAME
  // =========================================

  const selectedMonthName = useMemo(() => {
    return selectedMonthDate.toLocaleDateString(
      "en-US",
      {
        month: "long",
      }
    );
  }, [selectedMonthDate]);

  // =========================================
  // AVAILABLE MONTHS
  // =========================================

  const availableMonths = useMemo(() => {
    const monthsMap = new Map();
    const now = new Date();

    // Current month + previous 11 months
    for (let i = 0; i < 12; i++) {
      const d = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      const value =
        `${d.getFullYear()}-${String(
          d.getMonth() + 1
        ).padStart(2, "0")}`;

      const label = d.toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric",
        }
      );

      monthsMap.set(value, {
        value,
        label,
        date: d,
      });
    }

    // Include months from backend expenses
    expenses.forEach((expense) => {
      if (!expense.date) return;

      const d = new Date(expense.date);

      if (!isNaN(d.getTime())) {
        const value =
          `${d.getFullYear()}-${String(
            d.getMonth() + 1
          ).padStart(2, "0")}`;

        const label = d.toLocaleDateString(
          "en-US",
          {
            month: "long",
            year: "numeric",
          }
        );

        if (!monthsMap.has(value)) {
          monthsMap.set(value, {
            value,
            label,
            date: d,
          });
        }
      }
    });

    return Array.from(monthsMap.values()).sort(
      (a, b) => b.date - a.date
    );
  }, [expenses]);

  // =========================================
  // FETCH DASHBOARD DATA
  // =========================================

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Loading dashboard data...");

      const [expensesRes, paymentsRes] =
        await Promise.all([
          api.get("/expenses"),
          api.get("/payments"),
        ]);

      console.log(
        "Expenses response:",
        expensesRes.data
      );

      console.log(
        "Payments response:",
        paymentsRes.data
      );

      const expensesData = expensesRes.data;
      const paymentsData = paymentsRes.data;

      setExpenses(
        Array.isArray(expensesData)
          ? expensesData
          : []
      );

      setPayments(
        Array.isArray(paymentsData)
          ? paymentsData
          : []
      );

      setError("");

    } catch (err) {
      console.error(
        "Dashboard data load error:",
        err
      );

      if (err.response) {
        console.error(
          "Status:",
          err.response.status
        );

        console.error(
          "Response:",
          err.response.data
        );
      }

      setError(
        "Unable to load latest financial data. Please ensure the backend service is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // LOAD DASHBOARD ON PAGE OPEN
  // =========================================

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // =========================================
  // SEND PAYMENT REMINDER
  // =========================================

  const handleSendReminder = async (payment) => {
    const paymentId =
      payment.paymentId || payment.id;

    if (!paymentId) return;

    try {
      setRemindingId(paymentId);

      await api.post(
        `/reminders/payment/${paymentId}`
      );

      setRemindedPayments((prev) => ({
        ...prev,
        [paymentId]: true,
      }));

    } catch (err) {
      console.error(
        "Failed to send reminder:",
        err
      );

      if (err.response) {
        console.error(
          "Reminder status:",
          err.response.status
        );

        console.error(
          "Reminder response:",
          err.response.data
        );
      }

      // Keep the UI behavior from your previous version
      setRemindedPayments((prev) => ({
        ...prev,
        [paymentId]: true,
      }));

    } finally {
      setRemindingId(null);
    }
  };

  // =========================================
  // DATE PARSER
  // =========================================

  const parseExpenseDate = (dateVal) => {
    if (!dateVal) return null;

    const d = new Date(dateVal);

    return isNaN(d.getTime()) ? null : d;
  };

  // =========================================
  // EXPENSES FOR SELECTED MONTH
  // =========================================

  const monthExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const d = parseExpenseDate(
        expense.date || expense.createdAt
      );

      if (!d) return false;

      return (
        d.getFullYear() === selectedYearNum &&
        d.getMonth() === selectedMonthIndex
      );
    });
  }, [
    expenses,
    selectedYearNum,
    selectedMonthIndex,
  ]);

  // =========================================
  // TOTAL SPENT
  // =========================================

  const totalSpent = useMemo(() => {
    return monthExpenses.reduce(
      (sum, expense) => {
        const share = Number(
          expense.userShare ??
            expense.amount ??
            0
        );

        return (
          sum +
          (isNaN(share) ? 0 : share)
        );
      },
      0
    );
  }, [monthExpenses]);

  // =========================================
  // MONTH COMPARISON
  // =========================================

  const comparisonInfo = useMemo(() => {
    const previousDate = new Date(
      selectedYearNum,
      selectedMonthIndex - 1,
      1
    );

    const previousMonth =
      previousDate.getMonth();

    const previousYear =
      previousDate.getFullYear();

    const previousMonthName =
      previousDate.toLocaleDateString(
        "en-US",
        {
          month: "long",
        }
      );

    const previousMonthExpenses =
      expenses.filter((expense) => {
        const d = parseExpenseDate(
          expense.date ||
            expense.createdAt
        );

        if (!d) return false;

        return (
          d.getFullYear() === previousYear &&
          d.getMonth() === previousMonth
        );
      });

    const previousMonthTotal =
      previousMonthExpenses.reduce(
        (sum, expense) => {
          const share = Number(
            expense.userShare ??
              expense.amount ??
              0
          );

          return (
            sum +
            (isNaN(share) ? 0 : share)
          );
        },
        0
      );

    if (
      previousMonthTotal > 0 &&
      totalSpent > 0
    ) {
      const difference =
        ((totalSpent -
          previousMonthTotal) /
          previousMonthTotal) *
        100;

      const rounded =
        Math.abs(Math.round(difference));

      if (difference < 0) {
        return {
          text: `↓ ${rounded}% compared with ${previousMonthName}`,
          isPositive: true,
        };
      }

      if (difference > 0) {
        return {
          text: `↑ ${rounded}% compared with ${previousMonthName}`,
          isPositive: false,
        };
      }
    }

    if (
      previousMonthTotal > 0 &&
      totalSpent === 0
    ) {
      return {
        text: `↓ 100% compared with ${previousMonthName}`,
        isPositive: true,
      };
    }

    if (monthExpenses.length > 0) {
      return {
        text: `Based on ${
          monthExpenses.length
        } tracked expense${
          monthExpenses.length === 1
            ? ""
            : "s"
        }`,
        isPositive: true,
      };
    }

    return {
      text: `No expenses recorded in ${selectedMonthName}`,
      isPositive: true,
    };
  }, [
    expenses,
    monthExpenses,
    totalSpent,
    selectedYearNum,
    selectedMonthIndex,
    selectedMonthName,
  ]);

  // =========================================
  // PAYMENTS FOR SELECTED MONTH
  // =========================================

  const monthPayments = useMemo(() => {
    return payments.filter((payment) => {
      const dateVal =
        payment.date ||
        payment.paidAt ||
        payment.createdAt;

      if (dateVal) {
        const d =
          parseExpenseDate(dateVal);

        if (d) {
          return (
            d.getFullYear() ===
              selectedYearNum &&
            d.getMonth() ===
              selectedMonthIndex
          );
        }
      }

      // If payment has no date,
      // consider it current month
      const now = new Date();

      return (
        now.getFullYear() ===
          selectedYearNum &&
        now.getMonth() ===
          selectedMonthIndex
      );
    });
  }, [
    payments,
    selectedYearNum,
    selectedMonthIndex,
  ]);

  // =========================================
  // PAYMENTS TO COLLECT
  // =========================================

  const toCollectList = useMemo(() => {
    return monthPayments.filter(
      (payment) =>
        (
          Number(payment.toUserId) ===
            CURRENT_USER_ID ||
          payment.toUserName
            ?.toLowerCase()
            .includes("devanshi")
        ) &&
        payment.status !== "PAID"
    );
  }, [monthPayments]);

  const toCollectTotal = useMemo(() => {
    return toCollectList.reduce(
      (sum, payment) =>
        sum +
        Number(payment.amount || 0),
      0
    );
  }, [toCollectList]);

  // =========================================
  // PAYMENTS TO PAY
  // =========================================

  const toPayList = useMemo(() => {
    return monthPayments.filter(
      (payment) =>
        (
          Number(payment.fromUserId) ===
            CURRENT_USER_ID ||
          payment.fromUserName
            ?.toLowerCase()
            .includes("devanshi")
        ) &&
        payment.status !== "PAID"
    );
  }, [monthPayments]);

  const toPayTotal = useMemo(() => {
    return toPayList.reduce(
      (sum, payment) =>
        sum +
        Number(payment.amount || 0),
      0
    );
  }, [toPayList]);

  // =========================================
  // CATEGORY BREAKDOWN
  // =========================================

  const categoryBreakdown = useMemo(() => {
    if (monthExpenses.length === 0) {
      return [];
    }

    const categoryMap = {};
    let grandTotal = 0;

    monthExpenses.forEach((expense) => {
      const category =
        expense.category
          ? expense.category.trim()
          : "Other";

      const share = Number(
        expense.userShare ??
          expense.amount ??
          0
      );

      if (!isNaN(share) && share > 0) {
        categoryMap[category] =
          (categoryMap[category] || 0) +
          share;

        grandTotal += share;
      }
    });

    if (grandTotal === 0) {
      return [];
    }

    const colorClasses = {
      food: "food",
      travel: "travel",
      shopping: "shopping",
      entertainment: "entertainment",
      bills: "bills",
      housing: "bills",
      other: "other",
    };

    return Object.keys(categoryMap)
      .map((category) => {
        const amount =
          categoryMap[category];

        const percentage =
          Math.round(
            (amount / grandTotal) * 100
          );

        const lower =
          category.toLowerCase();

        const colorClass =
          colorClasses[lower] ||
          "other";

        return {
          name: category,
          amount,
          percentage,
          colorClass,
        };
      })
      .sort(
        (a, b) =>
          b.amount - a.amount
      )
      .slice(0, 4);
  }, [monthExpenses]);

  // =========================================
  // SPENDING TREND
  // =========================================

  const chartBars = useMemo(() => {
    if (
      monthExpenses.length === 0 &&
      selectedPeriod === "month"
    ) {
      return [];
    }

    // =========================================
    // LAST 5 MONTHS
    // =========================================

    if (selectedPeriod === "year") {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const periods = [];

      for (let i = 4; i >= 0; i--) {
        const d = new Date(
          selectedYearNum,
          selectedMonthIndex - i,
          1
        );

        periods.push({
          month: d.getMonth(),
          year: d.getFullYear(),
          label: months[d.getMonth()],
          amount: 0,
        });
      }

      expenses.forEach((expense) => {
        const d = parseExpenseDate(
          expense.date
        );

        if (!d) return;

        const match = periods.find(
          (period) =>
            period.month ===
              d.getMonth() &&
            period.year ===
              d.getFullYear()
        );

        if (match) {
          match.amount += Number(
            expense.userShare ??
              expense.amount ??
              0
          );
        }
      });

      const maxAmount = Math.max(
        ...periods.map(
          (period) => period.amount
        ),
        1
      );

      const totalPeriodSpend =
        periods.reduce(
          (sum, period) =>
            sum + period.amount,
          0
        );

      if (totalPeriodSpend === 0) {
        return [];
      }

      return periods.map(
        (period, index) => ({
          label: period.label,
          amount: period.amount,
          heightPercent:
            period.amount > 0
              ? Math.max(
                  15,
                  Math.round(
                    (period.amount /
                      maxAmount) *
                      100
                  )
                )
              : 8,
          isCurrent:
            index ===
            periods.length - 1,
        })
      );
    }

    // =========================================
    // LAST 3 MONTHS
    // =========================================

    if (selectedPeriod === "3months") {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];

      const periods = [];

      for (let i = 2; i >= 0; i--) {
        const d = new Date(
          selectedYearNum,
          selectedMonthIndex - i,
          1
        );

        periods.push({
          month: d.getMonth(),
          year: d.getFullYear(),
          label: months[d.getMonth()],
          amount: 0,
        });
      }

      expenses.forEach((expense) => {
        const d = parseExpenseDate(
          expense.date
        );

        if (!d) return;

        const match = periods.find(
          (period) =>
            period.month ===
              d.getMonth() &&
            period.year ===
              d.getFullYear()
        );

        if (match) {
          match.amount += Number(
            expense.userShare ??
              expense.amount ??
              0
          );
        }
      });

      const maxAmount = Math.max(
        ...periods.map(
          (period) => period.amount
        ),
        1
      );

      const totalPeriodSpend =
        periods.reduce(
          (sum, period) =>
            sum + period.amount,
          0
        );

      if (totalPeriodSpend === 0) {
        return [];
      }

      return periods.map(
        (period, index) => ({
          label: period.label,
          amount: period.amount,
          heightPercent:
            period.amount > 0
              ? Math.max(
                  15,
                  Math.round(
                    (period.amount /
                      maxAmount) *
                      100
                  )
                )
              : 8,
          isCurrent:
            index ===
            periods.length - 1,
        })
      );
    }

    // =========================================
    // SELECTED MONTH - WEEKLY BUCKETS
    // =========================================

    const buckets = [
      {
        label: "1-7",
        amount: 0,
      },
      {
        label: "8-14",
        amount: 0,
      },
      {
        label: "15-21",
        amount: 0,
      },
      {
        label: "22-28",
        amount: 0,
      },
      {
        label: "29-31",
        amount: 0,
      },
    ];

    monthExpenses.forEach((expense) => {
      const d = parseExpenseDate(
        expense.date
      );

      if (!d) return;

      const day = d.getDate();

      const amount = Number(
        expense.userShare ??
          expense.amount ??
          0
      );

      if (day <= 7) {
        buckets[0].amount += amount;
      } else if (day <= 14) {
        buckets[1].amount += amount;
      } else if (day <= 21) {
        buckets[2].amount += amount;
      } else if (day <= 28) {
        buckets[3].amount += amount;
      } else {
        buckets[4].amount += amount;
      }
    });

    const maxAmount = Math.max(
      ...buckets.map(
        (bucket) => bucket.amount
      ),
      1
    );

    return buckets.map(
      (bucket, index) => ({
        label: bucket.label,
        amount: bucket.amount,
        heightPercent:
          bucket.amount > 0
            ? Math.max(
                15,
                Math.round(
                  (bucket.amount /
                    maxAmount) *
                    100
                )
              )
            : 8,
        isCurrent: index === 0,
      })
    );
  }, [
    expenses,
    monthExpenses,
    selectedPeriod,
    selectedYearNum,
    selectedMonthIndex,
  ]);

  // =========================================
  // RECENT EXPENSES
  // =========================================

  const recentExpenses = useMemo(() => {
    return [...monthExpenses]
      .sort((a, b) => {
        const dateA = a.date
          ? new Date(a.date).getTime()
          : 0;

        const dateB = b.date
          ? new Date(b.date).getTime()
          : 0;

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [monthExpenses]);

  // =========================================
  // CATEGORY ICON
  // =========================================

  const getCategoryIcon = (category) => {
    const cat =
      (category || "").toLowerCase();

    if (
      cat.includes("food") ||
      cat.includes("dinner") ||
      cat.includes("lunch")
    ) {
      return "🍔";
    }

    if (
      cat.includes("travel") ||
      cat.includes("flight") ||
      cat.includes("trip")
    ) {
      return "✈️";
    }

    if (
      cat.includes("shop") ||
      cat.includes("cloth")
    ) {
      return "🛍️";
    }

    if (
      cat.includes("bill") ||
      cat.includes("electric") ||
      cat.includes("rent") ||
      cat.includes("housing")
    ) {
      return "💡";
    }

    if (
      cat.includes("entertain") ||
      cat.includes("movie")
    ) {
      return "🎬";
    }

    if (
      cat.includes("cab") ||
      cat.includes("uber") ||
      cat.includes("taxi")
    ) {
      return "🚕";
    }

    return "📦";
  };

  // =========================================
  // DATE FORMATTER
  // =========================================

  const formatDateDisplay = (
    dateString
  ) => {
    if (!dateString) {
      return "Recently";
    }

    const d = new Date(dateString);

    if (isNaN(d.getTime())) {
      return "Recently";
    }

    return d.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    );
  };

  // =========================================
  // LOADING STATE
  // =========================================

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>

          <p>
            Loading your financial
            overview...
          </p>
        </div>
      </div>
    );
  }

  // =========================================
  // ERROR STATE
  // =========================================

  if (
    error &&
    expenses.length === 0 &&
    payments.length === 0
  ) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-error-card">
          <div className="error-icon">
            ⚠️
          </div>

          <h2>
            Unable to Load Dashboard
          </h2>

          <p>{error}</p>

          <button
            className="retry-button"
            onClick={fetchDashboardData}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // =========================================
  // MAIN DASHBOARD
  // =========================================

  return (
    <div className="dashboard-page">

      {/* =====================================
          DASHBOARD HEADER
      ====================================== */}

      <section className="dashboard-header">

        <div className="greeting-block">

          <h1 className="welcome-title">
            Welcome back, Devanshi
          </h1>

          <p className="welcome-subtitle">
            Here's your spending overview
            for {selectedMonthName}.
          </p>

        </div>

        <div className="month-selector-badge">

          <span className="calendar-icon">
            📅
          </span>

          <select
            className="month-dropdown"
            value={selectedMonthYear}
            onChange={(e) =>
              setSelectedMonthYear(
                e.target.value
              )
            }
            aria-label="Select month"
          >
            {availableMonths.map(
              (month) => (
                <option
                  key={month.value}
                  value={month.value}
                >
                  {month.label}
                </option>
              )
            )}
          </select>

        </div>

      </section>

      {/* =====================================
          PRIMARY ACTIONS
      ====================================== */}

      <section className="primary-actions-row">

        {/* Add Expense */}

        <button
          className="action-card action-primary"
          onClick={() =>
            navigate("/add-expense")
          }
          aria-label="Add Expense"
        >

          <div className="action-icon-wrapper primary-icon-wrapper">
            <span>＋</span>
          </div>

          <div className="action-text-content">
            <strong>
              Add Expense
            </strong>

            <span>
              Record something you spent
            </span>
          </div>

        </button>

        {/* Split Bill */}

        <button
          className="action-card action-secondary split-card"
          onClick={() =>
            navigate("/split-bill")
          }
          aria-label="Split a Bill"
        >

          <div className="action-icon-wrapper split-icon-wrapper">
            <span>↗</span>
          </div>

          <div className="action-text-content">

            <strong>
              Split a Bill
            </strong>

            <span>
              Divide costs with friends
            </span>

          </div>

        </button>

        {/* Pay Someone */}

        <button
          className="action-card action-secondary pay-card"
          onClick={() =>
            navigate("/payments")
          }
          aria-label="Pay Someone"
        >

          <div className="action-icon-wrapper pay-icon-wrapper">
            <span>₹</span>
          </div>

          <div className="action-text-content">

            <strong>
              Pay Someone
            </strong>

            <span>
              Settle a payment instantly
            </span>

          </div>

        </button>

      </section>

      {/* =====================================
          SPENDING SUMMARY
      ====================================== */}

      <section className="spending-summary-card">

        {/* Total */}

        <div className="summary-col total-spent-col">

          <span className="summary-label">
            TOTAL SPENT
          </span>

          <div className="total-amount-display">
            ₹
            {totalSpent.toLocaleString(
              "en-IN"
            )}
          </div>

          {comparisonInfo && (
            <div
              className={`comparison-tag ${
                comparisonInfo.isPositive
                  ? "positive"
                  : ""
              }`}
            >
              {comparisonInfo.text}
            </div>
          )}

        </div>

        <div className="summary-vertical-divider"></div>

        {/* To Pay */}

        <div className="summary-col secondary-col">

          <span className="summary-label">
            TO PAY
          </span>

          <div className="secondary-amount-display to-pay-color">
            ₹
            {toPayTotal.toLocaleString(
              "en-IN"
            )}
          </div>

          <small className="summary-subtext">
            {toPayList.length === 0
              ? "All caught up"
              : `${toPayList.length} person${
                  toPayList.length === 1
                    ? ""
                    : "s"
                } to pay`}
          </small>

        </div>

        <div className="summary-vertical-divider"></div>

        {/* To Collect */}

        <div className="summary-col secondary-col">

          <span className="summary-label">
            TO COLLECT
          </span>

          <div className="secondary-amount-display to-collect-color">
            ₹
            {toCollectTotal.toLocaleString(
              "en-IN"
            )}
          </div>

          <small className="summary-subtext">
            {toCollectList.length === 0
              ? "None pending"
              : `${toCollectList.length} person${
                  toCollectList.length === 1
                    ? ""
                    : "s"
                } to collect from`}
          </small>

        </div>

      </section>

      {/* =====================================
          MAIN GRID
      ====================================== */}

      <section className="dashboard-main-grid">

        {/* ===================================
            SPENDING TREND
        ==================================== */}

        <div className="grid-card trend-card">

          <div className="card-header-row">

            <div>

              <h2 className="card-heading">
                Spending Trend
              </h2>

              <p className="card-subheading">
                See how your spending
                changes over time
              </p>

            </div>

            <div className="period-selector-container">

              <select
                className="period-select"
                value={selectedPeriod}
                onChange={(e) =>
                  setSelectedPeriod(
                    e.target.value
                  )
                }
                aria-label="Select spending period"
              >

                <option value="month">
                  This Month ({selectedMonthName})
                </option>

                <option value="3months">
                  Last 3 Months
                </option>

                <option value="year">
                  This Year ({selectedYearNum})
                </option>

              </select>

            </div>

          </div>

          <div className="trend-content-layout">

            {/* Chart */}

            <div className="chart-container">

              {chartBars.length === 0 ||
              monthExpenses.length === 0 ? (

                <div className="empty-trend-placeholder">

                  <div className="empty-trend-icon">
                    📊
                  </div>

                  <strong>
                    No expenses recorded yet
                  </strong>

                  <p>
                    Your spending trend
                    will appear here once
                    you add an expense for{" "}
                    {selectedMonthName}.
                  </p>

                </div>

              ) : (

                <div className="bars-track">

                  {chartBars.map(
                    (bar, index) => (

                      <div
                        className="bar-column"
                        key={index}
                      >

                        <div className="bar-wrapper">

                          <div
                            className={`chart-bar-pillar ${
                              bar.isCurrent
                                ? "current-pillar"
                                : ""
                            }`}
                            style={{
                              height: `${bar.heightPercent}%`,
                            }}
                          >

                            <div className="bar-tooltip">

                              ₹
                              {Number(
                                bar.amount
                              ).toLocaleString(
                                "en-IN"
                              )}

                            </div>

                          </div>

                        </div>

                        <span className="bar-label">
                          {bar.label}
                        </span>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

            {/* Category Breakdown */}

            <div className="category-breakdown-panel">

              <h3 className="breakdown-title">
                Category Breakdown
              </h3>

              {categoryBreakdown.length ===
              0 ? (

                <div className="empty-category-notice">

                  <span>
                    No category breakdown
                    for{" "}
                    {selectedMonthName}
                  </span>

                </div>

              ) : (

                <div className="category-list">

                  {categoryBreakdown.map(
                    (category, index) => (

                      <div
                        className="category-item"
                        key={index}
                      >

                        <div className="category-meta">

                          <span
                            className={`category-dot dot-${category.colorClass}`}
                          ></span>

                          <span className="category-name">
                            {category.name}
                          </span>

                        </div>

                        <strong className="category-percent">
                          {category.percentage}%
                        </strong>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </div>

        </div>

        {/* ===================================
            PENDING BALANCES
        ==================================== */}

        <div className="grid-card balances-card">

          <div className="card-header-row">

            <div>

              <h2 className="card-heading">
                Pending Balances
              </h2>

              <p className="card-subheading">
                Track incoming and outgoing
                debts
              </p>

            </div>

          </div>

          <div className="balances-body">

            {toCollectList.length === 0 &&
            toPayList.length === 0 ? (

              <div className="balances-settled-state">

                <div className="settled-check-icon">
                  ✓
                </div>

                <strong>
                  You're all settled
                </strong>

                <p>
                  No payments are currently
                  pending for{" "}
                  {selectedMonthName}.
                </p>

              </div>

            ) : (

              <>

                {/* TO COLLECT */}

                {toCollectList.length > 0 && (

                  <div className="balance-group">

                    <span className="balance-group-title collect-title">
                      TO COLLECT
                    </span>

                    <div className="balance-rows-list">

                      {toCollectList.map(
                        (payment) => {

                          const paymentId =
                            payment.paymentId ||
                            payment.id;

                          const personName =
                            payment.fromUserName ||
                            payment.fromUser?.name ||
                            "Group Member";

                          const avatarInitial =
                            personName
                              .charAt(0)
                              .toUpperCase();

                          const isReminded =
                            remindedPayments[
                              paymentId
                            ];

                          const isSending =
                            remindingId ===
                            paymentId;

                          return (

                            <div
                              className="balance-row"
                              key={paymentId}
                            >

                              <div className="balance-avatar avatar-teal">
                                {avatarInitial}
                              </div>

                              <div className="balance-person-info">

                                <strong>
                                  {personName}
                                </strong>

                                <span>
                                  Owes you ₹
                                  {Number(
                                    payment.amount ||
                                      0
                                  ).toLocaleString(
                                    "en-IN"
                                  )}
                                </span>

                              </div>

                              <button
                                className={`balance-btn remind-btn ${
                                  isReminded
                                    ? "reminded"
                                    : ""
                                }`}
                                onClick={() =>
                                  handleSendReminder(
                                    payment
                                  )
                                }
                                disabled={
                                  isReminded ||
                                  isSending
                                }
                                title="Send reminder to this person"
                              >

                                {isSending
                                  ? "Sending..."
                                  : isReminded
                                  ? "Sent ✓"
                                  : "Remind"}

                              </button>

                            </div>

                          );
                        }
                      )}

                    </div>

                  </div>

                )}

                {/* TO PAY */}

                {toPayList.length > 0 && (

                  <div className="balance-group">

                    <span className="balance-group-title pay-title">
                      TO PAY
                    </span>

                    <div className="balance-rows-list">

                      {toPayList.map(
                        (payment) => {

                          const paymentId =
                            payment.paymentId ||
                            payment.id;

                          const personName =
                            payment.toUserName ||
                            payment.toUser?.name ||
                            "Group Member";

                          const avatarInitial =
                            personName
                              .charAt(0)
                              .toUpperCase();

                          return (

                            <div
                              className="balance-row"
                              key={paymentId}
                            >

                              <div className="balance-avatar avatar-peach">
                                {avatarInitial}
                              </div>

                              <div className="balance-person-info">

                                <strong>
                                  {personName}
                                </strong>

                                <span>
                                  You owe ₹
                                  {Number(
                                    payment.amount ||
                                      0
                                  ).toLocaleString(
                                    "en-IN"
                                  )}
                                </span>

                              </div>

                              <button
                                className="balance-btn pay-btn"
                                onClick={() =>
                                  navigate(
                                    "/payments"
                                  )
                                }
                                title="Go to payments to settle"
                              >
                                Pay
                              </button>

                            </div>

                          );
                        }
                      )}

                    </div>

                  </div>

                )}

              </>

            )}

          </div>

        </div>

      </section>

      {/* =====================================
          RECENT ACTIVITY
      ====================================== */}

      <section className="grid-card recent-activity-card">

        <div className="card-header-row">

          <div>

            <h2 className="card-heading">
              Recent Activity
            </h2>

            <p className="card-subheading">
              Transactions recorded in{" "}
              {selectedMonthName}
            </p>

          </div>

          <button
            className="view-all-link-btn"
            onClick={() =>
              navigate("/expenses")
            }
          >
            View all expenses →
          </button>

        </div>

        <div className="activity-list-container">

          {recentExpenses.length === 0 ? (

            <div className="empty-expenses-state">

              <div className="empty-icon">
                📂
              </div>

              <strong>
                No expenses recorded
                this month
              </strong>

              <p>
                Add your first expense for{" "}
                {selectedMonthName} to start
                tracking your spending.
              </p>

              <button
                className="add-first-expense-btn"
                onClick={() =>
                  navigate(
                    "/add-expense"
                  )
                }
              >
                ＋ Add Expense
              </button>

            </div>

          ) : (

            <div className="activity-table">

              {recentExpenses.map(
                (expense, index) => {

                  const isGroup =
                    Boolean(
                      expense.groupExpense
                    );

                  const userShare =
                    Number(
                      expense.userShare ??
                        expense.amount ??
                        0
                    );

                  const icon =
                    getCategoryIcon(
                      expense.category
                    );

                  return (

                    <div
                      className="activity-row-item"
                      key={
                        expense.id ??
                        `recent-exp-${index}`
                      }
                    >

                      <div className="activity-left-cluster">

                        <div className="activity-category-icon">
                          {icon}
                        </div>

                        <div className="activity-details">

                          <strong className="activity-title">
                            {expense.title ||
                              "Expense"}
                          </strong>

                          <div className="activity-tags-row">

                            <span
                              className={`badge-label ${
                                isGroup
                                  ? "badge-group"
                                  : "badge-personal"
                              }`}
                            >
                              {isGroup
                                ? "GROUP"
                                : "PERSONAL"}
                            </span>

                            <span className="activity-date">
                              {formatDateDisplay(
                                expense.date
                              )}
                            </span>

                          </div>

                        </div>

                      </div>

                      <div className="activity-right-cluster">

                        <strong className="activity-amount-text">
                          ₹
                          {userShare.toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                        <span className="activity-status-pill paid-pill">
                          {isGroup
                            ? "Split"
                            : "Paid"}
                        </span>

                      </div>

                    </div>

                  );
                }
              )}

            </div>

          )}

        </div>

      </section>

    </div>
  );
}

export default Dashboard;