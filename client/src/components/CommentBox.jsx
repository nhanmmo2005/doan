import { useEffect, useMemo, useRef, useState } from "react";
import { createComment, deleteComment, fetchComments } from "../api/comments";
import { uploadMedia } from "../api/upload";

function buildTree(list) {
  const map = new Map();
  const roots = [];

  for (const c of list) map.set(c.id, { ...c, replies: [] });

  for (const c of list) {
    const node = map.get(c.id);
    if (c.parent_id) {
      const parent = map.get(c.parent_id);
      if (parent) parent.replies.push(node);
      else roots.push(node);
    } else roots.push(node);
  }

  return roots;
}

function MediaStrip({ media }) {
  if (!media?.length) return null;

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
      {media.map((m, i) => (
        <div
          key={i}
          style={{
            border: "1px solid rgba(0,0,0,0.1)",
            borderRadius: 12,
            overflow: "hidden",
            width: 160,
            background: "#fff",
          }}
        >
          {m.mediaType === "video" ? (
            <video controls style={{ width: "100%", display: "block", background: "#000" }}>
              <source src={m.url} />
            </video>
          ) : (
            <img src={m.url} alt="" style={{ width: "100%", display: "block" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function CommentComposer({ postId, parentId = null, onDone }) {
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]); // File[]
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  function addFiles(newFiles) {
    const incoming = Array.from(newFiles || []);
    const merged = [...files, ...incoming].slice(0, 8); // giới hạn 8
    setFiles(merged);
  }

  function onPaste(e) {
    const items = e.clipboardData?.items || [];
    const pasted = [];
    for (const it of items) {
      if (it.type?.startsWith("image/") || it.type?.startsWith("video/")) {
        const f = it.getAsFile();
        if (f) pasted.push(f);
      }
    }
    if (pasted.length) addFiles(pasted);
  }

  async function submit() {
    setErr("");
    if (!content.trim()) return setErr("Bạn chưa nhập bình luận.");

    try {
      setBusy(true);

      // upload nhiều file 1 lần
      let media = [];
      if (files.length) {
        const uploaded = await uploadMedia(files); // trả về [{url, mediaType}] :contentReference[oaicite:3]{index=3}
        media = (uploaded || []).slice(0, 8).map((u, idx) => ({
          url: u.url,
          mediaType: u.mediaType,
          sortOrder: idx,
        }));
      }

      await createComment(postId, {
        content,
        parentId,
        media,
      });

      setContent("");
      setFiles([]);
      onDone?.();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Bình luận thất bại");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div className="avatar" title="Bạn" style={{ flex: "0 0 auto" }}>U</div>

        <div style={{ flex: 1 }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={onPaste}
            placeholder={parentId ? "Viết trả lời..." : "Viết bình luận... (Ctrl+V để dán ảnh/video)"}
            style={{
              width: "100%",
              minHeight: 46,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              outline: "none",
              resize: "vertical",
              lineHeight: 1.4,
            }}
          />

          {/* preview file list (gọn) */}
          {files.length > 0 && (
            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {files.map((f, i) => (
                <div
                  key={i}
                  className="pill"
                  style={{
                    maxWidth: 260,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={f.name}
                >
                  {f.type.startsWith("video/") ? "🎬" : "🖼️"} {f.name}
                </div>
              ))}
              <button className="chip" type="button" onClick={() => setFiles([])}>
                ✖ Bỏ file
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*"
              style={{ display: "none" }}
              onChange={(e) => addFiles(e.target.files)}
            />
            <button className="chip" type="button" onClick={() => fileRef.current?.click()}>
              🖼️/🎬 Đính kèm
            </button>
            <button className="primary" type="button" onClick={submit} disabled={busy}>
              {busy ? "Đang gửi..." : "Gửi"}
            </button>
          </div>

          {err && <div className="err" style={{ marginTop: 8 }}>{err}</div>}
        </div>
      </div>
    </div>
  );
}

function CommentItem({ c, postId, onReload, depth = 0 }) {
  const [replying, setReplying] = useState(false);

  async function del() {
    await deleteComment(c.id);
    onReload?.();
  }

  return (
    <div style={{ marginTop: 10, marginLeft: depth ? 36 : 0 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <div className="avatar" title={c.author_name || "User"} style={{ flex: "0 0 auto" }}>
          {(c.author_name || "U").slice(0, 1).toUpperCase()}
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              background: "rgba(0,0,0,0.03)",
              border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: 14,
              padding: "10px 12px",
            }}
          >
            <div style={{ fontWeight: 800, color: "#111827" }}>{c.author_name || "User"}</div>
            <div style={{ marginTop: 4, whiteSpace: "pre-wrap", lineHeight: 1.45 }}>{c.content}</div>

            <MediaStrip media={c.media} />

            <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
              <button className="chip" type="button" onClick={() => setReplying((x) => !x)}>
                ↩ Reply
              </button>
              <button className="chip" type="button" onClick={del}>
                🗑 Xoá
              </button>
              <span className="muted" style={{ fontSize: 12 }}>
                {new Date(c.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {replying && (
            <CommentComposer
              postId={postId}
              parentId={c.id}
              onDone={() => {
                setReplying(false);
                onReload?.();
              }}
            />
          )}

          {c.replies?.length > 0 &&
            c.replies.map((r) => (
              <CommentItem key={r.id} c={r} postId={postId} onReload={onReload} depth={depth + 1} />
            ))}
        </div>
      </div>
    </div>
  );
}

export default function CommentBox({ postId }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  async function reload() {
    setLoading(true);
    try {
      const data = await fetchComments(postId);
      setList(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const tree = useMemo(() => buildTree(list), [list]);

  return (
    <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 900 }}>Bình luận</div>
        <button className="chip" type="button" onClick={reload} disabled={loading}>
          {loading ? "Đang tải..." : "↻ Tải lại"}
        </button>
      </div>

      <CommentComposer postId={postId} onDone={reload} />

      <div style={{ marginTop: 8 }}>
        {tree.length === 0 ? (
          <div className="muted" style={{ fontSize: 13 }}>
            Chưa có bình luận nào.
          </div>
        ) : (
          tree.map((c) => <CommentItem key={c.id} c={c} postId={postId} onReload={reload} />)
        )}
      </div>
    </div>
  );
}
