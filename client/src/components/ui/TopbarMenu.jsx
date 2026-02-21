import { NavLink, useLocation } from "react-router-dom";
import { FiHome, FiCoffee, FiUsers, FiMessageSquare, FiUser, FiSettings } from "react-icons/fi";

const baseMenuItems = [
  { to: "/feed", icon: FiHome, label: "Trang chủ" },
  { to: "/restaurants", icon: FiCoffee, label: "Quán" },
  { to: "/keo-an", icon: FiUsers, label: "Kèo ăn" },
  { to: "/chat", icon: FiMessageSquare, label: "Chat" },
];

export default function TopbarMenu({ isAdmin = false }) {
  const menuItems = isAdmin
    ? [...baseMenuItems, { to: "/admin", icon: FiSettings, label: "Admin" }]
    : baseMenuItems;
  const location = useLocation();

  return (
    <nav className="topbar-menu" role="navigation" aria-label="Main navigation">
    {menuItems.map(({ to, icon: Icon, label }) => (
      <NavLink
        key={to}
        to={to}
        className={({ isActive }) => `topbar-menu-item ${isActive ? "active" : ""}`}
        aria-current={location.pathname === to ? "page" : undefined}
        title={label}
        data-label={label}
      >
          <div className="topbar-menu-icon" aria-hidden="true">
            <Icon />
          </div>
          <div className="topbar-menu-text">
            <div className="topbar-menu-main">{label}</div>
          </div>
        </NavLink>
      ))}
    </nav>
  );
}