import { useEffect, useState } from "react";
import { http } from "../../api/http";
import Button from "../../components/ui/Button";
import {
  FaTimes,
  FaTrash,
  FaEyeSlash,
  FaExternalLinkAlt,
} from "react-icons/fa";

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [previews, setPreviews] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState({ status: "pending", target_type: "" });

  useEffect(() => {
    loadReports();
  }, [filter]);

  async function loadReports() {
    setLoading(true);
    setErr("");
    try {
      const res = await http.get("/api/admin/reports", { params: filter });
      const reportData = res.data || [];
      setReports(reportData);
      
      // Load previews for each report
      reportData.forEach(r => {
        loadPreview(r.target_type, r.target_id);
      });
    } catch (e) {
      setErr(e?.response?.data?.msg || "Không tải được danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  }

  async function loadPreview(type, id) {
    const key = `${type}:${id}`;
    if (previews[key]) return;
    try {
      const res = await http.get(`/api/admin/reports/target-preview/${type}/${id}`);
      setPreviews(prev => ({ ...prev, [key]: res.data?.text || "(Không có nội dung)" }));
    } catch (e) {
      setPreviews(prev => ({ ...prev, [key]: "(Không thể tải nội dung hoặc đã bị xóa)" }));
    }
  }

  async function resolveReport(id, status, action = "none") {
    const admin_note = window.prompt("Nhập ghi chú xử lý (tùy chọn):");
    if (admin_note === null) return; // cancel

    try {
      await http.patch(`/api/admin/reports/${id}/resolve`, {
        status,
        action,
        admin_note,
      });
      alert("Đã xử lý báo cáo thành công");
      loadReports();
    } catch (e) {
      alert(e?.response?.data?.msg || "Xử lý thất bại");
    }
  }

  const typeLabels = {
    post: "Bài viết",
    eating_plan: "Kèo ăn",
    post_comment: "Bình luận (Post)",
    review_comment: "Bình luận (Review)",
    eating_plan_comment: "Bình luận (Kèo)",
    message: "Tin nhắn chat",
    restaurant_comment: "Bình luận (Quán)",
  };

  const reasonLabels = {
    spam: "Spam",
    abusive: "Xúc phạm",
    inappropriate: "Nội dung 18+",
    harassment: "Quấy rối",
    scam: "Lừa đảo",
    other: "Khác",
  };

  async function handleViewTarget(r) {
    try {
      const res = await http.get(`/api/admin/reports/resolve-context/${r.target_type}/${r.target_id}`);
      const ctx = res.data;

      let url = "";
      if (r.target_type === "post") {
        url = `/posts/${r.target_id}`;
      } else if (r.target_type === "post_comment") {
        url = `/posts/${ctx.postId}?focus_comment=${r.target_id}`;
      } else if (r.target_type === "review_comment") {
        url = `/restaurants/${ctx.restaurantId}?focus_review_comment=${r.target_id}&review_id=${ctx.reviewId}`;
      } else if (r.target_type === "eating_plan") {
        url = `/keo-an?focus=${r.target_id}`;
      } else if (r.target_type === "eating_plan_comment") {
        url = `/keo-an?focus=${ctx.eatingPlanId}&focus_comment=${r.target_id}`;
      } else if (r.target_type === "message") {
        url = `/chat?room=${ctx.roomId}&focus_message=${r.target_id}`;
      } else if (r.target_type === "restaurant_comment") {
        url = `/restaurants/${ctx.restaurantId}?focus_restaurant_comment=${r.target_id}`;
      }

      if (url) {
        window.open(url, "_blank");
      }
    } catch (e) {
      let url = "";
      if (r.target_type === "post") url = `/posts/${r.target_id}`;
      else if (r.target_type === "eating_plan") url = `/keo-an?focus=${r.target_id}`;
      
      if (url) window.open(url, "_blank");
      else alert("Không tìm thấy nội dung hoặc lỗi hệ thống");
    }
  }

  return (
    <div className="admin-content">
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            className="form-input"
            style={{ width: "auto" }}
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          >
            <option value="pending">Chờ xử lý</option>
            <option value="resolved">Đã giải quyết</option>
            <option value="rejected">Đã bác bỏ</option>
            <option value="">Tất cả trạng thái</option>
          </select>

          <select
            className="form-input"
            style={{ width: "auto" }}
            value={filter.target_type}
            onChange={(e) => setFilter({ ...filter, target_type: e.target.value })}
          >
            <option value="">Tất cả loại nội dung</option>
            {Object.entries(typeLabels).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>

          <Button variant="secondary" onClick={loadReports} disabled={loading}>
            ↻ Làm mới
          </Button>
        </div>
      </div>

      {err && <div className="err" style={{ marginBottom: 20 }}>{err}</div>}

      {loading ? (
        <div className="pill">Đang tải báo cáo...</div>
      ) : (
        <div className="admin-list">
          {reports.map((r) => (
            <div key={r.id} className="admin-item" style={{ borderLeft: r.status === 'pending' ? '4px solid #ef4444' : '1px solid var(--border)' }}>
              <div className="admin-item-header">
                <div>
                  <span className="badge" style={{ background: "var(--bg)", color: "var(--text)", marginRight: 8 }}>
                    {typeLabels[r.target_type] || r.target_type}
                  </span>
                  <strong>Lý do: {reasonLabels[r.reason] || r.reason}</strong>
                </div>
                <div className="admin-badges">
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </div>
              </div>

              <div style={{ margin: "12px 0", fontSize: 14 }}>
                <div><strong>Người báo cáo:</strong> {r.reporter_name} ({r.reporter_email})</div>
                <div><strong>ID nội dung vi phạm:</strong> {r.target_id}</div>
                
                {/* Preview Box */}
                <div style={{ marginTop: 12, padding: "12px 16px", background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#6c757d", marginBottom: 4, textTransform: "uppercase" }}>
                    Nội dung bị báo cáo (Xem nhanh):
                  </div>
                  <div style={{ color: "#212529", fontStyle: "italic", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {previews[`${r.target_type}:${r.target_id}`] || "Đang tải nội dung..."}
                  </div>
                </div>

                {r.reason_text && (
                  <div style={{ marginTop: 12, padding: 8, background: "rgba(239, 68, 68, 0.05)", borderLeft: "3px solid #ef4444", color: "#b91c1c", fontSize: 13 }}>
                    <strong>Ghi chú người báo:</strong> {r.reason_text}
                  </div>
                )}
              </div>

              <div className="admin-item-footer">
                <span>ID: {r.id} • {new Date(r.created_at).toLocaleString()}</span>

                <div className="admin-actions-group">
                  <Button variant="secondary" size="sm" onClick={() => handleViewTarget(r)}>
                    <FaExternalLinkAlt /> Xem thực tế
                  </Button>

                  {r.status === "pending" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => resolveReport(r.id, "rejected")}>
                        <FaTimes /> Bác bỏ
                      </Button>

                      <Button variant="secondary" size="sm" onClick={() => resolveReport(r.id, "resolved", "hide")}>
                        <FaEyeSlash /> Ẩn nội dung
                      </Button>

                      <Button variant="danger" size="sm" onClick={() => resolveReport(r.id, "resolved", "delete")}>
                        <FaTrash /> Xóa hẳn
                      </Button>
                    </>
                  )}
                </div>

                {r.status !== "pending" && (
                  <div style={{ fontSize: 13, color: "var(--muted)" }}>
                    Đã xử lý: <strong>{r.action}</strong> {r.admin_note && ` - Ghi chú: ${r.admin_note}`}
                  </div>
                )}
              </div>
            </div>
          ))}
          {reports.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
              Không có báo cáo nào.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
