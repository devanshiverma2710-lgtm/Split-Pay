import { useEffect, useState, useMemo } from "react";
import "./Payments.css";
import api from "../services/api";

function Payments({ onBack }) {
  const [payments, setPayments] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Action states
  const [remindingId, setRemindingId] = useState(null);
  const [remindedMap, setRemindedMap] = useState({});

  // Payment Settlement Modal
  const [activePaymentModal, setActivePaymentModal] = useState(null);
  const [payingProcessing, setPayingProcessing] = useState(false);

  // =========================================================
  // CURRENT USER
  // =========================================================
  const getCurrentUserId = () => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        return 1;
      }

      const user = JSON.parse(storedUser);

      return user.id || user.userId || 1;
    } catch (err) {
      console.error("Unable to read current user:", err);
      return 1;
    }
  };

  // =========================================================
  // LOAD PAYMENTS + GROUPS
  // =========================================================
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // IMPORTANT:
      // Use api instead of fetch.
      // api.js automatically adds:
      // Authorization: Bearer <JWT>
      const [paymentsResponse, groupsResponse] =
        await Promise.all([
          api.get("/payments"),
          api.get("/groups"),
        ]);

      const paymentsData = Array.isArray(
        paymentsResponse.data
      )
        ? paymentsResponse.data
        : [];

      const groupsData = Array.isArray(
        groupsResponse.data
      )
        ? groupsResponse.data
        : [];

      setPayments(paymentsData);
      setGroups(groupsData);

    } catch (err) {
      console.error("Error loading payments:", err);

      if (
        err.response?.status === 401
      ) {
        setError(
          "Your session has expired. Please login again."
        );
      } else if (
        err.response?.status === 403
      ) {
        setError(
          "You are not authorized to access payments."
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load payments."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================
  useEffect(() => {
    loadData();
  }, []);

  // =========================================================
  // MARK PAYMENT AS PAID
  // =========================================================
  const handleConfirmPay = async (payment) => {
    const paymentId =
      payment.paymentId || payment.id;

    if (!paymentId) {
      return;
    }

    setPayingProcessing(true);

    try {
      // IMPORTANT:
      // api.put automatically attaches JWT.
      await api.put(
        `/payments/${paymentId}/paid`
      );

      // Reload latest payment data
      const paymentsResponse =
        await api.get("/payments");

      const latestPayments =
        Array.isArray(paymentsResponse.data)
          ? paymentsResponse.data
          : [];

      setPayments(latestPayments);

      setActivePaymentModal(null);

    } catch (err) {
      console.error(
        "Error completing payment:",
        err
      );

      if (err.response?.status === 403) {
        setError(
          "You are not authorized to mark this payment as paid."
        );
      } else if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to mark payment as paid."
        );
      }

    } finally {
      setPayingProcessing(false);
    }
  };

  // =========================================================
  // SEND REMINDER
  // =========================================================
  const handleSendReminder = async (payment) => {
    const paymentId =
      payment.paymentId || payment.id;

    if (!paymentId) {
      return;
    }

    try {
      setRemindingId(paymentId);
      setError("");

      // IMPORTANT:
      // api.post automatically attaches JWT.
      await api.post(
        `/reminders/payment/${paymentId}`
      );

      setRemindedMap((prev) => ({
        ...prev,
        [paymentId]: true,
      }));

    } catch (err) {
      console.error(
        "Failed to send reminder:",
        err
      );

      if (err.response?.status === 403) {
        setError(
          "You are not authorized to send this reminder."
        );
      } else if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to send reminder."
        );
      }

    } finally {
      setRemindingId(null);
    }
  };

  // =========================================================
  // SEPARATE TO PAY & TO COLLECT
  // =========================================================
  const currentUserId = getCurrentUserId();

  const toPayList = useMemo(() => {
    return payments.filter(
      (p) =>
        Number(p.fromUserId) ===
          Number(currentUserId) &&
        p.status !== "PAID"
    );
  }, [payments, currentUserId]);

  const toCollectList = useMemo(() => {
    return payments.filter(
      (p) =>
        Number(p.toUserId) ===
          Number(currentUserId) &&
        p.status !== "PAID"
    );
  }, [payments, currentUserId]);

  // =========================================================
  // DATE FORMAT
  // =========================================================
  const formatDate = (dateString) => {
    if (!dateString) {
      return "Recently";
    }

    const d = new Date(dateString);

    if (isNaN(d)) {
      return "Recently";
    }

    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // =========================================================
  // GROUP NAME
  // =========================================================
  const getGroupName = (payment) => {
    if (payment.groupName) {
      return payment.groupName;
    }

    if (payment.group?.name) {
      return payment.group.name;
    }

    const gId =
      payment.groupId ??
      payment.group_id;

    if (gId) {
      const match = groups.find(
        (g) =>
          Number(g.id) === Number(gId)
      );

      if (match) {
        return match.name;
      }
    }

    return "Personal Split";
  };

  // =========================================================
  // AVATAR COLOR
  // =========================================================
  const getAvatarBgClass = (idx) => {
    const classes = [
      "bg-mint",
      "bg-peach",
      "bg-blue",
      "bg-coral",
      "bg-pale",
    ];

    return classes[
      idx % classes.length
    ];
  };

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="payments-page">
        <div className="payments-loading-state">
          <div className="payments-spinner"></div>

          <p>
            Loading your payments and
            settlement balances...
          </p>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================
  return (
    <div className="payments-page">

      {/* HEADER */}
      <div className="payments-header">

        <div className="payments-header-left">

          {onBack && (
            <button
              className="back-nav-btn"
              onClick={onBack}
              aria-label="Back"
            >
              ←
            </button>
          )}

          <div>
            <h1>Payments</h1>

            <p>
              Track money you need to pay,
              collect, and your full
              transaction history
            </p>
          </div>

        </div>

      </div>

      {/* ERROR */}
      {error && (
        <div className="payments-error-banner">

          <span>
            ⚠️ {error}
          </span>

          <button
            className="retry-btn"
            onClick={loadData}
          >
            Retry
          </button>

        </div>
      )}

      {/* =====================================================
          TO PAY + TO COLLECT
      ====================================================== */}
      <div className="pending-payments-grid">

        {/* TO PAY */}
        <section className="payment-action-section-card">

          <div className="payment-section-heading">

            <div className="heading-title-group">

              <span className="section-indicator-dot dot-coral"></span>

              <h2>
                To Pay
              </h2>

            </div>

            <span className="pending-count-pill pill-coral">
              {toPayList.length} pending
            </span>

          </div>

          <div className="action-cards-list">

            {toPayList.length === 0 ? (

              <div className="section-settled-box">

                <span className="check-mark-circle">
                  ✓
                </span>

                <strong>
                  You're all caught up
                </strong>

                <p>
                  No outgoing payments
                  pending.
                </p>

              </div>

            ) : (

              toPayList.map((p, idx) => {

                const recipient =
                  p.toUserName ||
                  p.toUser?.name ||
                  "Member";

                const amount =
                  Number(p.amount || 0);

                const grpName =
                  getGroupName(p);

                return (
                  <div
                    className="payment-pending-row"
                    key={
                      p.paymentId ||
                      p.id ||
                      idx
                    }
                  >

                    <div className="person-avatar-block">

                      <div
                        className={`person-circle-avatar ${getAvatarBgClass(
                          idx
                        )}`}
                      >
                        {recipient
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="person-text-meta">

                        <strong className="person-name">
                          {recipient}
                        </strong>

                        <span className="group-badge-sub">
                          {grpName}
                        </span>

                      </div>

                    </div>

                    <div className="payment-action-cluster">

                      <strong className="amount-display-tag text-coral">
                        ₹
                        {amount.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                      <button
                        className="pay-action-btn"
                        onClick={() =>
                          setActivePaymentModal(
                            p
                          )
                        }
                      >
                        Pay Now
                      </button>

                    </div>

                  </div>
                );
              })
            )}

          </div>

        </section>

        {/* TO COLLECT */}
        <section className="payment-action-section-card">

          <div className="payment-section-heading">

            <div className="heading-title-group">

              <span className="section-indicator-dot dot-green"></span>

              <h2>
                To Collect
              </h2>

            </div>

            <span className="pending-count-pill pill-green">
              {toCollectList.length} pending
            </span>

          </div>

          <div className="action-cards-list">

            {toCollectList.length === 0 ? (

              <div className="section-settled-box">

                <span className="check-mark-circle">
                  ✓
                </span>

                <strong>
                  No pending collections
                </strong>

                <p>
                  Nobody currently owes
                  you money.
                </p>

              </div>

            ) : (

              toCollectList.map((p, idx) => {

                const payer =
                  p.fromUserName ||
                  p.fromUser?.name ||
                  "Member";

                const amount =
                  Number(p.amount || 0);

                const paymentId =
                  p.paymentId || p.id;

                const isReminded =
                  remindedMap[paymentId];

                const isSending =
                  remindingId ===
                  paymentId;

                const grpName =
                  getGroupName(p);

                return (
                  <div
                    className="payment-pending-row"
                    key={
                      paymentId || idx
                    }
                  >

                    <div className="person-avatar-block">

                      <div
                        className={`person-circle-avatar ${getAvatarBgClass(
                          idx + 2
                        )}`}
                      >
                        {payer
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="person-text-meta">

                        <strong className="person-name">
                          {payer}
                        </strong>

                        <span className="group-badge-sub">
                          {grpName}
                        </span>

                      </div>

                    </div>

                    <div className="payment-action-cluster">

                      <strong className="amount-display-tag text-green">
                        ₹
                        {amount.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                      <button
                        className={`remind-action-btn ${
                          isReminded
                            ? "reminded-state"
                            : ""
                        }`}
                        onClick={() =>
                          handleSendReminder(
                            p
                          )
                        }
                        disabled={
                          isReminded ||
                          isSending
                        }
                      >
                        {isSending
                          ? "Sending..."
                          : isReminded
                          ? "Reminded ✓"
                          : "Remind"}
                      </button>

                    </div>

                  </div>
                );
              })
            )}

          </div>

        </section>

      </div>

      {/* =====================================================
          PAYMENT HISTORY
      ====================================================== */}
      <section className="payment-history-card">

        <div className="history-header-row">

          <div>

            <h2>
              Payment History
            </h2>

            <p>
              Complete record of settled
              and pending transfers
            </p>

          </div>

          <span className="history-count-tag">
            {payments.length} total entries
          </span>

        </div>

        {payments.length === 0 ? (

          <div className="empty-history-box">
            <span>
              No payment records found yet.
            </span>
          </div>

        ) : (

          <div className="payment-history-table">

            <div className="table-header-row">

              <span>
                PARTICIPANTS
              </span>

              <span>
                GROUP
              </span>

              <span>
                DATE
              </span>

              <span>
                AMOUNT
              </span>

              <span className="text-right">
                STATUS
              </span>

            </div>

            {payments.map((p, idx) => {

              const fromName =
                p.fromUserName ||
                p.fromUser?.name ||
                "You";

              const toName =
                p.toUserName ||
                p.toUser?.name ||
                "Member";

              const isPaid =
                p.status === "PAID";

              const amount =
                Number(p.amount || 0);

              const grpName =
                getGroupName(p);

              return (
                <div
                  className="table-data-row"
                  key={
                    p.paymentId ||
                    p.id ||
                    idx
                  }
                >

                  <div className="participant-col">

                    <div
                      className={`mini-avatar ${getAvatarBgClass(
                        idx
                      )}`}
                    >
                      {fromName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="participant-names">

                      <strong>
                        {fromName}
                      </strong>

                      <span className="arrow-small">
                        →
                      </span>

                      <span>
                        {toName}
                      </span>

                    </div>

                  </div>

                  <div className="group-col">

                    <span className="group-name-tag">
                      {grpName}
                    </span>

                  </div>

                  <div className="date-col">

                    <span>
                      {formatDate(
                        p.paidAt ||
                          p.createdAt ||
                          p.date
                      )}
                    </span>

                  </div>

                  <div className="amount-col">

                    <strong>
                      ₹
                      {amount.toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>

                  <div className="status-col text-right">

                    <span
                      className={`status-pill ${
                        isPaid
                          ? "pill-paid"
                          : "pill-pending"
                      }`}
                    >
                      {isPaid
                        ? "Paid ✓"
                        : "Pending"}
                    </span>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </section>

      {/* =====================================================
          PAYMENT MODAL
      ====================================================== */}
      {activePaymentModal && (

        <div
          className="modal-backdrop"
          onClick={() =>
            setActivePaymentModal(null)
          }
        >

          <div
            className="modal-content"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <h2>
                Settle Payment
              </h2>

              <button
                className="modal-close-btn"
                onClick={() =>
                  setActivePaymentModal(null)
                }
              >
                ✕
              </button>

            </div>

            <div className="upi-payment-modal-body">

              <div className="upi-recipient-summary">

                <span className="upi-label">
                  PAYING TO
                </span>

                <h3>
                  {activePaymentModal.toUserName ||
                    activePaymentModal.toUser?.name ||
                    "Member"}
                </h3>

                <span className="upi-id-badge">
                  {(
                    activePaymentModal.toUserName ||
                    activePaymentModal.toUser?.name ||
                    "user"
                  )
                    .toLowerCase()
                    .replace(
                      /\s+/g,
                      ""
                    )}
                  @oksbi
                </span>

              </div>

              <div className="upi-amount-hero">

                <span className="currency-symbol">
                  ₹
                </span>

                <span className="amount-val">
                  {Number(
                    activePaymentModal.amount ||
                      0
                  ).toLocaleString(
                    "en-IN"
                  )}
                </span>

              </div>

              <div className="upi-meta-info">

                <div className="upi-meta-row">

                  <span>
                    Group
                  </span>

                  <strong>
                    {getGroupName(
                      activePaymentModal
                    )}
                  </strong>

                </div>

                <div className="upi-meta-row">

                  <span>
                    Payment Method
                  </span>

                  <strong>
                    Instant UPI / Net Banking
                  </strong>

                </div>

              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="modal-btn-secondary"
                  onClick={() =>
                    setActivePaymentModal(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="modal-btn-primary"
                  onClick={() =>
                    handleConfirmPay(
                      activePaymentModal
                    )
                  }
                  disabled={
                    payingProcessing
                  }
                >
                  {payingProcessing
                    ? "Processing..."
                    : "Confirm & Mark as Paid"}
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default Payments;