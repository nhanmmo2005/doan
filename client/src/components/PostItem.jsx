// src/components/PostItem.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CommentBox from "./CommentBox";
import ReportModal from "./ReportModal";
import { http } from "../api/http";
import { getUser } from "../auth";
import {
  FaHeart,
  FaRegHeart,
  FaComment,
  FaShareAlt,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaFlag,
} from "react-icons/fa";
import Button from "./ui/Button";

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
  const [isLiked, setIsLiked] = useState(post?.is_liked || false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post?.content || "");
  const [showReport, setShowReport] = useState(false);
  const cmtFocusRef = useRef(null);

  useEffect(() => setOpenCmt(autoOpenComments), [autoOpenComments]);
  useEffect(() => setDraft(post?.content || ""), [post?.content]);
  useEffect(() => setIsLiked(post?.is_liked || false), [post?.is_liked]);

  const author = post?.author_name || "User";
  const avatarChar = useMemo(() => (author?.trim()?.[0] || "U").toUpperCase(), [author]);

  const me = getUser();
  const canManage = me && (me.id === post.user_id || me.role === "admin");
  const nav = useNavigate();

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
    <div 
      className="card post-card" 
      onClick={() => nav(`/posts/${post.id}`)}
      style={{ cursor: "pointer" }}
    >
      {/* header */}
      <div className="post-head" onClick={(e) => e.stopPropagation()}>
        <div className="post-left">
          <div className="avatar">
            {post?.author_avatar ? (
              <img src={post.author_avatar} alt={author} style={{ width: "100%", height: "100%", borderRadius: "999px", objectFit: "cover" }} />
            ) : (
              avatarChar
            )}
          </div>

          <div className="post-meta">
            <div className="post-author-row">
              <Link 
                to={`/users/${post.user_id}`} 
                className="post-author truncate" 
                style={{ textDecoration: "none", color: "inherit" }}
                onClick={(e) => e.stopPropagation()}
              >
                {author}
              </Link>

              <div className="post-head-actions">
                <div className="menuWrap">
                  <button
                    type="button"
                    className="btn-menu-trigger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen((x) => !x);
                    }}
                    title="Tùy chọn"
                  >
                    <FaEllipsisV />
                  </button>

                  {menuOpen && (
                    <>
                      <div
                        className="menu-backdrop"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                        }}
                      />
                      <div className="menu menu-post">
                        {canManage && (
                          <>
                            <button
                              type="button"
                              className="menuItem"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditing(true);
                                setMenuOpen(false);
                              }}
                            >
                              <span className="menuIcon">
                                <FaEdit />
                              </span>
                              <span>Sửa bài</span>
                            </button>
                            <button
                              type="button"
                              className="menuItem danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete();
                              }}
                            >
                              <span className="menuIcon">
                                <FaTrash />
                              </span>
                              <span>Xoá bài</span>
                            </button>
                          </>
                        )}
                        {me && me.id !== post.user_id && (
                          <button
                            type="button"
                            className="menuItem"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowReport(true);
                              setMenuOpen(false);
                            }}
                          >
                            <span className="menuIcon">
                              <FaFlag />
                            </span>
                            <span>Báo cáo</span>
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="post-sub truncate">
              <span>{fmtTime(post?.created_at)}</span>
              {post?.restaurant_name ? (
                <>
                  <span className="dot">•</span>
                  <span 
                    className="tag"
                    onClick={(e) => {
                      e.stopPropagation();
                      nav(`/restaurants/${post.restaurant_id}`);
                    }}
                  >
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
        <div className="post-edit" onClick={(e) => e.stopPropagation()}>
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />
          <div className="post-editActions">
            <Button type="button" className="chip" variant="secondary" size="sm" onClick={() => setEditing(false)}>
              Huỷ
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={handleSave}>
              Lưu
            </Button>
          </div>
        </div>
      )}

      {/* media slot */}
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>

      {/* stats */}
      <div className="post-stats" onClick={(e) => e.stopPropagation()}>
        <div className="muted">{post?.like_count || 0} lượt thích</div>
        <div className="muted">{post?.comment_count || 0} bình luận</div>
      </div>

      {/* actions: Like -> Comment -> Share */}
      <div className="post-actions" onClick={(e) => e.stopPropagation()}>
        <Button
          type="button"
          className={`act act-like ${isLiked ? "act-liked" : ""}`}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            if (!me) return nav("/login");
            setIsLiked(!isLiked);
            onLike?.(post.id);
          }}
        >
          <span className="act-icon">{isLiked ? <FaHeart /> : <FaRegHeart />}</span>
          <span className="act-text">{isLiked ? "Đã thích" : "Thích"}</span>
        </Button>

        <Button 
          type="button" 
          className="act act-comment" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            toggleComment();
          }}
        >
          <span className="act-icon"><FaComment /></span>
          <span className="act-text">Bình luận</span>
        </Button>

        <Button 
          type="button" 
          className="act act-share" 
          size="sm" 
          onClick={(e) => {
            e.stopPropagation();
            copyShare();
          }}
        >
          <span className="act-icon"><FaShareAlt /></span>
          <span className="act-text">Chia sẻ {copied ? "✓" : ""}</span>
        </Button>
      </div>

      {/* comments */}
      {openCmt && (
        <div className="post-comments" onClick={(e) => e.stopPropagation()}>
          <CommentBox postId={post.id} inputRef={cmtFocusRef} />
        </div>
      )}

      {showReport && (
        <ReportModal
          targetType="post"
          targetId={post.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
