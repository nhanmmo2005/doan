// src/components/PostItem.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CommentBox from "./CommentBox";
import { http } from "../api/http";
import { getUser } from "../auth";

function fmtTime(ts) {
  try {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? "" : d.toLocaleString();
  } catch {
    return "";
  }
}

export default function PostItem({ post, onLike, onChanged, children, autoOpenComments = false }) {
  const [openCmt, setOpenCmt] = useState(autoOpenComments);
  const [copied, setCopied] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post?.content || "");
  const cmtFocusRef = useRef(null);

  useEffect(() => setOpenCmt(autoOpenComments), [autoOpenComments]);
  useEffect(() => setDraft(post?.content || ""), [post?.content]);

  const author = post?.author_name || "User";
  const avatarChar = useMemo(() => (author?.trim()?.[0] || "U").toUpperCase(), [author]);

  const me = getUser();
  const canManage = me && (me.id === post.user_id || me.role === "admin");

  const postUrl = `${window.location.origin}/posts/${post.id}`;

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      window.prompt("Copy link bài viết:", postUrl);
    }
  }

  function toggleComment() {
    setOpenCmt((v) => !v);
    setTimeout(() => cmtFocusRef.current?.focus?.(), 60);
  }

  async function handleSave() {
    const text = String(draft || "").trim();
    if (!text) return alert("Nội dung không được rỗng.");
    try {
      await http.put(`/api/posts/${post.id}`, { content: text });
      setEditing(false);
      setMenuOpen(false);
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.msg || "Sửa bài thất bại");
    }
  }

  async function handleDelete() {
    if (!confirm("Xoá bài viết này?")) return;
    try {
      await http.delete(`/api/posts/${post.id}`);
      setMenuOpen(false);
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.msg || "Xoá bài thất bại");
    }
  }

  return (
    <div className="card post-card">
      {/* header */}
      <div className="post-head">
        <div className="post-left">
          <div className="avatar">{avatarChar}</div>

          <div className="post-meta">
            <div className="post-author-row">
              <div className="post-author truncate">{author}</div>

              <div className="post-head-actions">
                <Link className="btn-mini" to={`/posts/${post.id}`} title="Mở trang bài viết">
                  Mở bài
                </Link>

                {canManage && (
                  <div className="menuWrap">
                    <button type="button" className="btn-mini" onClick={() => setMenuOpen((x) => !x)}>
                      …
                    </button>

                    {menuOpen && (
                      <div className="menu">
                        <button
                          type="button"
                          className="menuItem"
                          onClick={() => {
                            setEditing(true);
                            setMenuOpen(false);
                          }}
                        >
                          Sửa bài
                        </button>
                        <button type="button" className="menuItem danger" onClick={handleDelete}>
                          Xoá bài
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="post-sub truncate">
              <span>{fmtTime(post?.created_at)}</span>
              {post?.restaurant_name ? (
                <>
                  <span className="dot">•</span>
                  <span className="tag">
                    {post.restaurant_name}
                    {post.restaurant_area ? ` (${post.restaurant_area})` : ""}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* content */}
      {!editing ? (
        <div className="post-content">{post?.content}</div>
      ) : (
        <div className="post-edit">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="post-editActions">
            <button type="button" className="chip" onClick={() => setEditing(false)}>
              Huỷ
            </button>
            <button type="button" className="primary" onClick={handleSave}>
              Lưu
            </button>
          </div>
        </div>
      )}

      {/* media slot */}
      {children}

      {/* stats */}
      <div className="post-stats">
        <div className="muted">{post?.like_count || 0} lượt thích</div>
        <div className="muted">{post?.comment_count || 0} bình luận</div>
      </div>

      {/* actions: Like -> Comment -> Share */}
      <div className="post-actions">
        <button type="button" className="act" onClick={() => onLike?.(post.id)}>
          Thích
        </button>

        <button type="button" className="act" onClick={toggleComment}>
          Bình luận
        </button>

        <button type="button" className="act" onClick={copyShare}>
          Chia sẻ {copied ? "✓" : ""}
        </button>
      </div>

      {/* comments */}
      {openCmt && (
        <div className="post-comments">
          <CommentBox postId={post.id} inputRef={cmtFocusRef} />
        </div>
      )}
    </div>
  );
}
