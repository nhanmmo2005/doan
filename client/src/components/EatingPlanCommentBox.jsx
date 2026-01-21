// client/src/components/EatingPlanCommentBox.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { http } from "../api/http";
import { getUser } from "../auth";
import { FaTrash } from "react-icons/fa";
import Button from "./ui/Button";

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

function CommentNode({ node, onReply, onDelete, canManage }) {
  const avatar = (node.author_name?.[0] || "U").toUpperCase();

  return (
    <div className="cmt-node">
      <div className="cmt-item">
        <div className="avatar sm">{avatar}</div>

        <div className="cmt-body">
          <div className="cmt-bubble">
            <div className="cmt-top">
              <div className="cmt-name truncate">{node.author_name || "User"}</div>
              <div className="cmt-time">{fmtTime(node.created_at)}</div>
            </div>

            <div className="cmt-text">{node.content}</div>
          </div>

          <div className="cmt-rowActions">
            <Button type="button" className="cmt-btn" variant="secondary" size="sm" onClick={() => onReply(node)}>
              Trả lời
            </Button>
            {canManage && (
              <Button type="button" className="cmt-btn danger" variant="danger" size="sm" onClick={() => onDelete(node.id)}>
                <FaTrash style={{ marginRight: 4 }} />
                Xoá
              </Button>
            )}
          </div>
        </div>
      </div>

      {node.replies?.length ? (
        <div className="cmt-replies">
          {node.replies.map((r) => (
            <CommentNode
              key={r.id}
              node={r}
              onReply={onReply}
              onDelete={onDelete}
              canManage={canManage}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function EatingPlanCommentBox({ planId, inputRef }) {
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
      await http.post(`/api/eating-plans/${planId}/comments`, {
        content: text.trim(),
        parentId: replyTo?.id || null,
      });

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
              onPaste={(e) => {}}
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
