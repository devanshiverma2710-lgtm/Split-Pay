import { useEffect, useState } from "react";
import "./Reminders.css";
import api from "../services/api";

function Reminders({ onBack }) {
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingId, setSendingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // =========================================
  // GET CURRENT USER ID
  // =========================================
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

  const CURRENT_USER_ID = getCurrentUserId();

  // =========================================
  // FETCH PENDING PAYMENTS
  // =========================================
  const fetchPendingPayments = async () => {
    setLoading(true);
    setError("");

    try {
      // Uses api.js -> JWT automatically attached
      const response = await api.get("/payments");

      const payments = Array.isArray(response.data)
        ? response.data
        : [];

      console.log("Payments from backend:", payments);

      // Only payments where:
      // 1. Current user is receiving money
      // 2. Payment is not paid
      const pending = payments.filter(
        (payment) =>
          Number(payment.toUserId) === Number(CURRENT_USER_ID) &&
          payment.status !== "PAID"
      );

      // =========================================
      // CHECK EXISTING REMINDERS
      // =========================================
      const paymentsWithReminderStatus = await Promise.all(
        pending.map(async (payment) => {
          const paymentId =
            payment.paymentId || payment.id;

          try {
            // Uses api.js -> JWT automatically attached
            const reminderResponse = await api.get(
              `/reminders/payment/${paymentId}`
            );

            const reminders = Array.isArray(reminderResponse.data)
              ? reminderResponse.data
              : reminderResponse.data
              ? [reminderResponse.data]
              : [];

            return {
              ...payment,
              reminderSent: reminders.length > 0,
            };
          } catch (err) {
            console.error(
              `Error checking reminder for payment ${paymentId}:`,
              err
            );

            return {
              ...payment,
              reminderSent: false,
            };
          }
        })
      );

      console.log(
        "Pending payments:",
        paymentsWithReminderStatus
      );

      setPendingPayments(
        paymentsWithReminderStatus
      );
    } catch (err) {
      console.error(
        "Error fetching pending payments:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else if (err.response?.status === 403) {
        setError(
          "You are not authorized to access payment reminders."
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load pending payments."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // LOAD ON PAGE OPEN
  // =========================================
  useEffect(() => {
    fetchPendingPayments();
  }, []);

  // =========================================
  // SEND REMINDER
  // =========================================
  const sendReminder = async (paymentId) => {
    setSendingId(paymentId);
    setError("");
    setMessage("");

    try {
      // Uses api.js -> JWT automatically attached
      const response = await api.post(
        `/reminders/payment/${paymentId}`
      );

      console.log(
        "Reminder created:",
        response.data
      );

      // Update this payment in UI
      setPendingPayments((prev) =>
        prev.map((payment) => {
          const id =
            payment.paymentId || payment.id;

          return Number(id) === Number(paymentId)
            ? {
                ...payment,
                reminderSent: true,
              }
            : payment;
        })
      );

      setMessage(
        "Reminder sent successfully."
      );
    } catch (err) {
      console.error(
        "Error sending reminder:",
        err
      );

      if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else if (err.response?.status === 403) {
        setError(
          "You are not authorized to send this reminder."
        );
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to send reminder."
        );
      }
    } finally {
      setSendingId(null);
    }
  };

  // =========================================
  // FORMAT DATE
  // =========================================
  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =========================================
  // RENDER
  // =========================================
  return (
    <div className="reminders-page">
      <div className="reminders-container">

        {/* HEADER */}
        <div className="reminders-header">
          <div>

            {onBack && (
              <button
                className="back-button"
                onClick={onBack}
              >
                ← Back
              </button>
            )}

            <h1>Reminders</h1>

            <p>
              Remind people about their pending payments
            </p>

          </div>
        </div>

        {/* SUCCESS MESSAGE */}
        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="error-message">
            {error}

            <button
              type="button"
              onClick={fetchPendingPayments}
              style={{ marginLeft: "12px" }}
            >
              Retry
            </button>
          </div>
        )}

        {/* PENDING PAYMENTS */}
        <div className="reminders-section">

          <div className="section-heading">
            <div>

              <h2>
                People who haven't paid
              </h2>

              <p>
                Send a reminder for your pending payments
              </p>

            </div>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="reminder-empty">
              <p>
                Loading pending payments...
              </p>
            </div>
          )}

          {/* NO PENDING PAYMENTS */}
          {!loading &&
            pendingPayments.length === 0 &&
            !error && (
              <div className="reminder-empty">

                <div className="empty-icon">
                  ✓
                </div>

                <h3>
                  You're all settled!
                </h3>

                <p>
                  Nobody currently owes you any money.
                </p>

              </div>
            )}

          {/* PAYMENT LIST */}
          {!loading &&
            pendingPayments.length > 0 && (
              <div className="reminders-list">

                {pendingPayments.map(
                  (payment) => {
                    const paymentId =
                      payment.paymentId ||
                      payment.id;

                    const fromUserName =
                      payment.fromUserName ||
                      payment.fromUser?.name ||
                      "Member";

                    return (
                      <div
                        className="reminder-card"
                        key={paymentId}
                      >

                        {/* ICON */}
                        <div className="reminder-icon">
                          ₹
                        </div>

                        {/* PERSON + PAYMENT INFO */}
                        <div className="reminder-info">

                          <h3>
                            {fromUserName}
                          </h3>

                          <p>
                            owes you ₹
                            {Number(
                              payment.amount || 0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </p>

                          <p>
                            Payment #{paymentId}

                            {payment.paidAt &&
                              ` • ${formatDate(
                                payment.paidAt
                              )}`}
                          </p>

                        </div>

                        {/* ACTION */}
                        <div className="reminder-action">

                          {payment.reminderSent ? (

                            <button
                              className="reminder-sent-button"
                              disabled
                            >
                              ✓ Reminder Sent
                            </button>

                          ) : (

                            <button
                              className="send-reminder-button"
                              onClick={() =>
                                sendReminder(
                                  paymentId
                                )
                              }
                              disabled={
                                sendingId ===
                                paymentId
                              }
                            >

                              {sendingId === paymentId
                                ? "Sending..."
                                : "Send Reminder"}

                            </button>

                          )}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

        </div>

      </div>
    </div>
  );
}

export default Reminders;