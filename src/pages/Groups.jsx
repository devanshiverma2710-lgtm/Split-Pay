import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Groups.css";
import api from "../services/api";

function Groups({ onBack, onViewGroup }) {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [groupStats, setGroupStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Group Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMembersList, setNewMembersList] = useState([
    "Devanshi Verma (You)",
  ]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // =========================================================
  // FETCH GROUPS
  // =========================================================
  useEffect(() => {
    let ignore = false;

    const fetchGroupsData = async () => {
      try {
        setLoading(true);
        setError("");

        // IMPORTANT:
        // Use api instead of fetch.
        // api automatically attaches:
        // Authorization: Bearer <JWT>
        const response = await api.get("/groups");

        const groupsList = Array.isArray(response.data)
          ? response.data
          : [];

        if (!ignore) {
          setGroups(groupsList);
        }

        // =====================================================
        // FETCH STATS FOR EACH GROUP
        // =====================================================
        const statsMap = {};

        await Promise.all(
          groupsList.map(async (group) => {
            try {
              const [expensesResponse, balancesResponse] =
                await Promise.all([
                  api.get(`/expenses/group/${group.id}`),
                  api.get(`/groups/${group.id}/balances`),
                ]);

              // -----------------------------
              // TOTAL SPENDING
              // -----------------------------
              let totalSpending = 0;

              const expensesData = Array.isArray(expensesResponse.data)
                ? expensesResponse.data
                : [];

              totalSpending = expensesData.reduce(
                (sum, expense) =>
                  sum + Number(expense.amount || 0),
                0
              );

              // -----------------------------
              // USER BALANCE
              // -----------------------------
              let userBalance = 0;

              const balancesData = Array.isArray(balancesResponse.data)
                ? balancesResponse.data
                : [];

              const currentUserId = getCurrentUserId();

              const myBalance = balancesData.find(
                (balance) =>
                  Number(balance.userId) === Number(currentUserId)
              );

              if (myBalance) {
                userBalance = Number(myBalance.balance || 0);
              }

              statsMap[group.id] = {
                totalSpending,
                userBalance,
              };
            } catch (err) {
              console.error(
                `Error loading stats for group ${group.id}:`,
                err
              );

              statsMap[group.id] = {
                totalSpending: 0,
                userBalance: 0,
              };
            }
          })
        );

        if (!ignore) {
          setGroupStats(statsMap);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching groups:", err);

        if (!ignore) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            setError(
              "Your session has expired. Please login again."
            );
          } else {
            setError(
              "Unable to load groups. Please verify the backend connection."
            );
          }

          setLoading(false);
        }
      }
    };

    fetchGroupsData();

    return () => {
      ignore = true;
    };
  }, []);

  // =========================================================
  // GET CURRENT USER ID
  // =========================================================
  const getCurrentUserId = () => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        return 1;
      }

      const user = JSON.parse(storedUser);

      return user.id || user.userId || 1;
    } catch (error) {
      console.error("Unable to read current user:", error);
      return 1;
    }
  };

  // =========================================================
  // OPEN GROUP
  // =========================================================
  const handleOpenGroup = (groupId) => {
    if (onViewGroup) {
      onViewGroup(groupId);
    } else {
      navigate(`/groups/${groupId}`);
    }
  };

  // =========================================================
  // ADD MEMBER
  // =========================================================
  const handleAddMember = () => {
    const member = newMemberEmail.trim();

    if (!member) {
      return;
    }

    if (!newMembersList.includes(member)) {
      setNewMembersList([
        ...newMembersList,
        member,
      ]);
    }

    setNewMemberEmail("");
  };

  // =========================================================
  // REMOVE MEMBER
  // =========================================================
  const handleRemoveMember = (index) => {
    // Don't remove creator
    if (index === 0) {
      return;
    }

    setNewMembersList(
      newMembersList.filter(
        (_, idx) => idx !== index
      )
    );
  };

  // =========================================================
  // CREATE GROUP
  // =========================================================
  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();

    if (!newGroupName.trim()) {
      return;
    }

    setCreatingGroup(true);

    try {
      const currentUserId = getCurrentUserId();

      const users = newMembersList.map(
        (member, index) => {
          const isEmail = member.includes("@");

          const cleanName = member
            .replace(" (You)", "")
            .trim();

          return {
            id: index === 0 ? currentUserId : undefined,
            name: isEmail
              ? member.split("@")[0]
              : cleanName,
            email: isEmail
              ? member
              : `${cleanName
                  .toLowerCase()
                  .replace(/\s+/g, "")}@example.com`,
          };
        }
      );

      const payload = {
        name: newGroupName.trim(),
        users,
      };

      console.log("Creating group:", payload);

      // IMPORTANT:
      // Use api.post so JWT is automatically attached.
      const response = await api.post(
        "/groups",
        payload
      );

      const savedGroup = response.data;

      setGroups((prev) => [
        ...prev,
        savedGroup,
      ]);

      // Reset form
      setNewGroupName("");
      setNewMemberEmail("");
      setNewMembersList([
        "Devanshi Verma (You)",
      ]);
      setShowCreateModal(false);
    } catch (err) {
      console.error(
        "Error creating group:",
        err
      );

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        setError(
          "You are not authorized to create a group. Please login again."
        );
      } else if (err.response?.data) {
        console.error(
          "Backend response:",
          err.response.data
        );

        setError(
          err.response.data.message ||
            "Failed to create group."
        );
      } else {
        setError(
          "Unable to create group. Please check the backend."
        );
      }
    } finally {
      setCreatingGroup(false);
    }
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

    return classes[idx % classes.length];
  };

  // =========================================================
  // UI
  // =========================================================
  return (
    <div className="groups-page">

      {/* HEADER */}
      <div className="groups-header">

        <div className="groups-header-left">

          {onBack && (
            <button
              type="button"
              className="back-button"
              onClick={onBack}
              aria-label="Back"
            >
              ←
            </button>
          )}

          <div>
            <h1>Groups</h1>

            <p>
              Manage your shared expenses,
              roommates, and trip budgets
            </p>
          </div>

        </div>

        <button
          className="create-group-primary-btn"
          onClick={() =>
            setShowCreateModal(true)
          }
        >
          <span>＋</span>
          <span>Create Group</span>
        </button>

      </div>

      {/* ERROR */}
      {error && (
        <div className="groups-error-banner">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="groups-loading-state">
          <div className="groups-spinner"></div>

          <p>
            Loading your groups and shared
            balances...
          </p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && groups.length === 0 && (
        <div className="groups-empty-card">

          <div className="empty-groups-icon">
            👥
          </div>

          <h2>No Groups Yet</h2>

          <p>
            Create a group to start splitting
            rent, dinners, or trip expenses
            with friends.
          </p>

          <button
            className="create-group-primary-btn"
            onClick={() =>
              setShowCreateModal(true)
            }
          >
            ＋ Create Your First Group
          </button>

        </div>
      )}

      {/* GROUP GRID */}
      {!loading && groups.length > 0 && (
        <div className="groups-grid">

          {groups.map((group, groupIdx) => {

            const stats =
              groupStats[group.id] || {
                totalSpending: 0,
                userBalance: 0,
              };

            const members =
              group.users || [];

            const userBal =
              stats.userBalance;

            return (
              <div
                className="group-card"
                key={group.id}
                onClick={() =>
                  handleOpenGroup(group.id)
                }
              >

                {/* CARD HEADER */}
                <div className="group-card-header">

                  <div
                    className={`group-avatar-large ${getAvatarBgClass(
                      groupIdx
                    )}`}
                  >
                    {group.name
                      ? group.name
                          .charAt(0)
                          .toUpperCase()
                      : "G"}
                  </div>

                  <div className="group-title-block">

                    <h2>{group.name}</h2>

                    <span>
                      {members.length}{" "}
                      {members.length === 1
                        ? "member"
                        : "members"}
                    </span>

                  </div>

                  <span className="group-arrow-cue">
                    →
                  </span>

                </div>

                {/* MEMBERS */}
                <div className="group-members-preview">

                  <div className="avatars-stacked">

                    {members
                      .slice(0, 4)
                      .map((user, idx) => (
                        <div
                          className={`stacked-avatar ${getAvatarBgClass(
                            idx + 1
                          )}`}
                          key={
                            user.id || idx
                          }
                          title={
                            user.name ||
                            user.email
                          }
                        >
                          {user.name
                            ? user.name
                                .charAt(0)
                                .toUpperCase()
                            : "U"}
                        </div>
                      ))}

                    {members.length > 4 && (
                      <div className="stacked-avatar extra-count">
                        +{members.length - 4}
                      </div>
                    )}

                  </div>

                  <span className="members-names-summary">

                    {members
                      .map(
                        (u) =>
                          u.name
                            ?.split(" ")[0] ||
                          "User"
                      )
                      .slice(0, 3)
                      .join(", ")}

                    {members.length > 3
                      ? " & more"
                      : ""}

                  </span>

                </div>

                {/* FOOTER */}
                <div className="group-card-footer">

                  <div className="group-stat-item">

                    <span className="stat-label">
                      Total Spend
                    </span>

                    <strong className="stat-value">
                      ₹
                      {stats.totalSpending.toLocaleString(
                        "en-IN"
                      )}
                    </strong>

                  </div>

                  <div className="group-stat-item text-right">

                    <span className="stat-label">
                      Your Position
                    </span>

                    {userBal > 0 ? (
                      <strong className="stat-value text-green">
                        +₹
                        {userBal.toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    ) : userBal < 0 ? (
                      <strong className="stat-value text-coral">
                        -₹
                        {Math.abs(
                          userBal
                        ).toLocaleString(
                          "en-IN"
                        )}
                      </strong>
                    ) : (
                      <strong className="stat-value text-muted">
                        Settled ✓
                      </strong>
                    )}

                  </div>

                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setShowCreateModal(false)
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
                Create New Group
              </h2>

              <button
                className="modal-close-btn"
                onClick={() =>
                  setShowCreateModal(false)
                }
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={
                handleCreateGroupSubmit
              }
            >

              {/* GROUP NAME */}
              <div className="form-group">

                <label>
                  Group Name
                </label>

                <input
                  type="text"
                  placeholder="e.g. Goa Trip 2026, Flat 402, Friday Dinners"
                  value={newGroupName}
                  onChange={(e) =>
                    setNewGroupName(
                      e.target.value
                    )
                  }
                  required
                  autoFocus
                />

              </div>

              {/* ADD MEMBERS */}
              <div className="form-group">

                <label>
                  Add Members
                </label>

                <div className="add-member-input-row">

                  <input
                    type="text"
                    placeholder="Enter friend's name or email"
                    value={newMemberEmail}
                    onChange={(e) =>
                      setNewMemberEmail(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key ===
                        "Enter"
                      ) {
                        e.preventDefault();
                        handleAddMember();
                      }
                    }}
                  />

                  <button
                    type="button"
                    className="add-member-btn"
                    onClick={
                      handleAddMember
                    }
                  >
                    Add
                  </button>

                </div>

              </div>

              {/* MEMBERS LIST */}
              <div className="modal-members-list">

                <span className="members-badge-title">
                  Group Participants (
                  {newMembersList.length}
                  )
                </span>

                <div className="member-chips-container">

                  {newMembersList.map(
                    (member, idx) => (
                      <span
                        className="member-chip"
                        key={idx}
                      >

                        {member}

                        {idx > 0 && (
                          <button
                            type="button"
                            className="chip-remove"
                            onClick={() =>
                              handleRemoveMember(
                                idx
                              )
                            }
                          >
                            ×
                          </button>
                        )}

                      </span>
                    )
                  )}

                </div>

              </div>

              {/* ACTIONS */}
              <div className="modal-actions">

                <button
                  type="button"
                  className="modal-btn-secondary"
                  onClick={() =>
                    setShowCreateModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-btn-primary"
                  disabled={
                    creatingGroup ||
                    !newGroupName.trim()
                  }
                >
                  {creatingGroup
                    ? "Creating..."
                    : "Create Group"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Groups;