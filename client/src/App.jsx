import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FeedPage from "./pages/FeedPage";
import RestaurantsPage from "./pages/RestaurantsPage";
import RestaurantDetailPage from "./pages/RestaurantDetailPage";
import AdminPage from "./pages/admin/AdminPage";
import AdminReportsPage from "./pages/admin/AdminReportsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PostDetailPage from "./pages/PostDetailPage";
import KeoAnPage from "./pages/KeoAnPage";
import ProfilePage from "./pages/ProfilePage";
import ChatPage from "./pages/ChatPage";

function Placeholder({ title }) {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ margin: 0 }}>{title}</h2>
      <p style={{ marginTop: 8, color: "#666" }}>Trang này mình sẽ làm tiếp sau.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Share link: cho phép mở link bài viết */}
      <Route path="/posts/:id" element={<PostDetailPage />} />

      {/* Public pages (feed and restaurants are viewable by guests) */}
      <Route path="/feed" element={<FeedPage />} />
      <Route path="/restaurants" element={<RestaurantsPage />} />
      <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />

      <Route
        path="/keo-an"
        element={
          <ProtectedRoute>
            <KeoAnPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/me"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users/:id"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute role="admin">
            <AdminReportsPage />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/feed" />} />
      <Route path="*" element={<Navigate to="/feed" />} />
    </Routes>
  );
}
