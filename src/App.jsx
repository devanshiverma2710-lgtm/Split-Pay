import { BrowserRouter, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import "./App.css";

// Pages
import Dashboard from "./pages/Dashboard";
import Expenses from "./pages/Expenses";
import AddExpense from "./pages/AddExpense";
import Groups from "./pages/Groups";
import GroupDetails from "./pages/GroupDetails";
import Payment from "./pages/Payment";
import SplitBill from "./pages/SplitBill";
import Reminders from "./pages/Reminders";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";

function Layout() {
  const navigate = useNavigate();

  const navItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: "▦",
    },
    {
      path: "/expenses",
      label: "Expenses",
      icon: "▤",
    },
    {
      path: "/groups",
      label: "Groups",
      icon: "♧",
    },
    {
      path: "/payments",
      label: "Payments",
      icon: "◉",
    },
    {
      path: "/reminders",
      label: "Reminders",
      icon: "♧",
    },
  ];

  return (
    <div className="app-container">

      {/* SIDEBAR */}
      <aside className="sidebar">

        {/* Logo */}
        <div className="logo-section">
          <div className="logo-mark">S</div>

          <div>
            <h2>SplitPay</h2>
            <span>Personal Finance</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="sidebar-bottom">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-icon">⚙</span>
            <span>Settings</span>
          </NavLink>

          <div
            className="sidebar-user-profile"
            onClick={() => navigate("/settings")}
          >
            <div className="sidebar-avatar">D</div>
            <div className="sidebar-user-info">
              <strong>Devanshi S.</strong>
              <span>Pro Member</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="main-area">

        {/* TOP BAR */}
        <header className="topbar">

          <div className="topbar-left">
            <span className="page-brand">SplitPay</span>
          </div>

          <div className="topbar-right">

            {/* Notifications */}
            <button
              className="icon-button"
              onClick={() => navigate("/reminders")}
              title="Notifications"
            >
              ♧
              <span className="notification-dot"></span>
            </button>

            {/* Profile */}
            <button
              className="profile-button"
              onClick={() => navigate("/settings")}
            >
              <div className="profile-avatar">D</div>

              <div className="profile-info">
                <strong>Devanshi S.</strong>
                <span>Pro Member</span>
              </div>

              <span className="profile-arrow">⌄</span>
            </button>

          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="page-content">
          <Routes>

            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />

            {/* Expenses */}
            <Route path="/expenses" element={<Expenses />} />

            <Route
              path="/add-expense"
              element={<AddExpense />}
            />

            {/* Groups */}
            <Route path="/groups" element={<Groups />} />

            <Route
              path="/groups/:groupId"
              element={<GroupDetails />}
            />

            {/* Payments */}
            <Route
              path="/payments"
              element={<Payment />}
            />

            {/* Split Bill */}
            <Route
              path="/split-bill"
              element={<SplitBill />}
            />

            {/* Reminders */}
            <Route
              path="/reminders"
              element={<Reminders />}
            />

            {/* Settings */}
            <Route
              path="/settings"
              element={<Settings />}
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="placeholder-page">
                  <h1>Page not found</h1>
                  <button onClick={() => navigate("/")}>
                    Go to Dashboard
                  </button>
                </div>
              }
            />

          </Routes>
        </main>

      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Public authentication pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Existing SplitPay application */}
        <Route path="/*" element={<Layout />} />

      </Routes>

    </BrowserRouter>
  );
}

export default App;