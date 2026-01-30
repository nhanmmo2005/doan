import { useEffect, useState } from "react";
import AppLayout from "../../components/AppLayout";
import { http } from "../../api/http";
import Button from "../../components/ui/Button";
import {
  FaUsers,
  FaNewspaper,
  FaUtensils,
  FaCalendarAlt,
  FaComments,
  FaChartBar,
  FaCheck,
  FaTimes,
  FaLock,
  FaUnlock,
  FaTrash,
  FaStar,
  FaEye,
  FaEyeSlash,
  FaStarHalfAlt,
  FaEdit,
  FaPlus,
  FaTag,
} from "react-icons/fa";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Data states
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [eatingPlans, setEatingPlans] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [banners, setBanners] = useState([]);

  // Banner CRUD states
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [bannerForm, setBannerForm] = useState({
    restaurant_id: "",
    title: "",
    description: "",
    banner_type: "promotion",
    image_url: "",
    link_url: "",
    start_date: "",
    end_date: "",
    sort_order: 0,
    is_active: true,
  });

  // Restaurant CRUD states
  const [showRestaurantForm, setShowRestaurantForm] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState(null);
  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    type: "",
    area: "",
    price_range: "",
    address: "",
    meal_time: "all",
    latitude: "",
    longitude: "",
    image_url: "",
    is_featured: false,
  });

  // Load stats
  async function loadStats() {
    try {
      const res = await http.get("/api/admin/stats");
      setStats(res.data);
    } catch (e) {
      console.error("Load stats error:", e);
    }
  }

  // Load posts
  async function loadPosts() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get("/api/admin/posts", {
        params: { limit: 100 },
      });
      setPosts(res.data);
    } catch (e) {
      setErr(e?.response?.data?.msg || "Không tải được danh sách bài viết");
    } finally {
      setLoading(false);
    }
  }

  // Load users
  async function loadUsers() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get("/api/admin/users", {
        params: { limit: 100 },
      });
      setUsers(res.data);
    } catch (e) {
      setErr(e?.response?.data?.msg || "Không tải được danh sách người dùng");
    } finally {
      setLoading(false);
    }
  }

  // Load restaurants
  async function loadRestaurants() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get("/api/admin/restaurants", {
        params: { limit: 100 },
      });
      setRestaurants(res.data);
    } catch (e) {
      setErr(e?.response?.data?.msg || "Không tải được danh sách quán ăn");
    } finally {
      setLoading(false);
    }
  }

  // Load eating plans
  async function loadEatingPlans() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get("/api/admin/eating-plans", {
        params: { limit: 100 },
      });
      setEatingPlans(res.data);
    } catch (e) {
      setErr(e?.response?.data?.msg || "Không tải được danh sách kèo ăn");
    } finally {
      setLoading(false);
    }
  }

  // Load chat rooms
  async function loadChatRooms() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get("/api/admin/chat-rooms");
      setChatRooms(res.data);
    } catch (e) {
      setErr(e?.response?.data?.msg || "Không tải được danh sách phòng chat");
    } finally {
      setLoading(false);
    }
  }

  // Post actions
  async function updatePostStatus(postId, status) {
    try {
      await http.patch(`/api/admin/posts/${postId}/status`, { status });
      await loadPosts();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Cập nhật thất bại");
    }
  }

  async function updatePostVisibility(postId, visibility) {
    try {
      await http.patch(`/api/admin/posts/${postId}/visibility`, { visibility });
      await loadPosts();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Cập nhật thất bại");
    }
  }

  async function deletePost(postId) {
    if (!confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      await http.delete(`/api/admin/posts/${postId}`);
      await loadPosts();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Xóa thất bại");
    }
  }

  // User actions
  async function toggleUserLock(userId, locked) {
    try {
      await http.patch(`/api/admin/users/${userId}/lock`, { locked: !locked });
      await loadUsers();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Cập nhật thất bại");
    }
  }

  async function changeUserRole(userId, newRole) {
    try {
      await http.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      await loadUsers();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Cập nhật thất bại");
    }
  }

  async function deleteUser(userId) {
    if (!confirm("Bạn có chắc muốn xóa người dùng này?")) return;
    try {
      await http.delete(`/api/admin/users/${userId}`);
      await loadUsers();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Xóa thất bại");
    }
  }

  // Restaurant actions
  async function toggleFeatured(restaurantId, featured) {
    try {
      await http.patch(`/api/admin/restaurants/${restaurantId}/featured`, {
        featured: !featured,
      });
      await loadRestaurants();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Cập nhật thất bại");
    }
  }

  async function deleteRestaurant(restaurantId) {
    if (!confirm("Bạn có chắc muốn xóa quán ăn này?")) return;
    try {
      await http.delete(`/api/admin/restaurants/${restaurantId}`);
      await loadRestaurants();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Xóa thất bại");
    }
  }

  // Eating plan actions
  async function deleteEatingPlan(planId) {
    if (!confirm("Bạn có chắc muốn xóa kèo ăn này?")) return;
    try {
      await http.delete(`/api/admin/eating-plans/${planId}`);
      await loadEatingPlans();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Xóa thất bại");
    }
  }

  // Chat room actions
  async function deleteChatRoom(roomId) {
    if (!confirm("Bạn có chắc muốn xóa phòng chat này?")) return;
    try {
      await http.delete(`/api/admin/chat-rooms/${roomId}`);
      await loadChatRooms();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Xóa thất bại");
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  // Load reviews
  async function loadReviews() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get("/api/admin/reviews", {
        params: { limit: 100 },
      });
      setReviews(res.data);
    } catch (e) {
      setErr(e?.response?.data?.msg || "Không tải được danh sách đánh giá");
    } finally {
      setLoading(false);
    }
  }

  // Load banners
  async function loadBanners() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get("/api/banners/admin/all");
      setBanners(res.data);
    } catch (e) {
      setErr(e?.response?.data?.msg || "Không tải được danh sách banners");
    } finally {
      setLoading(false);
    }
  }

  async function deleteBanner(bannerId) {
    if (!confirm("Bạn có chắc muốn xóa banner này?")) return;
    try {
      await http.delete(`/api/banners/admin/${bannerId}`);
      await loadBanners();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Xóa thất bại");
    }
  }

  async function toggleBannerActive(bannerId, currentActive) {
    try {
      await http.put(`/api/banners/admin/${bannerId}`, {
        is_active: !currentActive,
      });
      await loadBanners();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Cập nhật thất bại");
    }
  }

  // Review actions
  async function updateReviewStatus(reviewId, status) {
    try {
      await http.patch(`/api/admin/reviews/${reviewId}/status`, { status });
      await loadReviews();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Cập nhật thất bại");
    }
  }

  async function deleteReview(reviewId) {
    if (!confirm("Bạn có chắc muốn xóa đánh giá này?")) return;
    try {
      await http.delete(`/api/admin/reviews/${reviewId}`);
      await loadReviews();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Xóa thất bại");
    }
  }

  // Restaurant CRUD
  function openRestaurantForm(restaurant = null) {
    if (restaurant) {
      setEditingRestaurant(restaurant);
      setRestaurantForm({
        name: restaurant.name || "",
        type: restaurant.type || "",
        area: restaurant.area || "",
        price_range: restaurant.price_range || "",
        address: restaurant.address || "",
        meal_time: restaurant.meal_time || "all",
        latitude: restaurant.latitude || "",
        longitude: restaurant.longitude || "",
        image_url: restaurant.image_url || "",
        is_featured: restaurant.is_featured || false,
      });
    } else {
      setEditingRestaurant(null);
      setRestaurantForm({
        name: "",
        type: "",
        area: "",
        price_range: "",
        address: "",
        meal_time: "all",
        latitude: "",
        longitude: "",
        image_url: "",
        is_featured: false,
      });
    }
    setShowRestaurantForm(true);
  }

  async function saveRestaurant() {
    try {
      const data = {
        ...restaurantForm,
        latitude: restaurantForm.latitude ? parseFloat(restaurantForm.latitude) : null,
        longitude: restaurantForm.longitude ? parseFloat(restaurantForm.longitude) : null,
      };

      if (editingRestaurant) {
        await http.put(`/api/admin/restaurants/${editingRestaurant.id}`, data);
      } else {
        await http.post(`/api/admin/restaurants`, data);
      }
      setShowRestaurantForm(false);
      await loadRestaurants();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Lưu thất bại");
    }
  }

  // Banner CRUD functions
  function openBannerForm(banner = null) {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        restaurant_id: banner.restaurant_id || "",
        title: banner.title || "",
        description: banner.description || "",
        banner_type: banner.banner_type || "promotion",
        image_url: banner.image_url || "",
        link_url: banner.link_url || "",
        start_date: banner.start_date ? banner.start_date.slice(0, 16) : "",
        end_date: banner.end_date ? banner.end_date.slice(0, 16) : "",
        sort_order: banner.sort_order || 0,
        is_active: banner.is_active !== undefined ? banner.is_active : true,
      });
    } else {
      setEditingBanner(null);
      setBannerForm({
        restaurant_id: "",
        title: "",
        description: "",
        banner_type: "promotion",
        image_url: "",
        link_url: "",
        start_date: "",
        end_date: "",
        sort_order: 0,
        is_active: true,
      });
    }
    setShowBannerForm(true);
  }

  async function saveBanner() {
    try {
      if (!bannerForm.title) {
        setErr("Vui lòng điền tiêu đề");
        return;
      }

      const data = {
        ...bannerForm,
        restaurant_id: bannerForm.restaurant_id ? Number(bannerForm.restaurant_id) : null,
        sort_order: Number(bannerForm.sort_order) || 0,
        start_date: bannerForm.start_date || null,
        end_date: bannerForm.end_date || null,
      };

      if (editingBanner) {
        await http.put(`/api/banners/admin/${editingBanner.id}`, data);
      } else {
        await http.post(`/api/banners/admin`, data);
      }
      setShowBannerForm(false);
      await loadBanners();
      setErr("");
    } catch (e) {
      setErr(e?.response?.data?.msg || "Lưu thất bại");
    }
  }

  useEffect(() => {
    if (activeTab === "posts") loadPosts();
    if (activeTab === "users") loadUsers();
    if (activeTab === "restaurants") loadRestaurants();
    if (activeTab === "eating-plans") loadEatingPlans();
    if (activeTab === "chat") loadChatRooms();
    if (activeTab === "reviews") loadReviews();
    if (activeTab === "banners") loadBanners();
  }, [activeTab]);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: FaChartBar },
    { id: "posts", label: "Bài viết", icon: FaNewspaper },
    { id: "reviews", label: "Đánh giá", icon: FaStar },
    { id: "users", label: "Người dùng", icon: FaUsers },
    { id: "restaurants", label: "Quán ăn", icon: FaUtensils },
    { id: "banners", label: "Banners", icon: FaTag },
    { id: "settings", label: "Branding", icon: FaEdit },
    { id: "eating-plans", label: "Kèo ăn", icon: FaCalendarAlt },
    { id: "chat", label: "Chat", icon: FaComments },
  ];

  return (
    <AppLayout>
      <div className="admin-page">
        <div className="admin-header">
          <h1>🛠️ Admin Dashboard</h1>
          <p>Quản lý toàn bộ hệ thống</p>
        </div>

        <div className="admin-tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon /> {tab.label}
              </Button>
            );
          })}
        </div>

        {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}

        {activeTab === "dashboard" && (
          <div className="admin-dashboard">
            {stats && (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <FaUsers className="stat-icon" />
                    <div className="stat-content">
                      <div className="stat-value">{stats.users?.total || 0}</div>
                      <div className="stat-label">Người dùng</div>
                      <div className="stat-detail">
                        {stats.users?.admins || 0} admin, {stats.users?.locked || 0} bị khóa
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <FaNewspaper className="stat-icon" />
                    <div className="stat-content">
                      <div className="stat-value">{stats.posts?.total || 0}</div>
                      <div className="stat-label">Bài viết</div>
                      <div className="stat-detail">
                        {stats.posts?.pending || 0} chờ duyệt, {stats.posts?.hidden || 0} ẩn
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <FaStar className="stat-icon" />
                    <div className="stat-content">
                      <div className="stat-value">{stats.reviews?.total || 0}</div>
                      <div className="stat-label">Đánh giá</div>
                      <div className="stat-detail">
                        {stats.reviews?.pending || 0} chờ duyệt, {stats.reviews?.approved || 0} đã duyệt
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <FaUtensils className="stat-icon" />
                    <div className="stat-content">
                      <div className="stat-value">{stats.restaurants?.total || 0}</div>
                      <div className="stat-label">Quán ăn</div>
                      <div className="stat-detail">
                        {stats.restaurants?.featured || 0} nổi bật
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <FaCalendarAlt className="stat-icon" />
                    <div className="stat-content">
                      <div className="stat-value">{stats.eatingPlans?.total || 0}</div>
                      <div className="stat-label">Kèo ăn</div>
                      <div className="stat-detail">
                        {stats.eatingPlans?.open || 0} đang mở
                      </div>
                    </div>
                  </div>

                  <div className="stat-card">
                    <FaComments className="stat-icon" />
                    <div className="stat-content">
                      <div className="stat-value">{stats.chat?.total_rooms || 0}</div>
                      <div className="stat-label">Phòng chat</div>
                      <div className="stat-detail">
                        {stats.chat?.total_messages || 0} tin nhắn
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "posts" && (
          <div className="admin-content">
            <div className="admin-actions">
              <Button variant="primary" size="md" onClick={loadPosts}>↻ Tải lại</Button>
            </div>
            {loading ? (
              <div>Đang tải...</div>
            ) : (
              <div className="admin-list">
                {posts.map((post) => (
                  <div key={post.id} className="admin-item">
                    <div className="admin-item-header">
                      <div>
                        <strong>{post.author_name}</strong>
                        {post.restaurant_name && ` • ${post.restaurant_name}`}
                        {post.rating && ` • ⭐${post.rating}`}
                      </div>
                      <div className="admin-badges">
                        <span className={`badge badge-${post.status}`}>{post.status}</span>
                        <span className={`badge badge-${post.visibility}`}>{post.visibility}</span>
                      </div>
                    </div>
                    <p>{post.content}</p>
                    <div className="admin-item-footer">
                      <span>
                        ID: {post.id} • {new Date(post.created_at).toLocaleString()}
                      </span>
                      <div className="admin-actions-group">
                        {post.status === "pending" && (
                          <>
                            <Button onClick={() => updatePostStatus(post.id, "approved")} variant="success" size="sm"><FaCheck /> Duyệt</Button>
                            <Button onClick={() => updatePostStatus(post.id, "rejected")} variant="danger" size="sm"><FaTimes /> Từ chối</Button>
                          </>
                        )}
                        <Button
                          onClick={() =>
                            updatePostVisibility(
                              post.id,
                              post.visibility === "public" ? "hidden" : "public"
                            )
                          }
                          variant="secondary"
                          size="sm"
                        >
                          {post.visibility === "public" ? <FaEyeSlash /> : <FaEye />}{" "}
                          {post.visibility === "public" ? "Ẩn" : "Hiện"}
                        </Button>
                        <Button onClick={() => deletePost(post.id)} variant="danger" size="sm"><FaTrash /> Xóa</Button>
                      </div>
                    </div>
                  </div>
                ))}
                {posts.length === 0 && <div className="empty-state">Không có bài viết nào</div>}
              </div>
            )}
          </div>
        )}

        {activeTab === "users" && (
          <div className="admin-content">
            <div className="admin-actions">
              <Button variant="primary" size="md" onClick={loadUsers}>↻ Tải lại</Button>
            </div>
            {loading ? (
              <div>Đang tải...</div>
            ) : (
              <div className="admin-list">
                {users.map((user) => (
                  <div key={user.id} className="admin-item">
                    <div className="admin-item-header">
                      <div>
                        <strong>{user.name}</strong> ({user.email})
                        <div className="admin-meta">
                          {user.post_count || 0} bài viết • {user.eating_plan_count || 0} kèo ăn •{" "}
                          {user.review_count || 0} đánh giá
                        </div>
                      </div>
                      <div className="admin-badges">
                        <span className={`badge badge-${user.role}`}>{user.role}</span>
                        {user.locked && <span className="badge badge-locked">Khóa</span>}
                      </div>
                    </div>
                    <div className="admin-item-footer">
                      <span>
                        ID: {user.id} • {new Date(user.created_at).toLocaleString()}
                      </span>
                      <div className="admin-actions-group">
                        <Button onClick={() => toggleUserLock(user.id, user.locked)} variant={user.locked ? "success" : "warning"} size="sm">
                          {user.locked ? <FaUnlock /> : <FaLock />}{" "}
                          {user.locked ? "Mở khóa" : "Khóa"}
                        </Button>
                        {user.role === "user" ? (
                          <Button onClick={() => changeUserRole(user.id, "admin")} variant="primary" size="sm">
                            Thăng admin
                          </Button>
                        ) : (
                          <Button onClick={() => changeUserRole(user.id, "user")} variant="secondary" size="sm">
                            Hạ quyền
                          </Button>
                        )}
                        <Button onClick={() => deleteUser(user.id)} variant="danger" size="sm">
                          <FaTrash /> Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {users.length === 0 && <div className="empty-state">Không có người dùng nào</div>}
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="admin-content">
            <div className="admin-actions">
              <Button variant="primary" size="md" onClick={loadReviews}>↻ Tải lại</Button>
            </div>
            {loading ? (
              <div>Đang tải...</div>
            ) : (
              <div className="admin-list">
                {reviews.map((review) => (
                  <div key={review.id} className="admin-item">
                    <div className="admin-item-header">
                      <div>
                        <strong>{review.author_name}</strong> • {review.restaurant_name}
                        <div className="admin-meta">
                          ⭐{review.rating}/5
                          {review.price_rating &&
                            ` (Giá: ${review.price_rating}, Món: ${review.food_rating || "N/A"}, Vệ sinh: ${
                              review.hygiene_rating || "N/A"
                            })`}
                          • {review.media_count || 0} ảnh/video • {review.comment_count || 0} bình luận
                        </div>
                      </div>
                      <div className="admin-badges">
                        <span className={`badge badge-${review.status}`}>{review.status}</span>
                      </div>
                    </div>
                    {review.comment && <p>{review.comment}</p>}
                    {review.media && review.media.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                        {review.media.map((m, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: 100,
                              height: 100,
                              borderRadius: 8,
                              overflow: "hidden",
                              border: "1px solid var(--border)",
                            }}
                          >
                            {m.type === "image" ? (
                              <img src={m.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <video src={m.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} controls />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="admin-item-footer">
                      <span>
                        ID: {review.id} • {new Date(review.created_at).toLocaleString()}
                      </span>
                      <div className="admin-actions-group">
                        {review.status === "pending" && (
                          <>
                            <Button onClick={() => updateReviewStatus(review.id, "approved")} variant="success" size="sm"><FaCheck /> Duyệt</Button>
                            <Button onClick={() => updateReviewStatus(review.id, "rejected")} variant="danger" size="sm"><FaTimes /> Từ chối</Button>
                          </>
                        )}
                        <Button onClick={() => deleteReview(review.id)} variant="danger" size="sm"><FaTrash /> Xóa</Button>
                      </div>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && <div className="empty-state">Không có đánh giá nào</div>}
              </div>
            )}
          </div>
        )}

        {activeTab === "restaurants" && (
          <div className="admin-content">
            <div className="admin-actions">
              <Button variant="primary" size="md" onClick={() => openRestaurantForm()}><FaPlus /> Thêm quán ăn</Button>
              <Button variant="secondary" size="md" onClick={loadRestaurants}>↻ Tải lại</Button>
            </div>
            {loading ? (
              <div>Đang tải...</div>
            ) : (
              <div className="admin-list">
                {restaurants.map((restaurant) => (
                  <div key={restaurant.id} className="admin-item">
                    <div className="admin-item-header">
                      <div>
                        <strong>{restaurant.name}</strong>
                        <div className="admin-meta">
                          {restaurant.type} • {restaurant.area} • {restaurant.price_range}
                          {restaurant.avg_rating &&
                            ` • ⭐${restaurant.avg_rating} (${restaurant.review_count_actual || 0} đánh giá)`}
                        </div>
                      </div>
                      <div className="admin-badges">{restaurant.is_featured && <span className="badge badge-featured">Nổi bật</span>}</div>
                    </div>
                    <div className="admin-item-footer">
                      <span>
                        ID: {restaurant.id} • {new Date(restaurant.created_at).toLocaleString()}
                      </span>
                      <div className="admin-actions-group">
                        <Button onClick={() => openRestaurantForm(restaurant)} variant="secondary" size="sm"><FaEdit /> Sửa</Button>
                        <Button
                          onClick={() => toggleFeatured(restaurant.id, restaurant.is_featured)}
                          variant={restaurant.is_featured ? "secondary" : "primary"}
                          size="sm"
                        >
                          <FaStar /> {restaurant.is_featured ? "Bỏ nổi bật" : "Nổi bật"}
                        </Button>
                        <Button onClick={() => deleteRestaurant(restaurant.id)} variant="danger" size="sm"><FaTrash /> Xóa</Button>
                      </div>
                    </div>
                  </div>
                ))}
                {restaurants.length === 0 && <div className="empty-state">Không có quán ăn nào</div>}
              </div>
            )}
          </div>
        )}

        {showRestaurantForm && (
          <div className="modal-backdrop" onClick={() => setShowRestaurantForm(false)}>
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2>{editingRestaurant ? "Sửa quán ăn" : "Thêm quán ăn mới"}</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowRestaurantForm(false)} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer" }}>
                  ×
                </Button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Tên quán *</label>
                  <input
                    type="text"
                    value={restaurantForm.name}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                    style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Loại</label>
                    <input
                      type="text"
                      value={restaurantForm.type}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, type: e.target.value })}
                      style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                      placeholder="Ví dụ: Mì Quảng"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Khu vực</label>
                    <input
                      type="text"
                      value={restaurantForm.area}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, area: e.target.value })}
                      style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                      placeholder="Ví dụ: Hải Châu"
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Giá</label>
                    <select
                      value={restaurantForm.price_range}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, price_range: e.target.value })}
                      style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                    >
                      <option value="">Chọn mức giá</option>
                      <option value="Dưới 30k">Dưới 30k</option>
                      <option value="30-50k">30-50k</option>
                      <option value="50-100k">50-100k</option>
                      <option value="100-200k">100-200k</option>
                      <option value="200k+">200k+</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Thời gian</label>
                    <select
                      value={restaurantForm.meal_time}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, meal_time: e.target.value })}
                      style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                    >
                      <option value="all">Tất cả</option>
                      <option value="sang">Sáng</option>
                      <option value="trua">Trưa</option>
                      <option value="toi">Tối</option>
                      <option value="vat">Ăn vặt</option>
                      <option value="henho">Hẹn hò</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Địa chỉ</label>
                  <input
                    type="text"
                    value={restaurantForm.address}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })}
                    style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                    placeholder="Ví dụ: 123 Lê Duẩn, Hải Châu, Đà Nẵng"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Vĩ độ</label>
                    <input
                      type="number"
                      step="any"
                      value={restaurantForm.latitude}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, latitude: e.target.value })}
                      style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                      placeholder="16.0689"
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Kinh độ</label>
                    <input
                      type="number"
                      step="any"
                      value={restaurantForm.longitude}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, longitude: e.target.value })}
                      style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                      placeholder="108.2221"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>URL ảnh</label>
                  <input
                    type="url"
                    value={restaurantForm.image_url}
                    onChange={(e) => setRestaurantForm({ ...restaurantForm, image_url: e.target.value })}
                    style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={restaurantForm.is_featured}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, is_featured: e.target.checked })}
                    />
                    <span>Đánh dấu nổi bật</span>
                  </label>
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                  <Button onClick={() => setShowRestaurantForm(false)} variant="secondary" size="sm">
                    Hủy
                  </Button>
                  <Button onClick={saveRestaurant} variant="primary" size="md">
                    {editingRestaurant ? "Cập nhật" : "Thêm mới"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "banners" && (
          <div className="admin-content">
            <div className="admin-actions">
              <Button variant="primary" size="md" onClick={() => openBannerForm()}><FaPlus /> Thêm banner mới</Button>
              <Button variant="secondary" size="md" onClick={loadBanners}>↻ Tải lại</Button>
            </div>
            {loading ? (
              <div>Đang tải...</div>
            ) : (
              <div className="admin-list">
                {banners.map((banner) => (
                  <div key={banner.id} className="admin-item">
                    <div className="admin-item-header">
                      <div>
                        <strong>{banner.title}</strong>
                        <div className="admin-meta">
                          {banner.restaurant_name ? `${banner.restaurant_name} • ` : ""}
                          {banner.banner_type === "promotion" ? "Khuyến mãi" : "Booking"}
                          {banner.start_date && ` • Từ ${new Date(banner.start_date).toLocaleDateString()}`}
                          {banner.end_date && ` đến ${new Date(banner.end_date).toLocaleDateString()}`}
                        </div>
                      </div>
                      <div className="admin-badges">
                        <span className={`badge ${banner.is_active ? "badge-approved" : "badge-rejected"}`}>
                          {banner.is_active ? "Đang hiển thị" : "Ẩn"}
                        </span>
                      </div>
                    </div>

                    {banner.description && <p>{banner.description}</p>}

                    {banner.image_url && (
                      <div style={{ marginTop: 8 }}>
                        <img src={banner.image_url} alt={banner.title} style={{ maxWidth: 200, borderRadius: 8 }} />
                      </div>
                    )}

                    <div className="admin-item-footer">
                      <span>ID: {banner.id} • Thứ tự: {banner.sort_order}</span>
                      <div className="admin-actions-group">
                        <Button onClick={() => openBannerForm(banner)} variant="secondary" size="sm"><FaEdit /> Sửa</Button>
                        <Button
                          onClick={() => toggleBannerActive(banner.id, banner.is_active)}
                          variant={banner.is_active ? "secondary" : "primary"}
                          size="sm"
                        >
                          {banner.is_active ? <FaEyeSlash /> : <FaEye />} {banner.is_active ? "Ẩn" : "Hiện"}
                        </Button>
                        <Button onClick={() => deleteBanner(banner.id)} variant="danger" size="sm"><FaTrash /> Xóa</Button>
                      </div>
                    </div>
                  </div>
                ))}
                {banners.length === 0 && <div className="empty-state">Chưa có banner nào</div>}
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="admin-content">
            <div className="admin-actions">
              <Button variant="primary" size="md" onClick={() => {
                const stored = localStorage.getItem("siteBrand");
                alert(stored ? "Hiện cấu hình brand: " + stored : "Chưa có cấu hình brand");
              }}>Xem cấu hình hiện tại</Button>
            </div>

            <BrandingEditor />
          </div>
        )}

        {/* Banner Form Modal */}
        {showBannerForm && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setShowBannerForm(false)}
          >
            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 24,
                maxWidth: 600,
                width: "90%",
                maxHeight: "90vh",
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ marginTop: 0 }}>{editingBanner ? "Sửa banner" : "Thêm banner mới"}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Tiêu đề *</label>
                  <input
                    type="text"
                    value={bannerForm.title}
                    onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                    style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                    placeholder="VD: Giảm 20% hôm nay"
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Mô tả</label>
                  <textarea
                    value={bannerForm.description}
                    onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
                    style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8, minHeight: 80 }}
                    placeholder="Mô tả chi tiết về khuyến mãi/booking..."
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Loại</label>
                    <select
                      value={bannerForm.banner_type}
                      onChange={(e) => setBannerForm({ ...bannerForm, banner_type: e.target.value })}
                      style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                    >
                      <option value="promotion">Khuyến mãi</option>
                      <option value="booking">Nhận booking</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Thứ tự hiển thị</label>
                    <input
                      type="number"
                      value={bannerForm.sort_order}
                      onChange={(e) => setBannerForm({ ...bannerForm, sort_order: parseInt(e.target.value) || 0 })}
                      style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Ảnh banner (URL)</label>
                  <input
                    type="url"
                    value={bannerForm.image_url}
                    onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                    style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Link khi click (URL, tùy chọn)</label>
                  <input
                    type="url"
                    value={bannerForm.link_url}
                    onChange={(e) => setBannerForm({ ...bannerForm, link_url: e.target.value })}
                    style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                    placeholder="https://example.com hoặc để trống sẽ link đến trang quán"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Ngày bắt đầu</label>
                    <input
                      type="datetime-local"
                      value={bannerForm.start_date}
                      onChange={(e) => setBannerForm({ ...bannerForm, start_date: e.target.value })}
                      style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Ngày kết thúc</label>
                    <input
                      type="datetime-local"
                      value={bannerForm.end_date}
                      onChange={(e) => setBannerForm({ ...bannerForm, end_date: e.target.value })}
                      style={{ width: "100%", padding: 10, border: "1px solid var(--border)", borderRadius: 8 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={bannerForm.is_active}
                      onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })}
                    />
                    <span>Hiển thị banner</span>
                  </label>
                </div>

                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                  <Button onClick={() => setShowBannerForm(false)} variant="secondary" size="sm">Hủy</Button>
                  <Button onClick={saveBanner} variant="primary" size="md">{editingBanner ? "Cập nhật" : "Thêm mới"}</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "eating-plans" && (
          <div className="admin-content">
            <div className="admin-actions">
              <Button variant="primary" size="md" onClick={loadEatingPlans}>↻ Tải lại</Button>
            </div>
            {loading ? (
              <div>Đang tải...</div>
            ) : (
              <div className="admin-list">
                {eatingPlans.map((plan) => (
                  <div key={plan.id} className="admin-item">
                    <div className="admin-item-header">
                      <div>
                        <strong>{plan.title}</strong>
                        <div className="admin-meta">
                          {plan.creator_name} • {plan.restaurant_name || "Không có quán"} •{" "}
                          {plan.participant_count || 0} người tham gia
                        </div>
                      </div>
                      <div className="admin-badges">
                        <span className={`badge badge-${plan.status}`}>{plan.status}</span>
                      </div>
                    </div>
                    {plan.description && <p>{plan.description}</p>}
                    <div className="admin-item-footer">
                      <span>
                        ID: {plan.id} • {new Date(plan.planned_at).toLocaleString()}
                      </span>
                      <div className="admin-actions-group">
                        <Button onClick={() => deleteEatingPlan(plan.id)} variant="danger" size="sm"><FaTrash /> Xóa</Button>
                      </div>
                    </div>
                  </div>
                ))}
                {eatingPlans.length === 0 && <div className="empty-state">Không có kèo ăn nào</div>}
              </div>
            )}
          </div>
        )}

        {activeTab === "chat" && (
          <div className="admin-content">
            <div className="admin-actions">
              <Button variant="primary" size="md" onClick={loadChatRooms}>↻ Tải lại</Button>
            </div>
            {loading ? (
              <div>Đang tải...</div>
            ) : (
              <div className="admin-list">
                {chatRooms.map((room) => (
                  <div key={room.id} className="admin-item">
                    <div className="admin-item-header">
                      <div>
                        <strong>{room.name}</strong>
                        <div className="admin-meta">
                          {room.creator_name} • {room.message_count || 0} tin nhắn
                        </div>
                      </div>
                      <div className="admin-badges">
                        <span className={`badge badge-${room.status}`}>{room.status}</span>
                      </div>
                    </div>
                    {room.description && <p>{room.description}</p>}
                    <div className="admin-item-footer">
                      <span>
                        ID: {room.id} • {new Date(room.created_at).toLocaleString()}
                      </span>
                      <div className="admin-actions-group">
                        <Button onClick={() => deleteChatRoom(room.id)} variant="danger" size="sm"><FaTrash /> Xóa</Button>
                      </div>
                    </div>
                  </div>
                ))}
                {chatRooms.length === 0 && <div className="empty-state">Không có phòng chat nào</div>}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
