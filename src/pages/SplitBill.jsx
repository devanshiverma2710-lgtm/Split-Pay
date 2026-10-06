import "./SplitBill.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function SplitBill({ onBack }) {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  const [selectedUsers, setSelectedUsers] = useState([]);

  const [loadingGroups, setLoadingGroups] = useState(true);
  const [saving, setSaving] = useState(false);


  // Current logged-in user
  const currentUserId = 1;


  // Fetch groups
  useEffect(() => {

    fetch("http://localhost:8080/groups")
      .then(response => {

        if (!response.ok) {
          throw new Error("Failed to fetch groups");
        }

        return response.json();

      })
      .then(data => {

        console.log("Groups:", data);

        setGroups(data);

        setLoadingGroups(false);

      })
      .catch(error => {

        console.error("Error fetching groups:", error);

        setLoadingGroups(false);

      });

  }, []);


  // Select group
  const handleGroupChange = (event) => {

    const groupId = Number(event.target.value);

    const group = groups.find(
      group => group.id === groupId
    );

    setSelectedGroup(group || null);

    if (group) {

      // Select all group members by default
      setSelectedUsers(
        group.users.map(user => user.id)
      );

    } else {

      setSelectedUsers([]);

    }

  };


  // Select / deselect user
  const toggleUser = (userId) => {

    setSelectedUsers(previousUsers => {

      if (previousUsers.includes(userId)) {

        return previousUsers.filter(
          id => id !== userId
        );

      }

      return [
        ...previousUsers,
        userId
      ];

    });

  };


  // Calculate equal share
  const numericAmount = Number(amount) || 0;

  const memberCount = selectedUsers.length;

  const share =
    memberCount > 0
      ? numericAmount / memberCount
      : 0;


  // Save split expense
  const handleSave = async () => {

    if (!title.trim()) {

      alert("Please enter an expense title.");

      return;

    }

    if (!numericAmount || numericAmount <= 0) {

      alert("Please enter a valid amount.");

      return;

    }

    if (!category) {

      alert("Please select a category.");

      return;

    }

    if (!selectedGroup) {

      alert("Please select a group.");

      return;

    }

    if (selectedUsers.length < 2) {

      alert("Please select at least two members.");

      return;

    }


    setSaving(true);


    const splitRequest = {

      title: title,

      amount: numericAmount,

      category: category,

      note: note,

      date: new Date()
        .toISOString()
        .split("T")[0],

      groupId: selectedGroup.id,

      paidBy: currentUserId,

      shares: selectedUsers.map(userId => ({

        userId: userId,

        amount: Number(
          share.toFixed(2)
        )

      }))

    };


    console.log(
      "Sending split expense:",
      splitRequest
    );


    try {

      const response = await fetch(
        "http://localhost:8080/expenses/split",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(splitRequest)
        }
      );


      if (!response.ok) {

        const errorText =
          await response.text();

        console.error(
          "Backend error:",
          errorText
        );

        throw new Error(
          "Failed to create split expense"
        );

      }


      const savedExpense =
        await response.json();


      console.log(
        "Split expense saved:",
        savedExpense
      );


      alert(
        "Split expense created successfully."
      );


      if (onBack) {
        onBack();
      } else {
        navigate("/expenses");
      }


    } catch (error) {

      console.error(
        "Error creating split expense:",
        error
      );

      alert(
        "Failed to create split expense."
      );

    } finally {

      setSaving(false);

    }

  };


  return (

    <div className="split-bill-page">


      {/* Header */}

      <div className="split-bill-header">

        <button
          className="back-button"
          onClick={() => (onBack ? onBack() : navigate(-1))}
        >
          ←
        </button>

        <div>

          <h1>
            Split Bill
          </h1>

          <p>
            Share an expense with your group
          </p>

        </div>

      </div>


      <div className="split-bill-card">


        {/* Title */}

        <div className="split-form-group">

          <label>
            What did you spend on?
          </label>

          <input
            type="text"
            placeholder="e.g. Goa Dinner"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
          />

        </div>


        {/* Amount */}

        <div className="split-form-group">

          <label>
            Total amount
          </label>

          <div className="split-amount-input">

            <span>
              ₹
            </span>

            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) =>
                setAmount(e.target.value)
              }
            />

          </div>

        </div>


        {/* Category */}

        <div className="split-form-group">

          <label>
            Category
          </label>

          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
          >

            <option value="">
              Select category
            </option>

            <option value="Food">
              Food
            </option>

            <option value="Travel">
              Travel
            </option>

            <option value="Shopping">
              Shopping
            </option>

            <option value="Entertainment">
              Entertainment
            </option>

            <option value="Bills">
              Bills
            </option>

            <option value="Other">
              Other
            </option>

          </select>

        </div>


        {/* Group */}

        <div className="split-form-group">

          <label>
            Select group
          </label>

          {loadingGroups ? (

            <div className="split-loading">
              Loading groups...
            </div>

          ) : (

            <select
              value={
                selectedGroup
                  ? selectedGroup.id
                  : ""
              }
              onChange={handleGroupChange}
            >

              <option value="">
                Select a group
              </option>

              {groups.map(group => (

                <option
                  key={group.id}
                  value={group.id}
                >
                  {group.name}
                </option>

              ))}

            </select>

          )}

        </div>


        {/* Members */}

        {selectedGroup && (

          <div className="members-section">

            <div className="members-header">

              <div>

                <h2>
                  Participants
                </h2>

                <p>
                  Select everyone sharing this expense
                </p>

              </div>

              <span>
                {selectedUsers.length} selected
              </span>

            </div>


            <div className="members-list">

              {selectedGroup.users.map(user => {

                const isSelected =
                  selectedUsers.includes(
                    user.id
                  );

                return (

                  <button
                    key={user.id}
                    type="button"
                    className={
                      isSelected
                        ? "member-card selected"
                        : "member-card"
                    }
                    onClick={() =>
                      toggleUser(user.id)
                    }
                  >

                    <div className="member-avatar">
                      {user.name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="member-info">

                      <strong>
                        {user.name}
                      </strong>

                      <span>
                        {user.id === currentUserId
                          ? "You"
                          : "Group member"}
                      </span>

                    </div>

                    <div className="member-check">

                      {isSelected
                        ? "✓"
                        : ""}

                    </div>

                  </button>

                );

              })}

            </div>

          </div>

        )}


        {/* Split summary */}

        {selectedGroup &&
          selectedUsers.length > 0 && (

            <div className="split-summary">

              <div>

                <span>
                  Total bill
                </span>

                <strong>
                  ₹{numericAmount.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Members
                </span>

                <strong>
                  {memberCount}
                </strong>

              </div>


              <div className="your-share">

                <span>
                  Each person's share
                </span>

                <strong>
                  ₹{share.toLocaleString(
                    "en-IN",
                    {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    }
                  )}
                </strong>

              </div>

            </div>

          )}


        {/* Note */}

        <div className="split-form-group">

          <label>
            Note
          </label>

          <textarea
            placeholder="Add a note"
            value={note}
            onChange={(e) =>
              setNote(e.target.value)
            }
          />

        </div>


        {/* Save */}

        <button
          className="create-split-button"
          onClick={handleSave}
          disabled={saving}
        >

          {saving
            ? "Creating..."
            : "Create Split Expense"}

        </button>


      </div>

    </div>

  );

}

export default SplitBill;