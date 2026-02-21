// client/src/components/EatingPlanCommentBox.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { http } from "../api/http";
import { getUser } from "../auth";
import { FaTrash, FaEllipsisV, FaFlag } from "react-icons/fa";
import Button from "./ui/Button";
import ReportModal from "./ReportModal";

function fmtTime(ts) {
  try {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? "" : d.toLocaleString("vi-VN");
  } catch {
    return "";
  }
}

function buildTree(flat) {
  const map = new Map();
  const roots = [];

  for (const c of flat) map.set(c.id, { ...c, replies: [] });

  for (const c of flat) {
    const node = map.get(c.id);
    if (c.parent_id) {
      const parent = map.get(c.parent_id);
      if (parent) parent.replies.push(node);
      else roots.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function ActionBtn({ children, danger, onClick }) {
  const className = danger ? "cmt-btn danger-text" : "cmt-btn";
  return (
    <button
      type="button"
      className={className}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function CommentNode({ node, onReply, onDelete, canManage, focusCommentId, expandToFocused }) {
  const avatarChar = (node.author_name?.[0] || "U").toUpperCase();
  const [showReplies, setShowReplies] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const me = getUser();

  const isFocused = focusCommentId && String(node.id) === String(focusCommentId);

  // Auto expand replies along the path to the focused comment
  useEffect(() => {
    if (expandToFocused && node.replies?.length > 0) {
      const hasFocusedInReplies = node.replies.some((r) => expandToFocused.has(String(r.id)));
      if (hasFocusedInReplies) setShowReplies(true);
    }
  }, [expandToFocused, node.replies]);

  const handleReplyClick = () => {
    setShowReplies(true);
    onReply(node);
  };

  return (
    <div
      id={`epcmt-${node.id}`}
      className={`cmt-node ${isFocused ? "focused-highlight" : ""}`}
    >
      <div className="cmt-item">
        <div className="avatar sm">
          {node.author_avatar ? (
            <img
              src={node.author_avatar}
              alt={node.author_name}
              style={{ width: "100%", height: "100%", borderRadius: "999px", objectFit: "cover" }}
            />
          ) : (
            avatarChar
          )}
        </div>

        <div className="cmt-body">
          <div className="cmt-bubble">
            <div className="cmt-top">
              <div className="cmt-name truncate">
                {node.author_name || "User"}
                {isFocused && <span className="focus-badge" style={{ marginLeft: 8 }}>Nội dung bị báo cáo</span>}
              </div>
              <div className="cmt-time">{fmtTime(node.created_at)}</div>
              <div className="cmt-more" style={{ marginLeft: "auto" }}>
                <div className="menuWrap">
                  <button
                    type="button"
                    className="btn-menu-trigger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen((x) => !x);
                    }}
                    style={{ fontSize: 12, opacity: 0.6 }}
                  >
                    <FaEllipsisV />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
                      <div className="menu" style={{ right: 0, left: "auto" }}>
                        {canManage && (
                          <button
                            type="button"
                            className="menuItem danger"
                            onClick={() => {
                              onDelete(node.id);
                              setMenuOpen(false);
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
                              setShowReport(true);
                              setMenuOpen(false);
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
            </div>

            <div className="cmt-text">{node.content}</div>
          </div>

          <div className="cmt-rowActions">
            <ActionBtn onClick={handleReplyClick}>Trả lời</ActionBtn>
          </div>
        </div>
      </div>

      {node.replies?.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <button
            type="button"
            className="cmt-btn"
            style={{ fontWeight: 600, color: "var(--primary)", fontSize: 13, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}
            onClick={(e) => {
              e.stopPropagation();
              setShowReplies(!showReplies);
            }}
          >
            {showReplies ? "Ẩn phản hồi" : `Xem ${node.replies.length} phản hồi`}
          </button>
        </div>
      )}

      {showReplies && node.replies?.length > 0 && (
        <div className="cmt-replies">
          {node.replies.map((r) => (
            <CommentNode
              key={r.id}
              node={r}
              onReply={onReply}
              onDelete={onDelete}
              canManage={canManage}
              focusCommentId={focusCommentId}
              expandToFocused={expandToFocused}
            />
          ))}
        </div>
      )}

      {showReport && (
        <ReportModal
          targetType="eating_plan_comment"
          targetId={node.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

export default function EatingPlanCommentBox({ planId, inputRef, focusCommentId }) {
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const localRef = useRef(null);
  const focusRef = inputRef || localRef;

  const me = getUser();

  async function reload() {
    try {
      const res = await http.get(`/api/eating-plans/${planId}/comments`);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setErr(e?.response?.data?.msg || "Không tải được bình luận");
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);

  function resetComposer() {
    setText("");
    setReplyTo(null);
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (!text.trim()) return setErr("Bạn chưa nhập nội dung bình luận.");

    try {
      setLoading(true);
      const payload = { content: text.trim(), parentId: replyTo?.id || null };
      await http.post(`/api/eating-plans/${planId}/comments`, payload);

      await reload();
      resetComposer();
      setTimeout(() => focusRef.current?.focus?.(), 50);
    } catch (e2) {
      setErr(e2?.response?.data?.msg || "Gửi bình luận thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Xoá bình luận này?")) return;
    try {
      await http.delete(`/api/eating-plans/${planId}/comments/${id}`);
      await reload();
    } catch (e) {
      alert(e?.response?.data?.msg || "Xoá thất bại");
    }
  }

  function handleReply(node) {
    setReplyTo(node);
    setTimeout(() => focusRef.current?.focus?.(), 50);
  }

  const tree = useMemo(() => buildTree(items), [items]);

  // Build set of ids to expand (walk up from focused comment to root)
  const expandToFocused = useMemo(() => {
    if (!focusCommentId) return null;
    const focusIdStr = String(focusCommentId);
    const byId = new Map(items.map((x) => [String(x.id), x]));
    const s = new Set([focusIdStr]);

    let cur = byId.get(focusIdStr);
    while (cur && cur.parent_id) {
      const parentIdStr = String(cur.parent_id);
      s.add(parentIdStr);
      cur = byId.get(parentIdStr);
    }
    return s;
  }, [items, focusCommentId]);

  // After items loaded, scroll to focused comment
  useEffect(() => {
    if (!focusCommentId) return;
    if (!items?.length) return;

    const id = String(focusCommentId);
    const t = setTimeout(() => {
      const el = document.getElementById(`epcmt-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("highlight-flash");
        setTimeout(() => el.classList.remove("highlight-flash"), 3000);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [items, focusCommentId]);

  return (
    <div className="cmt-box">
      {err && <div className="err" style={{ marginBottom: 10 }}>{err}</div>}

      {tree.length ? (
        <div className="cmt-thread">
          {tree.map((n) => (
            <CommentNode
              key={n.id}
              node={n}
              onReply={handleReply}
              onDelete={handleDelete}
              canManage={me && (me.id === n.user_id || me.role === "admin")}
              focusCommentId={focusCommentId}
              expandToFocused={expandToFocused}
            />
          ))}
        </div>
      ) : (
        <div className="muted" style={{ fontSize: 13 }}>Chưa có bình luận.</div>
      )}

      {/* Composer */}
      {me && (
        <form className="cmt-compose" onSubmit={submit}>
          {(replyTo) && (
            <div className="cmt-composeHint">
              Trả lời <b>{replyTo?.author_name || "User"}</b> •{" "}
              <button type="button" className="linkBtn" onClick={() => setReplyTo(null)}>
                Huỷ
              </button>
            </div>
          )}

          <div className="cmt-composeRow">
            <textarea
              ref={focusRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Viết bình luận…"
            />

            <div className="cmt-composeTools">
              <Button className="primary" variant="primary" size="md" disabled={loading}>
                {loading ? "Đang gửi…" : "Gửi"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
