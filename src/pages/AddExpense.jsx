import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./AddExpense.css";
import api from "../services/api";

function AddExpense({ onBack }) {
  const navigate = useNavigate();
  const location = useLocation();

  // =========================================
  // FORM STATE
  // =========================================

  const [expenseType, setExpenseType] = useState("personal");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");

  // =========================================
  // GROUP SPLIT STATE
  // =========================================

  const [groups, setGroups] = useState([]);

  const [selectedGroupId, setSelectedGroupId] = useState(
    location.state?.groupId || ""
  );

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [splitMethod, setSplitMethod] = useState("equally");
  const [customShares, setCustomShares] = useState({});

  // =========================================
  // STATUS
  // =========================================

  const [loadingGroups, setLoadingGroups] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // =========================================
  // CATEGORIES
  // =========================================

  const categories = [
    { name: "Food", icon: "🍔" },
    { name: "Travel", icon: "🚕" },
    { name: "Shopping", icon: "🛍️" },
    { name: "Housing", icon: "💡" },
    { name: "Entertainment", icon: "🎬" },
    { name: "Other", icon: "📦" },
  ];

  // =========================================
  // FETCH GROUPS
  // =========================================

  useEffect(() => {
    let ignore = false;

    const fetchGroups = async () => {
      setLoadingGroups(true);

      try {
        // IMPORTANT:
        // Use api instead of fetch.
        // api.js automatically attaches JWT.

        const response = await api.get("/groups");

        const data = Array.isArray(response.data)
          ? response.data
          : [];

        if (!ignore) {
          setGroups(data);

          if (
            data.length > 0 &&
            !selectedGroupId
          ) {
            setSelectedGroupId(data[0].id);
          }
        }
      } catch (err) {
        console.error(
          "Error loading groups:",
          err
        );

        if (!ignore) {
          if (err.response?.status === 401) {
            setErrorMessage(
              "Your session has expired. Please login again."
            );
          } else if (err.response?.status === 403) {
            setErrorMessage(
              "You are not authorized to access your groups."
            );
          } else {
            setErrorMessage(
              err.response?.data?.message ||
                "Unable to load groups."
            );
          }
        }
      } finally {
        if (!ignore) {
          setLoadingGroups(false);
        }
      }
    };

    fetchGroups();

    return () => {
      ignore = true;
    };
  }, []);

  // =========================================
  // UPDATE SELECTED GROUP
  // =========================================

  useEffect(() => {
    if (
      selectedGroupId &&
      groups.length > 0
    ) {
      const found = groups.find(
        (group) =>
          Number(group.id) ===
          Number(selectedGroupId)
      );

      setSelectedGroup(found || null);

      if (found?.users) {
        setSelectedUserIds(
          found.users.map(
            (user) => user.id
          )
        );
      }
    }
  }, [selectedGroupId, groups]);

  // =========================================
  // GROUP SELECT
  // =========================================

  const handleGroupSelect = (groupId) => {
    setSelectedGroupId(groupId);

    const found = groups.find(
      (group) =>
        Number(group.id) ===
        Number(groupId)
    );

    setSelectedGroup(found || null);

    if (found?.users) {
      setSelectedUserIds(
        found.users.map(
          (user) => user.id
        )
      );

      setCustomShares({});
    }
  };

  // =========================================
  // TOGGLE USER
  // =========================================

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        if (prev.length <= 1) {
          return prev;
        }

        return prev.filter(
          (id) => id !== userId
        );
      }

      return [...prev, userId];
    });
  };

  // =========================================
  // SPLIT CALCULATIONS
  // =========================================

  const numericAmount =
    parseFloat(amount) || 0;

  const activeMembers = useMemo(() => {
    if (
      !selectedGroup ||
      !selectedGroup.users
    ) {
      return [];
    }

    return selectedGroup.users.filter(
      (user) =>
        selectedUserIds.includes(user.id)
    );
  }, [
    selectedGroup,
    selectedUserIds,
  ]);

  const splitPreview = useMemo(() => {
    if (
      activeMembers.length === 0 ||
      numericAmount <= 0
    ) {
      return [];
    }

    // =========================================
    // EQUALLY
    // =========================================

    if (splitMethod === "equally") {
      const share =
        numericAmount /
        activeMembers.length;

      return activeMembers.map(
        (user) => ({
          user,
          shareAmount:
            Number(
              share.toFixed(2)
            ),
        })
      );
    }

    // =========================================
    // BY AMOUNT
    // =========================================

    if (splitMethod === "amount") {
      return activeMembers.map(
        (user) => {
          const val =
            parseFloat(
              customShares[user.id]
            ) || 0;

          return {
            user,
            shareAmount: val,
          };
        }
      );
    }

    // =========================================
    // BY PERCENTAGE
    // =========================================

    if (
      splitMethod === "percentage"
    ) {
      return activeMembers.map(
        (user) => {
          const pct =
            parseFloat(
              customShares[user.id]
            ) || 0;

          const val =
            (numericAmount * pct) /
            100;

          return {
            user,
            shareAmount:
              Number(
                val.toFixed(2)
              ),
            percentage: pct,
          };
        }
      );
    }

    return [];
  }, [
    activeMembers,
    numericAmount,
    splitMethod,
    customShares,
  ]);

  // =========================================
  // CUSTOM SHARE INPUT
  // =========================================

  const handleShareInputChange = (
    userId,
    value
  ) => {
    setCustomShares((prev) => ({
      ...prev,
      [userId]: value,
    }));
  };

  // =========================================
  // BACK
  // =========================================

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  // =========================================
  // SAVE EXPENSE
  // =========================================

  const handleSaveExpense = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    // =========================================
    // VALIDATION
    // =========================================

    if (!title.trim()) {
      setErrorMessage(
        "Please enter an expense title."
      );
      return;
    }

    if (
      !numericAmount ||
      numericAmount <= 0
    ) {
      setErrorMessage(
        "Please enter a valid expense amount."
      );
      return;
    }

    setSaving(true);

    try {
      // =========================================
      // PERSONAL EXPENSE
      // =========================================

      if (expenseType === "personal") {
        const payload = {
          title: title.trim(),
          amount: numericAmount,
          category,
          note: note.trim(),
          date: new Date()
            .toISOString()
            .split("T")[0],
        };

        // IMPORTANT:
        // Use api.post instead of fetch.
        // JWT is automatically attached.

        await api.post(
          "/expenses",
          payload
        );

        setSuccessMessage(
          "Expense saved successfully! 🎉"
        );

        setTimeout(() => {
          navigate("/expenses");
        }, 800);

      } else {
        // =========================================
        // GROUP EXPENSE
        // =========================================

        if (!selectedGroup) {
          throw new Error(
            "Please select a group for this shared expense."
          );
        }

        if (
          activeMembers.length === 0
        ) {
          throw new Error(
            "Please select at least one participant."
          );
        }

        const payload = {
          title: title.trim(),
          amount: numericAmount,
          category,
          note: note.trim(),
          date: new Date()
            .toISOString()
            .split("T")[0],

          groupId: selectedGroup.id,

          // Backend ignores this and gets
          // the payer from JWT.
          // Keeping it here is harmless.
          paidBy: null,

          shares: splitPreview.map(
            (item) => ({
              userId: item.user.id,
              amount:
                item.shareAmount,
            })
          ),
        };

        // IMPORTANT:
        // Use api.post instead of fetch.
        // JWT is automatically attached.

        await api.post(
          "/expenses/split",
          payload
        );

        setSuccessMessage(
          "Group split expense created successfully! 🎉"
        );

        setTimeout(() => {
          navigate("/expenses");
        }, 800);
      }
    } catch (err) {
      console.error(
        "Error saving expense:",
        err
      );

      if (err.response?.status === 401) {
        setErrorMessage(
          "Your session has expired. Please login again."
        );
      } else if (
        err.response?.status === 403
      ) {
        setErrorMessage(
          "You are not authorized to perform this action."
        );
      } else {
        setErrorMessage(
          err.response?.data?.message ||
            err.message ||
            "Failed to save expense. Please try again."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="add-expense-page">
      <div className="add-expense-container">

        {/* HEADER */}

        <div className="add-expense-header">
          <button
            type="button"
            className="back-circle-btn"
            onClick={handleBack}
            aria-label="Back"
          >
            ←
          </button>

          <div>
            <h1>Add Expense</h1>

            <p>
              Record an individual purchase
              or divide costs with your group
            </p>
          </div>
        </div>

        {/* FEEDBACK */}

        {successMessage && (
          <div className="feedback-banner banner-success">
            <span>
              {successMessage}
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="feedback-banner banner-error">
            <span>
              ⚠️ {errorMessage}
            </span>
          </div>
        )}

        {/* FORM */}

        <form
          className="expense-form-card"
          onSubmit={handleSaveExpense}
        >

          {/* EXPENSE TYPE */}

          <div className="type-toggle-pill-container">

            <button
              type="button"
              className={`type-pill ${
                expenseType === "personal"
                  ? "pill-active"
                  : ""
              }`}
              onClick={() =>
                setExpenseType(
                  "personal"
                )
              }
            >
              👤 Personal Expense
            </button>

            <button
              type="button"
              className={`type-pill ${
                expenseType === "group"
                  ? "pill-active"
                  : ""
              }`}
              onClick={() =>
                setExpenseType("group")
              }
            >
              👥 Group Split
            </button>

          </div>

          {/* AMOUNT */}

          <div className="amount-hero-input-group">

            <span className="hero-currency-label">
              ₹
            </span>

            <input
              type="number"
              step="any"
              placeholder="0.00"
              className="hero-amount-field"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
              required
              autoFocus
            />

          </div>

          {/* DESCRIPTION */}

          <div className="form-field-group">

            <label>
              Description
            </label>

            <input
              type="text"
              placeholder="e.g. Dinner at Luigi's, Uber to airport, Groceries"
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              required
            />

          </div>

          {/* CATEGORY */}

          <div className="form-field-group">

            <label>
              Category
            </label>

            <div className="category-tiles-grid">

              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.name}
                  className={`category-tile-btn ${
                    category === cat.name
                      ? "cat-selected"
                      : ""
                  }`}
                  onClick={() =>
                    setCategory(
                      cat.name
                    )
                  }
                >
                  <span className="cat-icon-emoji">
                    {cat.icon}
                  </span>

                  <span className="cat-name-label">
                    {cat.name}
                  </span>
                </button>
              ))}

            </div>

          </div>

          {/* GROUP CONFIGURATION */}

          {expenseType === "group" && (
            <div className="group-split-configuration-panel">

              {/* SELECT GROUP */}

              <div className="form-field-group">

                <label>
                  Select Group
                </label>

                {loadingGroups ? (
                  <div className="loading-subtext">
                    Loading your groups...
                  </div>
                ) : groups.length === 0 ? (
                  <div className="no-groups-warn">
                    No groups found. Please create a group first in the Groups tab.
                  </div>
                ) : (
                  <select
                    className="group-select-dropdown"
                    value={selectedGroupId}
                    onChange={(e) =>
                      handleGroupSelect(
                        e.target.value
                      )
                    }
                  >
                    {groups.map((group) => (
                      <option
                        key={group.id}
                        value={group.id}
                      >
                        {group.name} (
                        {group.users?.length ||
                          0}{" "}
                        members)
                      </option>
                    ))}
                  </select>
                )}

              </div>

              {/* PARTICIPANTS */}

              {selectedGroup &&
                selectedGroup.users && (
                  <div className="form-field-group">

                    <div className="field-header-flex">

                      <label>
                        Select Participants
                      </label>

                      <span className="selected-count-tag">
                        {selectedUserIds.length}{" "}
                        of{" "}
                        {
                          selectedGroup.users
                            .length
                        }{" "}
                        selected
                      </span>

                    </div>

                    <div className="participants-chips-list">

                      {selectedGroup.users.map(
                        (user) => {
                          const isSelected =
                            selectedUserIds.includes(
                              user.id
                            );

                          return (
                            <button
                              type="button"
                              key={user.id}
                              className={`participant-pill-btn ${
                                isSelected
                                  ? "participant-active"
                                  : ""
                              }`}
                              onClick={() =>
                                toggleUserSelection(
                                  user.id
                                )
                              }
                            >
                              <span className="check-indicator">
                                {isSelected
                                  ? "✓"
                                  : "+"}
                              </span>

                              <span>
                                {user.name}
                              </span>
                            </button>
                          );
                        }
                      )}

                    </div>

                  </div>
                )}

              {/* SPLIT METHOD */}

              <div className="form-field-group">

                <label>
                  Split Method
                </label>

                <div className="split-method-tabs">

                  <button
                    type="button"
                    className={`method-tab ${
                      splitMethod === "equally"
                        ? "active-tab"
                        : ""
                    }`}
                    onClick={() =>
                      setSplitMethod(
                        "equally"
                      )
                    }
                  >
                    Equally (1/N)
                  </button>

                  <button
                    type="button"
                    className={`method-tab ${
                      splitMethod === "amount"
                        ? "active-tab"
                        : ""
                    }`}
                    onClick={() =>
                      setSplitMethod(
                        "amount"
                      )
                    }
                  >
                    By Amount (₹)
                  </button>

                  <button
                    type="button"
                    className={`method-tab ${
                      splitMethod ===
                      "percentage"
                        ? "active-tab"
                        : ""
                    }`}
                    onClick={() =>
                      setSplitMethod(
                        "percentage"
                      )
                    }
                  >
                    By Percentage (%)
                  </button>

                </div>

              </div>

              {/* SPLIT PREVIEW */}

              {activeMembers.length > 0 &&
                numericAmount > 0 && (
                  <div className="split-preview-card">

                    <span className="preview-heading">
                      Split Preview
                    </span>

                    <div className="preview-rows-list">

                      {splitPreview.map(
                        (item) => (
                          <div
                            className="preview-item-row"
                            key={item.user.id}
                          >

                            <div className="user-name-part">

                              <strong>
                                {
                                  item.user
                                    .name
                                }
                              </strong>

                              <span>
                                Member
                              </span>

                            </div>

                            {splitMethod ===
                              "equally" && (
                              <strong className="calculated-share-val">
                                ₹
                                {item.shareAmount.toLocaleString(
                                  "en-IN",
                                  {
                                    minimumFractionDigits: 2,
                                  }
                                )}
                              </strong>
                            )}

                            {splitMethod ===
                              "amount" && (
                              <div className="custom-share-input-wrap">

                                <span>
                                  ₹
                                </span>

                                <input
                                  type="number"
                                  placeholder="0"
                                  value={
                                    customShares[
                                      item.user.id
                                    ] || ""
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    handleShareInputChange(
                                      item.user.id,
                                      e.target
                                        .value
                                    )
                                  }
                                />

                              </div>
                            )}

                            {splitMethod ===
                              "percentage" && (
                              <div className="custom-share-input-wrap">

                                <input
                                  type="number"
                                  placeholder="%"
                                  value={
                                    customShares[
                                      item.user.id
                                    ] || ""
                                  }
                                  onChange={(
                                    e
                                  ) =>
                                    handleShareInputChange(
                                      item.user.id,
                                      e.target
                                        .value
                                    )
                                  }
                                />

                                <span>
                                  % (~₹
                                  {
                                    item.shareAmount
                                  }
                                  )
                                </span>

                              </div>
                            )}

                          </div>
                        )
                      )}

                    </div>
                  </div>
                )}

            </div>
          )}

          {/* NOTE */}

          <div className="form-field-group">

            <label>
              Note (Optional)
            </label>

            <textarea
              placeholder="Add any extra notes or payment details..."
              value={note}
              onChange={(e) =>
                setNote(e.target.value)
              }
              rows={3}
            />

          </div>

          {/* SAVE */}

          <button
            type="submit"
            className="save-expense-submit-btn"
            disabled={
              saving ||
              !title.trim() ||
              numericAmount <= 0
            }
          >
            {saving
              ? "Saving Expense..."
              : "Save Expense"}
          </button>

        </form>
      </div>
    </div>
  );
}

export default AddExpense;