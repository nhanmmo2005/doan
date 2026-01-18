import { NavLink } from "react-router-dom";
import { getUser } from "../auth";
import {
  FaHome,
  FaUtensils,
  FaHandshake,
  FaComments,
  FaUser,
  FaTools,
  FaSearch,
  FaMapMarkerAlt,
} from "react-icons/fa";
import BannerCarousel from "./BannerCarousel";

export default function AppLayout({ children }) {
  const user = getUser();
  const isAdmin = user?.role === "admin";

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="container">
          <div className="topbar-inner">
            <div className="brand">
              <div className="brand-badge" />
              <div>
                <div className="brand-title">Foodbook</div>
                <div className="brand-sub">Mini social • Đà Nẵng</div>
              </div>
            </div>

            <div className="search">
              <FaSearch />
              <input placeholder="Tìm quán, món, khu vực..." />
            </div>

            <div className="pill">
              <FaMapMarkerAlt style={{ marginRight: 6 }} />
              Đà Nẵng
            </div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="container">
        <div className="row">
          {/* Sidebar */}
          <div className="sidebar">
            <div className="card soft side-section">
              <div className="side-title">Menu</div>

              <NavLink to="/feed" className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
                <div className="side-left">
                  <div className="icon"><FaHome /></div>
                  <div className="side-text">
                    <div className="side-main">Trang chủ</div>
                    <div className="side-sub">Feed</div>
                  </div>
                </div>
              </NavLink>

              <NavLink to="/restaurants" className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
                <div className="side-left">
                  <div className="icon"><FaUtensils /></div>
                  <div className="side-text">
                    <div className="side-main">Tìm quán ăn</div>
                    <div className="side-sub">Restaurants</div>
                  </div>
                </div>
              </NavLink>

              <NavLink to="/keo-an" className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
                <div className="side-left">
                  <div className="icon"><FaHandshake /></div>
                  <div className="side-text">
                    <div className="side-main">Kèo ăn</div>
                    <div className="side-sub">Rủ bạn đi ăn</div>
                  </div>
                </div>
              </NavLink>

              <NavLink to="/chat" className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
                <div className="side-left">
                  <div className="icon"><FaComments /></div>
                  <div className="side-text">
                    <div className="side-main">Chat</div>
                    <div className="side-sub">Nhắn tin</div>
                  </div>
                </div>
              </NavLink>

              <NavLink to="/me" className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
                <div className="side-left">
                  <div className="icon"><FaUser /></div>
                  <div className="side-text">
                    <div className="side-main">Cá nhân</div>
                    <div className="side-sub">Profile</div>
                  </div>
                </div>
              </NavLink>

              {isAdmin && (
                <NavLink to="/admin" className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
                  <div className="side-left">
                    <div className="icon"><FaTools /></div>
                    <div className="side-text">
                      <div className="side-main">Admin</div>
                      <div className="side-sub">Quản trị</div>
                    </div>
                  </div>
                </NavLink>
              )}
            </div>
          </div>

          {/* Main */}
          <div style={{ flex: 1 }}>{children}</div>

          {/* Right column (giữ nhưng gọn) */}
          <div style={{ width: 280, position: "sticky", top: 78, alignSelf: "flex-start" }} className="hide-right">
            <BannerCarousel />
          </div>
        </div>
      </div>
    </>
  );
}
