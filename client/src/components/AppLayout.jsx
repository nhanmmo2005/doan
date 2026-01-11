import { NavLink } from "react-router-dom";

export default function AppLayout({ children }) {
  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <div className="brand-badge" />
            <div>
              <div className="brand-title">Foodbook</div>
              <div className="brand-sub">Mini social • Đà Nẵng</div>
            </div>
          </div>

          <div className="search">
            🔎
            <input placeholder="Tìm quán, món, khu vực..." />
          </div>

          <div className="pill">📍 Đà Nẵng</div>
        </div>
      </div>

      <div className="container">
        <div className="row">
          {/* Sidebar */}
          <div className="sidebar">
            <div className="card soft side-section">
              <div className="side-title">Menu</div>

              <NavLink to="/feed" className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
                <div className="side-left">
                  <div className="icon">🏠</div>
                  <div>
                    <div style={{ fontWeight: 800 }}>Trang chủ</div>
                    <div className="muted" style={{ fontSize: 12 }}>Feed</div>
                  </div>
                </div>
                <span className="badge">New</span>
              </NavLink>

              <NavLink to="/restaurants" className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
                <div className="side-left">
                  <div className="icon">🍜</div>
                  <div>
                    <div style={{ fontWeight: 800 }}>Tìm quán ăn</div>
                    <div className="muted" style={{ fontSize: 12 }}>Restaurants</div>
                  </div>
                </div>
                <span className="badge">Foody</span>
              </NavLink>

              <NavLink to="/keo-an" className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
                <div className="side-left">
                  <div className="icon">🤝</div>
                  <div>
                    <div style={{ fontWeight: 800 }}>Kèo ăn</div>
                    <div className="muted" style={{ fontSize: 12 }}>Rủ đi ăn</div>
                  </div>
                </div>
                <span className="badge">Soon</span>
              </NavLink>

              <NavLink to="/chat" className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
                <div className="side-left">
                  <div className="icon">💬</div>
                  <div>
                    <div style={{ fontWeight: 800 }}>Chat</div>
                    <div className="muted" style={{ fontSize: 12 }}>Nhắn tin</div>
                  </div>
                </div>
                <span className="badge">Soon</span>
              </NavLink>

              <NavLink to="/profile" className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
                <div className="side-left">
                  <div className="icon">👤</div>
                  <div>
                    <div style={{ fontWeight: 800 }}>Cá nhân</div>
                    <div className="muted" style={{ fontSize: 12 }}>Profile</div>
                  </div>
                </div>
                <span className="badge">Me</span>
              </NavLink>

              {/* Admin link: bạn có thể condition theo role */}
              <NavLink to="/admin" className={({ isActive }) => `side-item ${isActive ? "active" : ""}`}>
                <div className="side-left">
                  <div className="icon">🛠️</div>
                  <div>
                    <div style={{ fontWeight: 800 }}>Admin</div>
                    <div className="muted" style={{ fontSize: 12 }}>Quản trị</div>
                  </div>
                </div>
                <span className="badge">Role</span>
              </NavLink>
            </div>

            {/* Widget: gợi ý */}
            <div className="card soft side-section" style={{ marginTop: 14 }}>
              <div className="side-title">Gợi ý nhanh</div>
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                • Đăng status rủ kèo ăn <br />
                • Review quán sau khi đi ăn <br />
                • Dùng từ lịch sự, hệ thống sẽ che từ thô tục
              </div>
            </div>
          </div>

          {/* Main */}
          <div style={{ flex: 1 }}>
            {children}
          </div>

          {/* Right column (optional) */}
          <div style={{ width: 280, position: "sticky", top: 78, alignSelf: "flex-start" }} className="hide-right">
            <div className="card soft side-section">
              <div className="side-title">Trending</div>
              <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
                (Sau này hiển thị top quán được review nhiều)
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
