import { useState } from "react";
import "./Settings.css";

function Settings() {
  // Profile State
  const [fullName, setFullName] = useState("Devanshi Verma");
  const [email, setEmail] = useState("devanshi.verma@example.com");
  const [upiId, setUpiId] = useState("devanshi@oksbi");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // Preferences State
  const [defaultCurrency, setDefaultCurrency] = useState("INR");
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [monthlySummary, setMonthlySummary] = useState(true);

  // Security State
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState("");

  // Logout Modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggedOut, setLoggedOut] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage("");

    setTimeout(() => {
      setProfileSaving(false);
      setProfileMessage("Profile updated successfully! ✓");
      setTimeout(() => setProfileMessage(""), 3000);
    }, 400);
  };

  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordFeedback("New passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback("Password must be at least 6 characters long.");
      return;
    }

    setPasswordFeedback("Password updated successfully! ✓");
    setTimeout(() => {
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordFeedback("");
    }, 1000);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    setLoggedOut(true);
  };

  return (
    <div className="settings-page">
      {/* HEADER */}
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account profile, currency preferences, notifications, and security</p>
      </div>

      {loggedOut && (
        <div className="logout-banner">
          <span>You have been logged out of this session.</span>
          <button onClick={() => setLoggedOut(false)}>Log back in</button>
        </div>
      )}

      <div className="settings-grid-layout">
        {/* 1. PROFILE INFORMATION CARD */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="card-header-icon bg-mint">👤</div>
            <div>
              <h2>Profile Information</h2>
              <p>Your personal identity and payment receiving details</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="settings-form">
            <div className="profile-avatar-row">
              <div className="settings-large-avatar">D</div>
              <div className="avatar-meta-info">
                <strong>Devanshi Verma</strong>
                <span>Pro Member • Member since 2024</span>
              </div>
            </div>

            {profileMessage && (
              <div className="settings-feedback-banner">
                {profileMessage}
              </div>
            )}

            <div className="settings-field-group">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="settings-field-group">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="settings-field-group">
              <label>UPI ID (For Receiving Settlements)</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="username@bank"
                required
              />
            </div>

            <div className="form-submit-row">
              <button
                type="submit"
                className="settings-save-btn"
                disabled={profileSaving}
              >
                {profileSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>

        {/* 2. PREFERENCES CARD */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="card-header-icon bg-blue">⚙️</div>
            <div>
              <h2>Preferences</h2>
              <p>Regional currency and notification options</p>
            </div>
          </div>

          <div className="preferences-content">
            <div className="settings-field-group">
              <label>Default Currency</label>
              <select
                className="currency-select-input"
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
              </select>
            </div>

            <div className="toggle-options-list">
              <span className="toggle-list-title">NOTIFICATION CHANNELS</span>

              <div className="toggle-row-item">
                <div>
                  <strong>Email Alerts</strong>
                  <p>Receive email receipts when someone records a shared bill</p>
                </div>
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-row-item">
                <div>
                  <strong>Push Notifications</strong>
                  <p>Get instant updates when payments are requested or settled</p>
                </div>
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={pushNotifications}
                    onChange={(e) => setPushNotifications(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="toggle-row-item">
                <div>
                  <strong>Monthly Spending Summary</strong>
                  <p>Receive a monthly digest breakdown of your personal expenses</p>
                </div>
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={monthlySummary}
                    onChange={(e) => setMonthlySummary(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* 3. SECURITY CARD */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="card-header-icon bg-peach">🔒</div>
            <div>
              <h2>Security</h2>
              <p>Authentication and device sessions</p>
            </div>
          </div>

          <div className="security-content">
            <div className="toggle-row-item">
              <div>
                <strong>Two-Factor Authentication (2FA)</strong>
                <p>Enhance account security by requiring an OTP on sign in</p>
              </div>
              <label className="switch-toggle">
                <input
                  type="checkbox"
                  checked={twoFactorAuth}
                  onChange={(e) => setTwoFactorAuth(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="active-sessions-section">
              <span className="sessions-title">ACTIVE SESSIONS</span>
              <div className="session-item-row">
                <div className="session-icon">💻</div>
                <div className="session-info">
                  <strong>MacBook Pro • Chrome Browser</strong>
                  <span>Current Active Session • Bengaluru, India</span>
                </div>
                <span className="current-badge">Active</span>
              </div>

              <div className="session-item-row">
                <div className="session-icon">📱</div>
                <div className="session-info">
                  <strong>iPhone 15 Pro • SplitPay iOS App</strong>
                  <span>Last active 2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. ACCOUNT CARD */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="card-header-icon bg-coral">🛡️</div>
            <div>
              <h2>Account Management</h2>
              <p>Credentials and session actions</p>
            </div>
          </div>

          <div className="account-actions-list">
            <div className="account-action-row">
              <div>
                <strong>Password & Credentials</strong>
                <p>Keep your password up to date to protect your funds</p>
              </div>
              <button
                type="button"
                className="action-link-btn"
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </button>
            </div>

            <div className="account-action-row danger-zone-row">
              <div>
                <strong>Account Session</strong>
                <p>Sign out of your SplitPay session on this browser</p>
              </div>
              <button
                type="button"
                className="logout-btn"
                onClick={() => setShowLogoutModal(true)}
              >
                Log Out
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowPasswordModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Change Password</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowPasswordModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit}>
              {passwordFeedback && (
                <div
                  className={`modal-feedback ${
                    passwordFeedback.includes("successfully")
                      ? "feedback-ok"
                      : "feedback-err"
                  }`}
                >
                  {passwordFeedback}
                </div>
              )}

              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn-secondary"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn-primary">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowLogoutModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Log Out</h2>
              <button
                className="modal-close-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                ✕
              </button>
            </div>

            <p className="modal-desc-text">
              Are you sure you want to log out of your SplitPay account on this device?
            </p>

            <div className="modal-actions">
              <button
                type="button"
                className="modal-btn-secondary"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-btn-danger"
                onClick={handleConfirmLogout}
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
