import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CommentBox from "./CommentBox";

function fmtTime(ts) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

export default function PostItem({ post, onLike, children }) {
  const [openCmt, setOpenCmt] = useState(false);
  const [copied, setCopied] = useState(false);
  const cmtFocusRef = useRef(null);

  const author = post?.author_name || "User";
  const avatarChar = useMemo(() => (author?.trim()?.[0] || "U").toUpperCase(), [author]);

  const postUrl = `${window.location.origin}/posts/${post.id}`;

  async function doShare() {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback
      window.prompt("Copy link bài viết:", postUrl);
    }
  }

  function toggleComment() {
    setOpenCmt((v) => !v);
    setTimeout(() => cmtFocusRef.current?.focus?.(), 50);
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
                  Mở bài ↗
                </Link>
              </div>
            </div>

            <div className="post-sub truncate">
              <span>{fmtTime(post?.created_at)}</span>
              {post?.restaurant_name ? (
                <>
                  <span className="dot">•</span>
                  <span className="tag">
                    📍 {post.restaurant_name}
                    {post.restaurant_area ? ` (${post.restaurant_area})` : ""}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* content */}
      <div className="post-content">{post?.content}</div>

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
          👍 Like
        </button>

        <button type="button" className="act" onClick={toggleComment}>
          💬 Comment
        </button>

        <button type="button" className="act" onClick={doShare}>
          🔗 Share {copied ? "✓" : ""}
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
