import { useEffect, useMemo, useRef, useState } from "react";
import { uploadMedia } from "../api/upload";
import { createComment, deleteComment, fetchComments } from "../api/comments";

function fmtTime(ts) {
  try {
    return new Date(ts).toLocaleString();
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

/**
 * Chuẩn hoá output uploadMedia:
 * - string url
 * - { url, mediaType }
 * - { items: [...] }
 * - { media: [...] }
 */
function normalizeUploaded(result) {
  const arr =
    Array.isArray(result)
      ? result
      : Array.isArray(result?.items)
      ? result.items
      : Array.isArray(result?.media)
      ? result.media
      : [];

  return arr
    .map((x, idx) => {
      if (!x) return null;

      if (typeof x === "string") {
        // fallback: đoán type theo đuôi
        const low = x.toLowerCase();
        const mediaType =
          low.endsWith(".mp4") || low.endsWith(".webm") || low.endsWith(".mov") ? "video" : "image";
        return { mediaType, url: x, sortOrder: idx };
      }

      const url = x.url || x.Location || x.location;
      if (!url) return null;

      const mediaType = x.mediaType || x.media_type || x.type || "image";
      const sortOrder = Number(x.sortOrder ?? x.sort_order ?? idx);

      return {
        mediaType: mediaType === "video" ? "video" : "image",
        url,
        sortOrder,
      };
    })
    .filter(Boolean);
}

function MediaThumbs({ media }) {
  if (!media?.length) return null;

  return (
    <div className="cmt-media">
      {media.map((m, idx) => (
        <a
          key={idx}
          className="cmt-media-item"
          href={m.url}
          target="_blank"
          rel="noreferrer"
          title="Mở media"
        >
          {m.mediaType === "image" ? (
            <img src={m.url} alt="" />
          ) : (
            <div className="cmt-videoTag">VIDEO</div>
          )}
        </a>
      ))}
    </div>
  );
}

function CommentItem({ node, depth, onReply, onDelete }) {
  const capped = Math.min(depth, 2); // chặn “nhếch” vô hạn

  return (
    <div className="cmt-item" style={{ "--cmtIndent": capped }}>
      <div className="avatar sm">{(node.author_name?.[0] || "U").toUpperCase()}</div>

      <div className="cmt-bubble">
        <div className="cmt-top">
          <div className="cmt-name truncate">{node.author_name || "User"}</div>
          <div className="cmt-time">{fmtTime(node.created_at)}</div>
        </div>

        <div className="cmt-text">{node.content}</div>

        <MediaThumbs media={node.media} />

        <div className="cmt-rowActions">
          <button className="cmt-btn" type="button" onClick={() => onReply(node)}>
            Trả lời
          </button>

          <button className="cmt-btn danger" type="button" onClick={() => onDelete(node.id)}>
            Xoá
          </button>
        </div>

        {node.replies?.length ? (
          <div className="cmt-replies">
            {node.replies.map((r) => (
              <CommentItem
                key={r.id}
                node={r}
                depth={depth + 1}
                onReply={onReply}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function CommentBox({ postId, inputRef }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [items, setItems] = useState([]);

  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [replyTo, setReplyTo] = useState(null);
  const localRef = useRef(null);
  const fileRef = useRef(null);

  const focusRef = inputRef || localRef;

  async function reload() {
    const data = await fetchComments(postId);
    setItems(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    (async () => {
      setErr("");
      try {
        await reload();
      } catch (e) {
        setErr(e?.response?.data?.msg || "Không tải được bình luận");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  useEffect(() => {
    const urls = (files || []).map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
      type: f.type,
    }));
    setPreviews(urls);
    return () => urls.forEach((x) => URL.revokeObjectURL(x.url));
  }, [files]);

  const tree = useMemo(() => buildTree(items), [items]);

  function pickFiles() {
    fileRef.current?.click();
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
    if (added.length) setFiles((prev) => [...prev, ...added].slice(0, 8));
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (!text.trim()) return setErr("Bạn chưa nhập nội dung bình luận.");

    setLoading(true);
    try {
      let media = [];

      if (files.length) {
        const uploaded = await uploadMedia(files);
        media = normalizeUploaded(uploaded);
      }

      await createComment(postId, {
        content: text.trim(),
        parentId: replyTo?.id || null,
        media,
      });

      setText("");
      setFiles([]);
      setReplyTo(null);
      await reload();
    } catch (e2) {
      setErr(e2?.response?.data?.msg || "Gửi bình luận thất bại");
    } finally {
      setLoading(false);
    }
  }

  function startReply(node) {
    setReplyTo({ id: node.id, author_name: node.author_name });
    setTimeout(() => focusRef.current?.focus?.(), 50);
  }

  async function handleDelete(id) {
    try {
      await deleteComment(id);
      await reload();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Xoá bình luận thất bại");
    }
  }

  return (
    <div className="cmt-box">
      <form className="cmt-form" onSubmit={submit}>
        {replyTo && (
          <div className="cmt-replyBar">
            <div className="truncate">
              Đang trả lời <b>{replyTo.author_name || "User"}</b>
            </div>
            <button className="chip" type="button" onClick={() => setReplyTo(null)}>
              Huỷ
            </button>
          </div>
        )}

        <div className="cmt-inputrow">
          <div className="avatar sm">U</div>

          <div className="cmt-inputwrap">
            <textarea
              ref={focusRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onPaste={onPaste}
              placeholder="Viết bình luận… (Ctrl+V để dán ảnh)"
            />

            {!!previews.length && (
              <div className="cmt-preview">
                {previews.map((p, idx) => (
                  <div className="cmt-prev-item" key={idx}>
                    {p.type.startsWith("image/") ? (
                      <img src={p.url} alt="" />
                    ) : (
                      <video src={p.url} controls />
                    )}

                    <button
                      className="preview-remove"
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                      title="Bỏ file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="cmt-actions">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  ref={fileRef}
                  type="file"
                  className="hiddenFile"
                  accept="image/*,video/*"
                  multiple
                  onChange={(e) => {
                    const arr = Array.from(e.target.files || []);
                    setFiles((prev) => [...prev, ...arr].slice(0, 8));
                    e.target.value = "";
                  }}
                />

                <button className="chip" type="button" onClick={pickFiles}>
                  Đính kèm
                </button>

                {files.length ? <span className="pill">{files.length} file</span> : null}
              </div>

              <button className="primary" disabled={loading}>
                {loading ? "Đang gửi…" : "Gửi"}
              </button>
            </div>

            {err && (
              <div className="err" style={{ marginTop: 10 }}>
                {err}
              </div>
            )}
          </div>
        </div>
      </form>

      <div className="cmt-list">
        {tree.map((node) => (
          <CommentItem
            key={node.id}
            node={node}
            depth={0}
            onReply={startReply}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
