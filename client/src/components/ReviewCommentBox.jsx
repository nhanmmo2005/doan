import { useState, useEffect } from "react";
import { http } from "../api/http";
import { getUser } from "../auth";
import { FaTrash, FaReply, FaEllipsisV, FaFlag } from "react-icons/fa";
import Button from "./ui/Button";
import ReportModal from "./ReportModal";

export default function ReviewCommentBox({ reviewId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [reportNode, setReportNode] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const me = getUser();

  useEffect(() => {
    if (reviewId) {
      loadComments();
    }
  }, [reviewId]);

  async function loadComments() {
    try {
      setLoading(true);
      const res = await http.get(`/api/reviews/${reviewId}/comments`);
      setComments(res.data || []);
    } catch (e) {
      console.error("Load review comments error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadAllReplies(commentId) {
    try {
      const res = await http.get(`/api/reviews/${reviewId}/comments/${commentId}/replies`);
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId) {
            return { ...c, replies: res.data };
          }
          return c;
        })
      );
      setExpandedReplies((prev) => {
        const next = new Set(prev);
        next.add(commentId);
        return next;
      });
    } catch (e) {
      console.error("Load replies error:", e);
    }
  }

  async function createComment(parentId = null) {
    if (!replyContent.trim()) return;

    try {
      await http.post(`/api/reviews/${reviewId}/comments`, {
        content: replyContent.trim(),
        parent_id: parentId,
      });
      setReplyContent("");
      setReplyingTo(null);
      await loadComments();
    } catch (e) {
      alert(e?.response?.data?.msg || "Gửi bình luận thất bại");
    }
  }

  async function deleteComment(commentId) {
    if (!confirm("Xóa bình luận này?")) return;

    try {
      await http.delete(`/api/reviews/${reviewId}/comments/${commentId}`);
      await loadComments();
    } catch (e) {
      alert(e?.response?.data?.msg || "Xóa bình luận thất bại");
    }
  }

  function renderComment(node, depth = 0) {
    const canManage = me && (me.id === node.user_id || me.role === "admin");
    const isReplying = replyingTo === node.id;
    const isMenuOpen = activeMenuId === node.id;
    const isExpanded = expandedReplies.has(node.id);
    const hasMoreReplies = node.reply_count > (node.replies?.length || 0);

    return (
      <div key={node.id} className="review-comment-item" style={{ marginLeft: depth * 24 }}>
        <div className="review-comment-header">
          <div className="review-comment-author">
            {node.author_avatar ? (
              <img src={node.author_avatar} alt={node.author_name} />
            ) : (
              <div className="review-comment-avatar-char">
                {(node.author_name?.[0] || "U").toUpperCase()}
              </div>
            )}
            <div>
              <div className="review-comment-author-name">{node.author_name}</div>
              <div className="review-comment-time">
                {new Date(node.created_at).toLocaleString("vi-VN")}
              </div>
            </div>
          </div>
          
          <div className="menuWrap">
            <button
              type="button"
              className="btn-menu-trigger"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(isMenuOpen ? null : node.id);
              }}
              style={{ fontSize: 14, opacity: 0.6 }}
            >
              <FaEllipsisV />
            </button>
            {isMenuOpen && (
              <>
                <div className="menu-backdrop" onClick={() => setActiveMenuId(null)} />
                <div className="menu" style={{ right: 0, left: "auto" }}>
                  {canManage && (
                    <button
                      type="button"
                      className="menuItem danger"
                      onClick={() => {
                        deleteComment(node.id);
                        setActiveMenuId(null);
                      }}
                    >
                      <FaTrash style={{ marginRight: 8 }} />
                      Xóa
                    </button>
                  )}
                  {me && me.id !== node.user_id && (
                    <button
                      type="button"
                      className="menuItem"
                      onClick={() => {
                        setReportNode(node);
                        setActiveMenuId(null);
                      }}
                    >
                      <FaFlag style={{ marginRight: 8 }} />
                      Báo cáo
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="review-comment-content">{node.content}</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {me && (
            <Button
              type="button"
              className="review-comment-reply-btn"
              variant="secondary"
              size="sm"
              onClick={() => setReplyingTo(isReplying ? null : node.id)}
            >
              <FaReply /> Trả lời
            </Button>
          )}
        </div>

        {isReplying && (
          <div className="review-comment-reply-form">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Viết bình luận..."
              rows={2}
              maxLength={500}
              style={{
                width: "100%",
                padding: 8,
                border: "1px solid var(--border)",
                borderRadius: 6,
                fontSize: 13,
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <Button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent("");
                }}
                variant="secondary"
                size="sm"
                className="btn-secondary"
                style={{ fontSize: 12, padding: "6px 12px" }}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={() => createComment(node.id)}
                variant="primary"
                size="sm"
                className="btn-primary"
                style={{ fontSize: 12, padding: "6px 12px" }}
                disabled={!replyContent.trim()}
              >
                Gửi
              </Button>
            </div>
          </div>
        )}

        {/* Nút Xem phản hồi */}
        {node.parent_id === null && node.reply_count > 0 && (
          <div className="review-comment-expand-replies">
            {!isExpanded && hasMoreReplies ? (
              <button
                type="button"
                className="btn-expand-replies"
                onClick={() => loadAllReplies(node.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary)",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: "4px 0",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span style={{ width: 20, height: 1, background: "var(--border)" }} />
                Xem {node.reply_count} phản hồi
              </button>
            ) : isExpanded ? (
              <button
                type="button"
                onClick={() => setExpandedReplies(prev => {
                  const n = new Set(prev);
                  n.delete(node.id);
                  return n;
                })}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: 13,
                  cursor: "pointer",
                  padding: "4px 0"
                }}
              >
                Ẩn phản hồi
              </button>
            ) : null}
          </div>
        )}

        {node.replies && node.replies.length > 0 && (isExpanded || node.parent_id !== null) && (
          <div className="review-comment-replies">
            {node.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="review-comment-box">
      <div className="review-comment-form">
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Viết bình luận..."
          rows={3}
          maxLength={500}
          style={{
            width: "100%",
            padding: 12,
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 14,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <button
            type="button"
            onClick={() => createComment()}
            className="btn-primary"
            disabled={!replyContent.trim()}
            style={{ fontSize: 13, padding: "8px 16px" }}
          >
            Gửi bình luận
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>Đang tải...</div>
      ) : comments.length === 0 ? (
        <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
          Chưa có bình luận nào
        </div>
      ) : (
        <div className="review-comments-list">
          {comments.map((comment) => renderComment(comment))}
        </div>
      )}

      {reportNode && (
        <ReportModal
          targetType="review_comment"
          targetId={reportNode.id}
          onClose={() => setReportNode(null)}
        />
      )}
    </div>
  );
}
