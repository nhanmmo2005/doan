import { NavLink, useLocation } from "react-router-dom";
import { FaHome, FaUtensils, FaHandshake, FaComments, FaUser, FaTools } from "react-icons/fa";

const baseMenuItems = [
  { to: "/feed", icon: FaHome, label: "Trang chủ", sub: "Feed" },
  { to: "/restaurants", icon: FaUtensils, label: "Quán", sub: "Tìm quán" },
  { to: "/keo-an", icon: FaHandshake, label: "Kèo ăn", sub: "Rủ bạn" },
  { to: "/chat", icon: FaComments, label: "Chat", sub: "Nhắn tin" },
];

export default function TopbarMenu({ isAdmin = false }) {
  const menuItems = isAdmin
    ? [...baseMenuItems, { to: "/admin", icon: FaTools, label: "Admin", sub: "Quản trị" }]
    : baseMenuItems;
  const location = useLocation();

  return (
    <nav className="topbar-menu" role="navigation" aria-label="Main navigation">
    {menuItems.map(({ to, icon: Icon, label, sub }) => (
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
            <div className="topbar-menu-sub">{sub}</div>
          </div>
        </NavLink>
      ))}
    </nav>
  );
}