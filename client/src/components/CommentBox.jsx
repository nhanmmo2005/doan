// src/components/CommentBox.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { uploadMedia } from "../api/upload";
import { createComment, deleteComment, fetchComments, updateComment } from "../api/comments";
import { getUser } from "../auth";
import Lightbox from "./Lightbox";
import Button from "./ui/Button";
import ReportModal from "./ReportModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faImage, faEllipsisV } from "@fortawesome/free-solid-svg-icons";

const MAX_FILES = 8;

function fmtTime(ts) {
  try {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? "" : d.toLocaleString();
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

function MediaThumbs({ media }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!media?.length) return null;

  return (
    <>
      <div className="cmt-media">
        {media.map((m, idx) => (
          <div
            key={idx}
            className="cmt-media-item"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(idx);
              setLightboxOpen(true);
            }}
            style={{ cursor: "pointer" }}
            title="Xem media"
          >
            {m.mediaType === "image" ? (
              <img src={m.url} alt="" />
            ) : (
              <div className="cmt-videoTag">VIDEO</div>
            )}
          </div>
        ))}
      </div>
      <Lightbox
        open={lightboxOpen}
        items={media.map((m) => ({
          url: m.url,
          mediaType: m.mediaType,
        }))}
        index={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onPrev={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))}
        onNext={() => setLightboxIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0))}
      />
    </>
  );
}

function ActionBtn({ children, danger, onClick }) {
  const className = danger ? "cmt-btn danger-text" : "cmt-btn";
  return (
    <button type="button" className={className} onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}>
      {children}
    </button>
  );
}

function CommentNode({
  node,
  onReply,
  onDelete,
  onEdit,
  canManage,
}) {
  const [showReplies, setShowReplies] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const avatar = (node.author_name?.[0] || "U").toUpperCase();
  const me = getUser();

  const handleReplyClick = () => {
    setShowReplies(true);
    onReply(node);
  };

  return (
    <div className="cmt-node">
      <div className="cmt-item">
        <div className="avatar sm">
          {node.author_avatar ? (
            <img src={node.author_avatar} alt={node.author_name} style={{ width: "100%", height: "100%", borderRadius: "999px", objectFit: "cover" }} />
          ) : (
            avatar
          )}
        </div>

        <div className="cmt-body">
          <div className="cmt-bubble">
            <div className="cmt-top">
              <div className="cmt-name truncate">{node.author_name || "User"}</div>
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
                    <FontAwesomeIcon icon={faEllipsisV} />
                  </button>
                  {menuOpen && (
                    <>
                      <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
                      <div className="menu" style={{ right: 0, left: "auto" }}>
                        {canManage && (
                          <>
                            <button
                              type="button"
                              className="menuItem"
                              onClick={() => {
                                onEdit(node);
                                setMenuOpen(false);
                              }}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="menuItem danger"
                              onClick={() => {
                                onDelete(node.id);
                                setMenuOpen(false);
                              }}
                            >
                              Xóa
                            </button>
                          </>
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
            <MediaThumbs media={node.media} />
          </div>

          <div className="cmt-rowActions">
            <ActionBtn onClick={handleReplyClick}>Trả lời</ActionBtn>
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
        </div>
      </div>

      {showReplies && node.replies?.length > 0 && (
        <div className="cmt-replies">
          {node.replies.map((r) => (
            <CommentTreeItem
              key={r.id}
              node={r}
              onReply={onReply}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}

      {showReport && (
        <ReportModal
          targetType="post_comment"
          targetId={node.id}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

function CommentTreeItem({ node, onReply, onDelete, onEdit }) {
  const me = getUser();
  const canManage = me && (me.id === node.user_id || me.role === "admin");
  return (
    <CommentNode
      node={node}
      onReply={onReply}
      onDelete={onDelete}
      onEdit={onEdit}
      canManage={!!canManage}
    />
  );
}

export default function CommentBox({ postId, inputRef }) {
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [replyTo, setReplyTo] = useState(null);

  const [editing, setEditing] = useState(null); // {id, content, media}
  const localRef = useRef(null);
  const fileRef = useRef(null);
  const focusRef = inputRef || localRef;

  async function reload() {
    const data = await fetchComments(postId);
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        await reload();
      } catch (e) {
        setErr(e?.response?.data?.msg || "Không tải được bình luận");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  useEffect(() => {
    const urls = (files || []).map((f) => ({ file: f, url: URL.createObjectURL(f), type: f.type }));
    setPreviews(urls);
    return () => urls.forEach((x) => URL.revokeObjectURL(x.url));
  }, [files]);

  const tree = useMemo(() => buildTree(items), [items]);

  function pickFiles() {
    fileRef.current?.click();
  }

  function addFiles(list) {
    const arr = Array.from(list || []);
    if (!arr.length) return;
    setFiles((prev) => [...prev, ...arr].slice(0, MAX_FILES));
  }

  function onPaste(e) {
    const its = e.clipboardData?.items || [];
    const added = [];
    for (const it of its) {
      if (it.type?.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) added.push(f);
      }
    }
    if (added.length) addFiles(added);
  }

  function resetComposer() {
    setText("");
    setFiles([]);
    setReplyTo(null);
    setEditing(null);
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (!text.trim()) return setErr("Bạn chưa nhập nội dung bình luận.");

    try {
      setLoading(true);

      let media = [];
      if (files.length) {
        const uploaded = await uploadMedia(files);
        media = (uploaded || []).map((m, idx) => ({
          mediaType: m.mediaType,
          url: m.url,
          sortOrder: idx,
        }));
      }

      // edit
      if (editing?.id) {
        await updateComment(editing.id, {
          content: text.trim(),
        });
      } else {
        await createComment(postId, {
          content: text.trim(),
          parentId: replyTo?.id || null,
          media,
        });
      }

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
      await deleteComment(id);
      await reload();
    } catch (e) {
      alert(e?.response?.data?.msg || "Xoá thất bại");
    }
  }

  function handleReply(node) {
    setEditing(null);
    setReplyTo(node);
    setTimeout(() => focusRef.current?.focus?.(), 50);
  }

  function handleEdit(node) {
    setReplyTo(null);
    setEditing(node);
    setText(node.content || "");
    setFiles([]);
    setTimeout(() => focusRef.current?.focus?.(), 50);
  }

  return (
    <div className="cmt-box">
      {err && <div className="err" style={{ marginBottom: 10 }}>{err}</div>}

      {tree.length ? (
        <div className="cmt-thread">
          {tree.map((n) => (
            <CommentTreeItem
              key={n.id}
              node={n}
              onReply={handleReply}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))}
        </div>
      ) : (
        <div className="muted" style={{ fontSize: 13 }}>Chưa có bình luận.</div>
      )}

      {/* Composer */}
      <form className="cmt-compose" onSubmit={submit}>
        {(replyTo || editing) && (
          <div className="cmt-composeHint">
            {editing ? (
              <>
                Đang sửa bình luận •{" "}
                <button type="button" className="linkBtn" onClick={resetComposer}>Huỷ</button>
              </>
            ) : (
              <>
                Trả lời <b>{replyTo?.author_name || "User"}</b> •{" "}
                <button type="button" className="linkBtn" onClick={() => setReplyTo(null)}>Huỷ</button>
              </>
            )}
          </div>
        )}

        <div className="cmt-composeRow">
          <textarea
            ref={focusRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onPaste={onPaste}
            placeholder="Viết bình luận…"
          />

          <div className="cmt-composeTools">
            <input
              ref={fileRef}
              type="file"
              className="hiddenFile"
              multiple
              accept="image/*,video/*"
              onChange={(e) => addFiles(e.target.files)}
            />
            <button 
              type="button" 
              className="chip" 
              onClick={(e) => {
                e.stopPropagation();
                pickFiles();
              }} 
              title="Đính kèm một ảnh hoặc video"
              aria-label="Đính kèm một ảnh hoặc video"
              style={{ padding: 8, width: 36, height: 36, borderRadius: "50%", display: "inline-flex", justifyContent: "center", alignItems: "center", border: "none", background: "rgba(0,0,0,0.05)", cursor: "pointer" }}
            >
              <FontAwesomeIcon icon={faImage} />
            </button>

            <button className="primary" disabled={loading} style={{ border: "none", borderRadius: "8px", padding: "6px 16px", fontWeight: 600, cursor: "pointer" }}>
              {loading ? "Đang gửi…" : editing ? "Lưu" : "Gửi"}
            </button>
          </div>
        </div>

        {previews.length > 0 && (
          <div className="cmt-uploadPreview">
            {previews.map((p, idx) => (
              <div className="cmt-upItem" key={idx}>
                {p.type.startsWith("image/") ? (
                  <img src={p.url} alt="" />
                ) : (
                  <div className="cmt-upVideo">VIDEO</div>
                )}
                <button
                  type="button"
                  className="cmt-upRemove"
                  onClick={() => setFiles((prev) => prev.filter((f) => f !== p.file))}
                  title="Bỏ file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}
