import { useState } from "react";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";
import Button from "./ui/Button";
import { http } from "../api/http";

const REPORT_REASONS = [
  { value: "spam", label: "Spam / Quảng cáo rác" },
  { value: "abusive", label: "Ngôn từ thù ghét / Xúc phạm" },
  { value: "inappropriate", label: "Nội dung không phù hợp (18+, bạo lực)" },
  { value: "harassment", label: "Quấy rối / Làm phiền" },
  { value: "scam", label: "Lừa đảo / Giả mạo" },
  { value: "other", label: "Lý do khác" },
];

/**
 * targetType: 'post' | 'eating_plan' | 'post_comment' | 'review_comment' | 'eating_plan_comment' | 'message'
 * targetId: number
 */
export default function ReportModal({ targetType, targetId, onClose }) {
  const [reason, setReason] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason) return setErr("Vui lòng chọn lý do báo cáo");
    if (reason === "other" && !reasonText.trim()) return setErr("Vui lòng nhập mô tả chi tiết");

    try {
      setLoading(true);
      setErr("");
      await http.post("/api/reports", {
        target_type: targetType,
        target_id: targetId,
        reason,
        reason_text: reason === "other" ? reasonText.trim() : null,
      });
      alert("Cảm ơn bạn! Báo cáo đã được gửi tới quản trị viên.");
      onClose();
    } catch (e2) {
      setErr(e2?.response?.data?.msg || "Gửi báo cáo thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FaExclamationTriangle style={{ color: "#ef4444" }} />
            Báo cáo vi phạm
          </h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {err && <div className="err" style={{ marginBottom: 12 }}>{err}</div>}
          
          <form onSubmit={handleSubmit}>
            <p style={{ fontSize: 14, marginBottom: 16, color: "var(--muted)" }}>
              Bạn đang báo cáo nội dung này. Vui lòng chọn lý do chính xác nhất để quản trị viên dễ dàng xử lý.
            </p>

            <div className="form-field">
              {REPORT_REASONS.map((r) => (
                <label key={r.value} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <span style={{ fontSize: 15 }}>{r.label}</span>
                </label>
              ))}
            </div>

            {reason === "other" && (
              <div className="form-field" style={{ marginTop: 12 }}>
                <textarea
                  className="form-textarea"
                  placeholder="Mô tả chi tiết hơn về vi phạm..."
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            )}

            <div className="form-actions" style={{ marginTop: 24 }}>
              <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                Hủy
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? "Đang gửi..." : "Gửi báo cáo"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
