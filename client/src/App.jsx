import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FeedPage from "./pages/FeedPage";
import RestaurantsPage from "./pages/RestaurantsPage";
import RestaurantDetailPage from "./pages/RestaurantDetailPage";
import AdminPage from "./pages/admin/AdminPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PostDetailPage from "./pages/PostDetailPage";

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

      {/* Private */}
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <FeedPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurants"
        element={
          <ProtectedRoute>
            <RestaurantsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/restaurants/:id"
        element={
          <ProtectedRoute>
            <RestaurantDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Chưa làm thì tạm placeholder */}
      <Route
        path="/keo-an"
        element={
          <ProtectedRoute>
            <Placeholder title="Kèo ăn" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Placeholder title="Chat" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/me"
        element={
          <ProtectedRoute>
            <Placeholder title="Cá nhân" />
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

      <Route path="/" element={<Navigate to="/feed" />} />
      <Route path="*" element={<Navigate to="/feed" />} />
    </Routes>
  );
}
