import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./header.css";
import logo from "../assets/newLogo.png";
import logoutIcon from "../assets/icons8-login-50.png";

const menuItems = [
  { to: "/day",      label: "Dienos EEG signalai"  },
  { to: "/night",    label: "Nakties EEG signalai"  },
  { to: "/settings", label: "Nustatymai"            },
  { to: "/account",  label: "Paskyra"               },
];

function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar custom-navbar">
        <NavLink className="navbar-brand" to="/">
          <img src={logo} alt="Logo" className="logo" />
        </NavLink>

        <div className="navbar-right">
          {/* Logout icon button — always visible */}
          <button
            className="btn logout-btn"
            onClick={handleLogout}
            title="Atsijungti"
          >
            <img src={logoutIcon} alt="Atsijungti" className="logout-icon" />
          </button>

          {/* Hamburger */}
          <button
            className="btn sidebar-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Atidaryti meniu"
          >
            ☰
          </button>
        </div>
      </nav>

      {/* SIDEBAR */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`} aria-hidden={!sidebarOpen}>
        <ul className="sidebar-list">
          {menuItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Logout row inside sidebar too */}
        <button className="sidebar-logout" onClick={handleLogout}>
          <img src={logoutIcon} alt="" className="logout-icon logout-icon--dark" />
          Atsijungti
        </button>
      </div>

      {/* OVERLAY */}
      {sidebarOpen && (
        <div
          className="overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Uždaryti meniu"
        />
      )}
    </>
  );
}

export default Header;