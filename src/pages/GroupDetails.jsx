import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./GroupDetails.css";
import api from "../services/api";

const CURRENT_USER_ID = 1;

function GroupDetails({ groupId: propGroupId, onBack }) {
  const { groupId: routeGroupId } = useParams();
  const navigate = useNavigate();

  const effectiveGroupId = propGroupId || routeGroupId;

  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [settlingId, setSettlingId] = useState(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/groups");
    }
  };

  // =========================================
  // CREATE PAYMENT FROM SETTLEMENT
  // =========================================
  const createPaymentFromSettlement = async (settlement, idx) => {
    const settlementKey = settlement.id || idx;

    try {
      setSettlingId(settlementKey);
      setError("");

      // IMPORTANT:
      // Use api.js instead of fetch().
      // api.js automatically adds:
      // Authorization: Bearer <JWT>
      await api.post(
        `/payments/from-settlement?groupId=${effectiveGroupId}&fromUserId=${settlement.fromUserId}&toUserId=${settlement.toUserId}&amount=${settlement.amount}`
      );

      // Reload payments, settlements and balances
      const [
        paymentsRes,
        settlementsRes,
        balancesRes,
      ] = await Promise.all([
        api.get("/payments"),
        api.get(
          `/groups/${effectiveGroupId}/settlements`
        ),
        api.get(
          `/groups/${effectiveGroupId}/balances`
        ),
      ]);

      const allPayments = Array.isArray(
        paymentsRes.data
      )
        ? paymentsRes.data
        : [];

      setPayments(
        allPayments.filter(
          (p) =>
            p.group &&
            Number(p.group.id) ===
              Number(effectiveGroupId)
        )
      );

      setSettlements(
        Array.isArray(settlementsRes.data)
          ? settlementsRes.data
          : []
      );

      setBalances(
        Array.isArray(balancesRes.data)
          ? balancesRes.data
          : []
      );
    } catch (err) {
      console.error(
        "Error creating payment from settlement:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else if (err.response?.status === 403) {
        setError(
          "You are not authorized to create this payment."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Could not create payment from settlement."
        );
      }
    } finally {
      setSettlingId(null);
    }
  };

  // =========================================
  // LOAD GROUP DATA
  // =========================================
  useEffect(() => {
    if (!effectiveGroupId) {
      setError("No group selected.");
      setLoading(false);
      return;
    }

    let ignore = false;

    const loadGroupData = async () => {
      setLoading(true);
      setError("");

      try {
        // ALL requests go through api.js
        // JWT will automatically be attached.
        const [
          groupRes,
          expensesRes,
          balancesRes,
          settlementsRes,
          paymentsRes,
        ] = await Promise.all([
          api.get(
            `/groups/${effectiveGroupId}`
          ),

          api.get(
            `/expenses/group/${effectiveGroupId}`
          ),

          api.get(
            `/groups/${effectiveGroupId}/balances`
          ),

          api.get(
            `/groups/${effectiveGroupId}/settlements`
          ),

          api.get("/payments"),
        ]);

        const groupData = groupRes.data;

        const expenseData =
          expensesRes.data || [];

        const balanceData =
          balancesRes.data || [];

        const settlementData =
          settlementsRes.data || [];

        const paymentData =
          paymentsRes.data || [];

        if (!ignore) {
          setGroup(groupData);

          setExpenses(
            Array.isArray(expenseData)
              ? expenseData
              : []
          );

          setBalances(
            Array.isArray(balanceData)
              ? balanceData
              : []
          );

          setSettlements(
            Array.isArray(settlementData)
              ? settlementData
              : []
          );

          setPayments(
            Array.isArray(paymentData)
              ? paymentData.filter(
                  (p) =>
                    p.group &&
                    Number(p.group.id) ===
                      Number(effectiveGroupId)
                )
              : []
          );

          setLoading(false);
        }
      } catch (err) {
        console.error(
          "Error loading group:",
          err
        );

        if (!ignore) {
          if (err.response?.status === 401) {
            setError(
              "Your session has expired. Please login again."
            );
          } else if (
            err.response?.status === 403
          ) {
            setError(
              "You are not authorized to access this group."
            );
          } else {
            setError(
              err.response?.data?.message ||
                err.message ||
                "Unable to load group."
            );
          }

          setLoading(false);
        }
      }
    };

    loadGroupData();

    return () => {
      ignore = true;
    };
  }, [effectiveGroupId]);

  // =========================================
  // FORMAT DATE
  // =========================================
  const formatDate = (dateString) => {
    if (!dateString) return "Recently";

    const d = new Date(dateString);

    if (isNaN(d)) return "Recently";

    return d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // =========================================
  // TOTAL GROUP SPENDING
  // =========================================
  const totalGroupSpending = expenses.reduce(
    (total, exp) =>
      total + Number(exp.amount || 0),
    0
  );

  // =========================================
  // USER'S BALANCE IN THIS GROUP
  // =========================================
  const myBalance = balances.find(
    (b) =>
      Number(b.userId) === CURRENT_USER_ID
  );

  const balanceAmount = myBalance
    ? Number(myBalance.balance || 0)
    : 0;

  // =========================================
  // CATEGORY ICON
  // =========================================
  const getCategoryIcon = (category) => {
    const cat = (category || "").toLowerCase();

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
      cat.includes("cab")
    ) {
      return "✈️";
    }

    if (cat.includes("shop")) {
      return "🛍️";
    }

    if (
      cat.includes("bill") ||
      cat.includes("rent")
    ) {
      return "💡";
    }

    return "📦";
  };

  // =========================================
  // AVATAR COLOR
  // =========================================
  const getAvatarBgClass = (idx) => {
    const classes = [
      "bg-mint",
      "bg-peach",
      "bg-blue",
      "bg-coral",
      "bg-pale",
    ];

    return classes[idx % classes.length];
  };

  // =========================================
  // LOADING STATE
  // =========================================
  if (loading) {
    return (
      <div className="group-details-page">
        <div className="group-details-loading">
          <div className="group-details-spinner"></div>
          <p>Loading group overview...</p>
        </div>
      </div>
    );
  }

  // =========================================
  // ERROR STATE
  // =========================================
  if (error || !group) {
    return (
      <div className="group-details-page">
        <div className="group-details-error-card">
          <div className="error-icon">
            ⚠️
          </div>

          <h2>Unable to Load Group</h2>

          <p>
            {error ||
              "Group information could not be retrieved."}
          </p>

          <button
            onClick={handleBack}
            className="details-back-action-btn"
          >
            ← Back to Groups
          </button>
        </div>
      </div>
    );
  }

  // =========================================
  // MAIN UI
  // =========================================
  return (
    <div className="group-details-page">

      {/* HEADER */}
      <div className="group-details-header">

        <div className="details-header-left">

          <button
            className="details-back-nav-btn"
            onClick={handleBack}
            aria-label="Back"
          >
            ←
          </button>

          <div>

            <div className="group-header-title-row">

              <h1>{group.name}</h1>

              <span className="members-count-badge">
                {group.users?.length || 0} members
              </span>

            </div>

            <p>
              Shared budget & active expense settlements
            </p>

          </div>

        </div>

        <button
          className="add-group-expense-btn"
          onClick={() =>
            navigate("/add-expense")
          }
        >
          <span>＋</span>
          <span>Add Expense</span>
        </button>

      </div>

      {/* SUMMARY METRICS */}
      <div className="group-summary-cards-row">

        <div className="group-metric-card">

          <span className="metric-label">
            TOTAL SPENDING
          </span>

          <div className="metric-value">
            ₹
            {totalGroupSpending.toLocaleString(
              "en-IN"
            )}
          </div>

          <small className="metric-subtext">
            Overall expenses shared
          </small>

        </div>

        <div className="group-metric-card">

          <span className="metric-label">
            YOUR POSITION
          </span>

          <div
            className={`metric-value ${
              balanceAmount > 0
                ? "text-green"
                : balanceAmount < 0
                ? "text-coral"
                : "text-muted"
            }`}
          >
            {balanceAmount > 0
              ? `+₹${balanceAmount.toLocaleString(
                  "en-IN"
                )}`
              : balanceAmount < 0
              ? `-₹${Math.abs(
                  balanceAmount
                ).toLocaleString("en-IN")}`
              : "₹0"}
          </div>

          <small className="metric-subtext">
            {balanceAmount > 0
              ? "You will collect this"
              : balanceAmount < 0
              ? "You need to settle this"
              : "You are all settled up"}
          </small>

        </div>

        <div className="group-metric-card">

          <span className="metric-label">
            EXPENSES LOGGED
          </span>

          <div className="metric-value">
            {expenses.length}
          </div>

          <small className="metric-subtext">
            Total group transactions
          </small>

        </div>

      </div>

      {/* MEMBERS SECTION */}
      <section className="details-section-card">

        <div className="section-title-row">

          <h2>Group Members</h2>

          <span className="section-count">
            {group.users?.length || 0} participants
          </span>

        </div>

        <div className="members-chips-grid">

          {group.users?.map((user, idx) => (

            <div
              className="member-detail-chip"
              key={user.id || idx}
            >

              <div
                className={`member-avatar-circle ${getAvatarBgClass(
                  idx
                )}`}
              >
                {user.name
                  ? user.name
                      .charAt(0)
                      .toUpperCase()
                  : "U"}
              </div>

              <div className="member-text-info">

                <strong>
                  {user.name || "Member"}
                </strong>

                <span>
                  {user.email ||
                    "member@splitpay.app"}
                </span>

              </div>

            </div>

          ))}

        </div>

      </section>

      {/* BALANCES & SETTLEMENTS */}
      <div className="balances-settlements-grid">

        {/* BALANCES */}
        <section className="details-section-card">

          <div className="section-title-row">

            <div>

              <h2>Member Balances</h2>

              <p className="section-subtitle">
                Current net position of each member
              </p>

            </div>

          </div>

          {balances.length === 0 ? (

            <div className="empty-details-notice">
              <span>
                No balance data available yet
              </span>
            </div>

          ) : (

            <div className="balances-list-items">

              {balances.map((balance, idx) => {

                const amt = Number(
                  balance.balance || 0
                );

                return (

                  <div
                    className="balance-item-row"
                    key={
                      balance.userId || idx
                    }
                  >

                    <div className="balance-member-left">

                      <div
                        className={`mini-avatar ${getAvatarBgClass(
                          idx
                        )}`}
                      >
                        {balance.userName
                          ? balance.userName
                              .charAt(0)
                              .toUpperCase()
                          : "U"}
                      </div>

                      <span className="balance-member-name">

                        {balance.userName ||
                          "User"}

                        {Number(
                          balance.userId
                        ) ===
                        CURRENT_USER_ID
                          ? " (You)"
                          : ""}

                      </span>

                    </div>

                    <strong
                      className={`balance-amount-tag ${
                        amt > 0
                          ? "text-green"
                          : amt < 0
                          ? "text-coral"
                          : "text-muted"
                      }`}
                    >
                      {amt > 0
                        ? `+₹${amt.toLocaleString(
                            "en-IN"
                          )}`
                        : amt < 0
                        ? `-₹${Math.abs(
                            amt
                          ).toLocaleString(
                            "en-IN"
                          )}`
                        : "₹0"}
                    </strong>

                  </div>

                );

              })}

            </div>

          )}

        </section>

        {/* SUGGESTED SETTLEMENTS */}
        <section className="details-section-card">

          <div className="section-title-row">

            <div>

              <h2>
                Suggested Settlements
              </h2>

              <p className="section-subtitle">
                Optimal payments to clear group debts
              </p>

            </div>

          </div>

          {settlements.length === 0 ? (

            <div className="settled-status-box">

              <span className="settled-check">
                ✓
              </span>

              <strong>
                Everyone is settled up
              </strong>

              <p>
                No debt transfers are currently
                needed for this group.
              </p>

            </div>

          ) : (

            <div className="settlements-list-items">

              {settlements.map(
                (settlement, idx) => {

                  const settlementKey =
                    settlement.id || idx;

                  const isSettling =
                    settlingId ===
                    settlementKey;

                  return (

                    <div
                      className="settlement-item-card"
                      key={settlementKey}
                    >

                      <div className="settlement-direction-block">

                        <span className="payer-name">
                          {settlement.fromUserName ||
                            settlement.fromUser
                              ?.name ||
                            "Member"}
                        </span>

                        <span className="settle-arrow">
                          →
                        </span>

                        <span className="payee-name">
                          {settlement.toUserName ||
                            settlement.toUser
                              ?.name ||
                            "Member"}
                        </span>

                      </div>

                      <div className="settlement-action-right">

                        <strong className="settle-amount">
                          ₹
                          {Number(
                            settlement.amount || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                        <button
                          className="settle-btn-action"
                          onClick={() =>
                            createPaymentFromSettlement(
                              settlement,
                              idx
                            )
                          }
                          disabled={isSettling}
                        >
                          {isSettling
                            ? "Settling..."
                            : "Settle"}
                        </button>

                      </div>

                    </div>

                  );
                }
              )}

            </div>

          )}

        </section>

      </div>

      {/* GROUP EXPENSES LIST */}
      <section className="details-section-card">

        <div className="section-title-row">

          <div>

            <h2>
              Group Expense History
            </h2>

            <p className="section-subtitle">
              All transactions logged under this group
            </p>

          </div>

        </div>

        {expenses.length === 0 ? (

          <div className="empty-details-notice">

            <span>
              No expenses logged under this group
              yet. Click '+ Add Expense' to record
              one!
            </span>

          </div>

        ) : (

          <div className="group-expenses-table">

            {expenses
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.date || 0) -
                  new Date(a.date || 0)
              )
              .map((exp, idx) => {

                const yourShare = Number(
                  exp.userShare ??
                    Number(exp.amount || 0) /
                      (group.users?.length ||
                        1)
                );

                return (

                  <div
                    className="group-expense-row"
                    key={exp.id || idx}
                  >

                    <div className="expense-left-meta">

                      <div className="expense-cat-badge">
                        {getCategoryIcon(
                          exp.category
                        )}
                      </div>

                      <div>

                        <strong className="expense-title-text">
                          {exp.title ||
                            "Expense"}
                        </strong>

                        <div className="expense-sub-tags">

                          <span className="cat-pill">
                            {exp.category ||
                              "General"}
                          </span>

                          <span className="date-text">
                            {formatDate(
                              exp.date
                            )}
                          </span>

                        </div>

                      </div>

                    </div>

                    <div className="expense-right-meta">

                      <div className="total-bill-tag">

                        <small>
                          Total Bill
                        </small>

                        <span>
                          ₹
                          {Number(
                            exp.amount || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </span>

                      </div>

                      <div className="your-share-tag">

                        <small>
                          Your Share
                        </small>

                        <strong>
                          ₹
                          {yourShare.toLocaleString(
                            "en-IN"
                          )}
                        </strong>

                      </div>

                    </div>

                  </div>

                );

              })}

          </div>

        )}

      </section>

    </div>
  );
}

export default GroupDetails;