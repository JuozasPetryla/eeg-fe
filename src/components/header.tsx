import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./header.css";
import logo from "../assets/newLogo.png";

const menuItems = [
  { to: "/day", label: "Dienos EEG signalai" },
  { to: "/night", label: "Nakties EEG signalai" },
  { to: "/settings", label: "Nustatymai" },
];

function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar custom-navbar">
        <NavLink className="navbar-brand" to="/">
          <img src={logo} alt="Logo" className="logo" />
        </NavLink>

        <button
          className="btn sidebar-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="Atidaryti meniu"
        >
          ☰
        </button>
      </nav>

      {/* SIDEBAR */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`} aria-hidden={!sidebarOpen}>
        <ul className="sidebar-list">
          {menuItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? " active" : ""}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
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