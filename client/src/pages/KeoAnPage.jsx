// client/src/pages/KeoAnPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { http } from "../api/http";
import { getUser } from "../auth";
import EatingPlanCommentBox from "../components/EatingPlanCommentBox";
import {
  FaHandshake,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaTrash,
  FaEllipsisV,
  FaCheckCircle,
  FaTimesCircle,
  FaComments,
  FaMoneyBillWave,
  FaTimes,
  FaFlag,
} from "react-icons/fa";
import Button from "../components/ui/Button";
import ReportModal from "../components/ReportModal";

function fmtDateTime(dt) {
  try {
    const d = new Date(dt);
    return isNaN(d.getTime()) ? "" : d.toLocaleString("vi-VN");
  } catch {
    return "";
  }
}

function fmtDate(dt) {
  try {
    const d = new Date(dt);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
  } catch {
    return "";
  }
}

function fmtTime(dt) {
  try {
    const d = new Date(dt);
    return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function KeoAnCard({ plan, onChanged, initialShowComments = false, focusCommentId }) {
  const me = getUser();
  const isJoined = plan.is_joined;
  const isCreator = plan.is_creator;
  const canJoin = !isJoined && !isCreator && plan.status === "open" && new Date(plan.planned_at) > new Date();
  const canLeave = isJoined && !isCreator;
  const isPast = new Date(plan.planned_at) < new Date();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showComments, setShowComments] = useState(initialShowComments);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (initialShowComments) setShowComments(true);
  }, [initialShowComments]);

  async function handleJoin() {
    try {
      await http.post(`/api/eating-plans/${plan.id}/join`);
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.msg || "Tham gia thất bại");
    }
  }

  async function handleLeave() {
    if (!confirm("Bạn có chắc muốn rời kèo ăn này?")) return;
    try {
      await http.post(`/api/eating-plans/${plan.id}/leave`);
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.msg || "Rời thất bại");
    }
  }

  async function handleDelete() {
    if (!confirm("Xoá kèo ăn này?")) return;
    try {
      await http.delete(`/api/eating-plans/${plan.id}`);
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.msg || "Xoá thất bại");
    }
  }

  const statusColors = {
    open: "#10b981",
    closed: "#6b7280",
    completed: "#2563eb",
    cancelled: "#dc2626",
  };

  const statusTexts = {
    open: "Đang mở",
    closed: "Đã đóng",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
  };

  const location = plan.location || plan.restaurant_name || "";

  return (
    <div id={`plan-${plan.id}`} className="card keo-an-card">
      <div className="keo-an-header">
        <div className="keo-an-title-row">
          <h3 className="keo-an-title">{plan.title}</h3>
          {me && (
            <div className="menuWrap">
              <button
                type="button"
                className="btn-menu-trigger"
                onClick={() => setMenuOpen((x) => !x)}
                title="Tùy chọn"
              >
                <FaEllipsisV />
              </button>
              {menuOpen && (
                <>
                  <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
                  <div className="menu menu-post">
                    {isCreator ? (
                      <button
                        type="button"
                        className="menuItem danger"
                        onClick={() => {
                          handleDelete();
                          setMenuOpen(false);
                        }}
                      >
                        <span className="menuIcon">
                          <FaTrash />
                        </span>
                        <span>Xoá kèo</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="menuItem"
                        onClick={() => {
                          setShowReport(true);
                          setMenuOpen(false);
                        }}
                      >
                        <span className="menuIcon">
                          <FaFlag />
                        </span>
                        <span>Báo cáo kèo</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <div className="keo-an-meta">
          <span className="keo-an-creator" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            {plan.creator_avatar ? (
              <img
                src={plan.creator_avatar}
                alt={plan.creator_name || "Avatar"}
                style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span aria-hidden>👤</span>
            )}
            <span>{plan.creator_name}</span>
          </span>
          <span className="keo-an-status" style={{ color: statusColors[plan.status] || "#666" }}>
            {statusTexts[plan.status] || plan.status}
          </span>
        </div>
      </div>

      {plan.description && <div className="keo-an-description">{plan.description}</div>}

      <div className="keo-an-info">
        {location && (
          <div className="keo-an-info-item">
            <FaMapMarkerAlt className="keo-an-icon" />
            <span>{location}</span>
            {plan.restaurant_area && <span style={{ color: "var(--muted)" }}> ({plan.restaurant_area})</span>}
          </div>
        )}

        <div className="keo-an-info-item">
          <FaCalendarAlt className="keo-an-icon" />
          <span>
            {fmtDate(plan.planned_at)} lúc {fmtTime(plan.planned_at)}
          </span>
          {isPast && plan.status === "open" && (
            <span className="keo-an-badge" style={{ marginLeft: 8 }}>
              Đã qua
            </span>
          )}
        </div>

        <div className="keo-an-info-item">
          <FaUsers className="keo-an-icon" />
          <span>
            {plan.participant_count || 0}
            {plan.max_participants ? ` / ${plan.max_participants}` : ""} người tham gia
          </span>
        </div>

        {plan.estimated_cost && (
          <div className="keo-an-info-item">
            <FaMoneyBillWave className="keo-an-icon" />
            <span>Dự kiến: {plan.estimated_cost}</span>
          </div>
        )}
      </div>

      {me && (
        <div className="keo-an-actions">
          {canJoin && (
            <Button type="button" variant="primary" size="sm" onClick={handleJoin}>
              <FaCheckCircle style={{ marginRight: 6 }} />
              Tham gia
            </Button>
          )}
          {canLeave && (
            <Button type="button" variant="secondary" size="sm" onClick={handleLeave}>
              <FaTimesCircle style={{ marginRight: 6 }} />
              Rời kèo
            </Button>
          )}
          {isJoined && !isCreator && (
            <span className="keo-an-joined-badge">
              <FaCheckCircle style={{ marginRight: 6 }} />
              Đã tham gia
            </span>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            style={{ marginLeft: "auto" }}
          >
            <FaComments style={{ marginRight: 6 }} />
            Bình luận {plan.comment_count > 0 ? `(${plan.comment_count})` : ""}
          </Button>
        </div>
      )}

      {showComments && (
        <div className="keo-an-comments" style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <EatingPlanCommentBox planId={plan.id} focusCommentId={focusCommentId} />
        </div>
      )}

      {showReport && (
        <ReportModal
          targetType="eating_plan"
          targetId={plan.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

function KeoAnFormModal({ restaurants, onSubmit, onClose }) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [restaurantId, setRestaurantId] = useState("");
  const [plannedAt, setPlannedAt] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!title.trim()) return setErr("Bạn chưa nhập tiêu đề");
    if (!plannedAt) return setErr("Bạn chưa chọn thời gian");

    try {
      setLoading(true);
      await onSubmit({
        title: title.trim(),
        location: location.trim() || null,
        restaurantId: restaurantId || null,
        restaurantName: location.trim() || null,
        plannedAt,
        maxParticipants: maxParticipants ? Number(maxParticipants) : null,
        estimatedCost: estimatedCost.trim() || null,
        description: description.trim() || null,
      });
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Tạo kèo ăn thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content keo-an-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Kèo ăn uống mới</h2>
          <button type="button" className="modal-close" onClick={onClose} title="Đóng">
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label">1. Tiêu đề *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề kèo ăn"
                className="form-input"
                maxLength={255}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-label">2. Địa điểm</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Nhập địa điểm hoặc quán ăn"
                className="form-input"
                maxLength={255}
              />
              {restaurants.length > 0 && (
                <select
                  value={restaurantId}
                  onChange={(e) => {
                    setRestaurantId(e.target.value);
                    if (e.target.value) {
                      const rest = restaurants.find((r) => r.id === Number(e.target.value));
                      if (rest) setLocation(rest.name);
                    }
                  }}
                  className="form-input"
                  style={{ marginTop: 8 }}
                >
                  <option value="">Hoặc chọn quán ăn có sẵn...</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} {r.area ? `(${r.area})` : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">3. Thời gian & Số lượng</label>
              <input
                type="datetime-local"
                value={plannedAt}
                onChange={(e) => setPlannedAt(e.target.value)}
                className="form-input"
                required
              />
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                placeholder="Số người tối đa (tùy chọn)"
                min="1"
                className="form-input"
                style={{ marginTop: 8 }}
              />
            </div>

            <div className="form-field">
              <label className="form-label">4. Dự kiến chi phí</label>
              <input
                type="text"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="VD: 100k/người hoặc 500k cả nhóm"
                className="form-input"
                maxLength={100}
              />
            </div>

            <div className="form-field">
              <label className="form-label">5. Lời nhắn / Ghi chú thêm</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Thêm thông tin chi tiết về kèo ăn..."
                className="form-textarea"
                rows={4}
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="primary" disabled={loading}>
                {loading ? "Đang tạo..." : "Tạo"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function KeoAnPage() {
  const loc = useLocation();
  const search = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const focusPlanId = search.get("focus");
  const focusCommentId = search.get("focus_comment");

  const [plans, setPlans] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("upcoming");

  useEffect(() => {
    load();
    // Auto cleanup old plans
    try {
      http.post("/api/eating-plans/_internal/cleanup").catch(() => {});
    } catch {}
  }, [filter]);

  async function load() {
    setErr("");
    try {
      setLoading(true);
      // Auto cleanup before loading
      try {
        await http.post("/api/eating-plans/_internal/cleanup");
      } catch {}

      const [p, r] = await Promise.all([
        http.get(`/api/eating-plans?upcoming=${filter === "upcoming" ? "true" : "false"}`),
        http.get("/api/restaurants"),
      ]);
      const data = p.data || [];
      setPlans(data);
      setRestaurants(r.data || []);

      // Scroll to focus plan if needed
      if (focusPlanId) {
        setTimeout(() => {
          const el = document.getElementById(`plan-${focusPlanId}`);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("focused-highlight");
            // Chỉ bỏ highlight bài viết nếu có comment bị focus bên trong
            if (!focusCommentId) {
              setTimeout(() => el.classList.remove("focused-highlight"), 3000);
            }
          }
        }, 300);
      }
    } catch (e) {
      setErr(e?.response?.data?.msg || "Tải danh sách thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function createPlan(payload) {
    await http.post("/api/eating-plans", payload);
    await load();
  }

  const me = getUser();

  return (
    <AppLayout>
      <div className="feed-wrap col">
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <h1 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <FaHandshake style={{ color: "var(--primary)" }} />
              Kèo ăn - Rủ bạn đi ăn
            </h1>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className={filter === "upcoming" ? "tab active" : "tab"}
                onClick={() => setFilter("upcoming")}
              >
                Sắp tới
              </button>
              <button
                type="button"
                className={filter === "all" ? "tab active" : "tab"}
                onClick={() => setFilter("all")}
              >
                Tất cả
              </button>
              {me && (
                <button
                  type="button"
                  className="primary"
                  onClick={() => setShowForm(true)}
                >
                  + Tạo kèo
                </button>
              )}
            </div>
          </div>
        </div>

        {err && <div className="err">{err}</div>}

        {showForm && me && (
          <KeoAnFormModal
            restaurants={restaurants}
            onSubmit={createPlan}
            onClose={() => setShowForm(false)}
          />
        )}

        {loading && plans.length === 0 && <div className="pill">Đang tải...</div>}

        {!loading && plans.length === 0 && (
          <div className="card" style={{ padding: 40, textAlign: "center" }}>
            <FaHandshake style={{ fontSize: 48, color: "var(--muted)", marginBottom: 16 }} />
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Chưa có kèo ăn nào. {me && "Hãy tạo kèo ăn đầu tiên!"}
            </p>
          </div>
        )}

        {plans.map((plan) => (
          <KeoAnCard
            key={plan.id}
            plan={plan}
            onChanged={load}
            initialShowComments={focusPlanId === String(plan.id) && !!focusCommentId}
            focusCommentId={focusPlanId === String(plan.id) ? focusCommentId : null}
          />
        ))}
      </div>
    </AppLayout>
  );
}
