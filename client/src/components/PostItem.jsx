import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CommentBox from "./CommentBox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpRightFromSquare,
  faLocationDot,
  faShare,
} from "@fortawesome/free-solid-svg-icons";
import { faThumbsUp, faCommentDots } from "@fortawesome/free-regular-svg-icons";

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
      window.prompt("Copy link bài viết:", postUrl);
    }
  }

  function toggleComment() {
    setOpenCmt((v) => !v);
    setTimeout(() => cmtFocusRef.current?.focus?.(), 50);
  }

  return (
    <div className="card post-card">
      <div className="post-head">
        <div className="post-left">
          <div className="avatar">{avatarChar}</div>

          <div className="post-meta">
            <div className="post-author-row">
              <div className="post-author truncate">{author}</div>

              <div className="post-head-actions">
                <Link className="btn-mini" to={`/posts/${post.id}`} title="Mở trang bài viết">
                  <FontAwesomeIcon icon={faUpRightFromSquare} />
                  <span>Mở</span>
                </Link>
              </div>
            </div>

            <div className="post-sub truncate">
              <span>{fmtTime(post?.created_at)}</span>

              {post?.restaurant_name ? (
                <>
                  <span className="dot">•</span>
                  <span className="tag truncate" title={post.restaurant_name}>
                    <FontAwesomeIcon icon={faLocationDot} />
                    <span style={{ marginLeft: 6 }}>
                      {post.restaurant_name}
                      {post.restaurant_area ? ` (${post.restaurant_area})` : ""}
                    </span>
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="post-content">{post?.content}</div>

      {children}

      <div className="post-stats">
        <div className="muted">{post?.like_count || 0} lượt thích</div>
        <div className="muted">{post?.comment_count || 0} bình luận</div>
      </div>

      {/* Like → Comment → Share */}
      <div className="post-actions">
        <button type="button" className="act" onClick={() => onLike?.(post.id)}>
          <FontAwesomeIcon icon={faThumbsUp} />
          <span>Like</span>
        </button>

        <button type="button" className="act" onClick={toggleComment}>
          <FontAwesomeIcon icon={faCommentDots} />
          <span>Comment</span>
        </button>

        <button type="button" className="act" onClick={doShare}>
          <FontAwesomeIcon icon={faShare} />
          <span>{copied ? "Đã copy" : "Share"}</span>
        </button>
      </div>

      {openCmt && (
        <div className="post-comments">
          <CommentBox postId={post.id} inputRef={cmtFocusRef} />
        </div>
      )}
    </div>
  );
}
