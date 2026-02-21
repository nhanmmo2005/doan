import { Link, useLocation, useNavigate } from "react-router-dom";
import { getUser, logout } from "../auth";
import BannerCarousel from "./BannerCarousel";
import Button from "./ui/Button";
import TopbarMenu from "./ui/TopbarMenu";
import { FaBell } from "react-icons/fa";
import { useState, useEffect } from "react";
import { http } from "../api/http";

export default function AppLayout({ children, left }) {
  const user = getUser();
  const isAdmin = user?.role === "admin";
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const [brand, setBrand] = useState(() => {
    try {
      const stored = localStorage.getItem("siteBrand");
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          title: parsed.title || "Foodbook",
          logoUrl: parsed.logoUrl || null,
        };
      }
    } catch (e) {
      // ignore
    }
    return { title: "Foodbook", logoUrl: null };
  });

  // Update tab title
  useEffect(() => {
    try {
      document.title = brand?.title || "Foodbook";
    } catch {}
  }, [brand?.title]);

  // Only show promotions/banners on Feed page to keep space for other features.
  const showBanner = location.pathname === "/feed";

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoadingNotifications(true);
      const response = await http.get('/api/notifications');
      console.log("DEBUG: fetched notifications:", response.data);
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user?.id) return;

    try {
      const response = await http.get('/api/notifications/unread-count');
      console.log("DEBUG: fetched unread count:", response.data);
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Fetch once when user id becomes available (avoid object identity causing loops)
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      fetchUnreadCount();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fetch notifications when the dropdown is opened to ensure fresh data
  useEffect(() => {
    if (notificationsOpen && user?.id) {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationsOpen]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If clicking outside both the user button and the user menu, close the menu.
      if (menuOpen && !event.target.closest('.topbar-user') && !event.target.closest('.topbar-user-menu')) {
        setMenuOpen(false);
      }
      if (notificationsOpen && !event.target.closest('.topbar-notifications-menu') && !event.target.closest('.topbar-notifications-btn')) {
        setNotificationsOpen(false);
        // Refresh unread count when closing notifications
        if (user) {
          fetchUnreadCount();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen, notificationsOpen, user]);

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="container">
          <div className="topbar-inner">
            {/* Left: brand */}
            <div className="topbar-left">
              <Link to="/feed" className="brand" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {brand.logoUrl ? (
                  <div className="brand-badge" style={{
                    width: 36,
                    height: 36,
                    padding: 4,
                    overflow: "hidden",
                    borderRadius: 10,
                    border: "1px solid var(--border)",
                    background: "white",
                    display: "grid",
                    placeItems: "center",
                  }}>
                    <img
                      src={brand.logoUrl}
                      alt={brand.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        display: "block",
                      }}
                    />
                  </div>
                ) : (
                  <div className="brand-badge" />
                )}
                <div className="brand-title" style={{ marginLeft: 4 }}>{brand.title}</div>
              </Link>
            </div>

            {/* Center: horizontal menu */}
            <div className="topbar-center">
              <TopbarMenu isAdmin={isAdmin} />
            </div>

            {/* Right: notifications + user avatar/name for logged-in users, login/register for guests */}
            <div className="topbar-right">
              {!user ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Link to="/login" style={{ textDecoration: "none" }}>
                    <Button variant="primary" size="sm">Đăng nhập</Button>
                  </Link>
                  <Link to="/register" style={{ textDecoration: "none" }}>
                    <Button variant="secondary" size="sm">Đăng ký</Button>
                  </Link>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {/* Notifications */}
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      className="topbar-notifications-btn"
                      onClick={() => setNotificationsOpen((v) => !v)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 8,
                        borderRadius: 8,
                        color: "var(--muted)",
                        transition: "all 0.15s ease",
                        position: "relative"
                      }}
                      onMouseEnter={(e) => e.target.style.background = "rgba(255,90,47,0.08)"}
                      onMouseLeave={(e) => e.target.style.background = "none"}
                    >
                      <FaBell style={{ fontSize: 18 }} />
                      {unreadCount > 0 && (
                        <div style={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          background: "var(--primary)",
                          color: "white",
                          borderRadius: "50%",
                          width: 18,
                          height: 18,
                          fontSize: 11,
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: 18,
                          border: "2px solid var(--card)"
                        }}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                      )}
                    </button>

                    {notificationsOpen && (
                      <div className="topbar-notifications-menu" style={{
                        position: "absolute",
                        right: 0,
                        marginTop: 8,
                        zIndex: 50,
                        background: "white",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: 0,
                        minWidth: 320,
                        maxWidth: 400,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.15)"
                      }}>
                        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", fontWeight: 600 }}>
                          Thông báo
                        </div>
                        <div style={{ maxHeight: 400, overflowY: "auto" }}>
                          {loadingNotifications ? (
                            <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                              Đang tải...
                            </div>
                          ) : notifications.length === 0 ? (
                            <div style={{ padding: "20px", textAlign: "center", color: "var(--muted)" }}>
                              Chưa có thông báo nào
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <div
                                key={notification.id}
                                style={{
                                  padding: "12px 16px",
                                  borderBottom: notification.id !== notifications[notifications.length - 1].id ? "1px solid var(--border)" : "none",
                                  background: notification.is_read ? "transparent" : "rgba(255,90,47,0.05)",
                                  cursor: "pointer"
                                }}
                                onClick={() => {
                                  // Handle notification click - navigate to related content when possible
                                  (async function () {
                                    try {
                                      // mark read
                                      await http.put(`/api/notifications/${notification.id}/read`);
                                    } catch (e) {
                                      console.error('Failed mark read:', e);
                                    }

                                    try {
                                      await fetchUnreadCount();
                                      await fetchNotifications();
                                    } catch (e) {}

                                    try {
                                      const r = await http.get(`/api/notifications/${notification.id}/resolve`);
                                      const url = r.data?.url;
                                      if (url) {
                                        setNotificationsOpen(false);
                                        navigate(url);
                                        return;
                                      }
                                    } catch (e) {
                                      console.error('Failed to resolve notification url:', e);
                                    }

                                    // fallback: just close
                                    setNotificationsOpen(false);
                                  })();
                                }}
                              >
                                <div style={{ fontSize: 14, fontWeight: 500 }}>
                                  {notification.title}
                                </div>
                                {notification.content && (
                                  <div style={{ fontSize: 13, color: "var(--text)", marginTop: 2, opacity: 0.9 }}>
                                    {notification.content}
                                  </div>
                                )}
                                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                                  {notification.time_ago}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        {notifications.length > 0 && (
                          <div style={{ padding: "8px 16px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
                            <button
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--primary)",
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 500
                              }}
                              onClick={async () => {
                                try {
                                  await http.put('/api/notifications/read-all');
                                  // Refresh notifications and unread count
                                  await fetchNotifications();
                                  await fetchUnreadCount();
                                } catch (error) {
                                  console.error('Failed to mark all as read:', error);
                                }
                              }}
                            >
                              Đánh dấu tất cả đã đọc
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* User avatar/name */}
                  <div style={{ position: "relative" }}>
                    <button
                      type="button"
                      className="topbar-user"
                      onClick={() => setMenuOpen((v) => !v)}
                      style={{ display: "flex", gap: 8, alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: 4 }}
                    >
                      <div className="avatar sm" style={{ width: 32, height: 32, fontSize: 14, borderRadius: "50%" }}>
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                        ) : (
                          user.name?.[0]?.toUpperCase() || "U"
                        )}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{user.name}</div>
                    </button>

                    {menuOpen && (
                      <div className="topbar-user-menu" style={{ position: "absolute", right: 0, marginTop: 8, zIndex: 50 }}>
                        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 8, padding: 8, minWidth: 160, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                          <Link to="/me" onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "8px 10px", textDecoration: "none", color: "inherit", borderRadius: 4 }}>
                            Hồ sơ của tôi
                          </Link>
                          <div style={{ height: 1, background: "var(--border)", margin: "6px 0" }} />
                          <button
                            type="button"
                            onClick={() => {
                              logout();
                              window.location.reload();
                            }}
                            style={{ width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "transparent", cursor: "pointer", borderRadius: 4 }}
                          >
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="container">
        <div className="row">
          {/* Left column (optional) */}
          {left && (
            <div style={{ width: 280, position: "sticky", top: 78, alignSelf: "flex-start" }} className="left-col hide-left">
              {left}
            </div>
          )}

          {/* Main */}
          <div className="main-content">{children}</div>

          {/* Right column (Banner Carousel) - hidden on admin pages */}
          {showBanner && (
            <div style={{ width: 280, position: "sticky", top: 78, alignSelf: "flex-start" }} className="right-col hide-right">
              <BannerCarousel />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
