import { useEffect, useMemo, useRef, useState } from "react";
import { http } from "../api/http";
import { uploadMedia } from "../api/upload";

const MAX_FILES = 6;

function fmt(ts) {
  try { return new Date(ts).toLocaleString(); } catch { return ""; }
}

export default function CommentBox({ postId, inputRef }) {
  const [items, setItems] = useState([]);
  const [content, setContent] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const fileRef = useRef(null);

  useEffect(() => {
    // build preview urls
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setPreviews(
      files.map((f) => ({
        file: f,
        url: URL.createObjectURL(f),
        mediaType: f.type.startsWith("video/") ? "video" : "image",
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  async function load() {
    setErr("");
    try {
      const res = await http.get(`/api/comments/${postId}`);
      setItems(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.msg || "Không tải được bình luận");
    }
  }

  useEffect(() => { load(); }, [postId]);

  function addFiles(newFiles) {
    const arr = Array.from(newFiles || []);
    if (!arr.length) return;
    setFiles((prev) => [...prev, ...arr].slice(0, MAX_FILES));
  }

  function removeFile(f) {
    setFiles((prev) => prev.filter((x) => x !== f));
  }

  function onPaste(e) {
    const clip = e.clipboardData?.items || [];
    const pasted = [];
    for (const it of clip) {
      if (it.type?.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) pasted.push(f);
      }
    }
    if (pasted.length) addFiles(pasted);
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");

    if (!content.trim() && files.length === 0) {
      return setErr("Bạn chưa nhập gì cả.");
    }

    try {
      setLoading(true);

      let media = [];
      if (files.length) {
        media = await uploadMedia(files); // 1 lần cho tất cả files
      }

      await http.post(`/api/comments/${postId}`, {
        content: content.trim() || "(đã gửi media)",
        media,
      });

      setContent("");
      setFiles([]);
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.msg || "Gửi bình luận thất bại");
    } finally {
      setLoading(false);
    }
  }

  const mediaHint = useMemo(() => {
    if (!files.length) return "Có thể Ctrl+V để dán ảnh • Chọn nhiều ảnh/video";
    return `Đã chọn ${files.length}/${MAX_FILES} file`;
  }, [files.length]);

  return (
    <div className="cmt-box">
      <form className="cmt-form" onSubmit={submit}>
        <div className="cmt-inputrow">
          <div className="avatar sm">U</div>

          <div className="cmt-inputwrap">
            <textarea
              ref={inputRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={onPaste}
              placeholder="Viết bình luận..."
            />
            <div className="cmt-hint">{mediaHint}</div>

            {previews.length > 0 && (
              <div className="cmt-preview">
                {previews.map((p, idx) => (
                  <div className="cmt-prev-item" key={idx}>
                    {p.mediaType === "video" ? (
                      <video controls preload="metadata">
                        <source src={p.url} />
                      </video>
                    ) : (
                      <img src={p.url} alt="" />
                    )}
                    <button type="button" className="preview-remove" onClick={() => removeFile(p.file)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="cmt-actions">
              <input
                ref={fileRef}
                className="hiddenFile"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => addFiles(e.target.files)}
              />
              <button type="button" className="btn-chip" onClick={() => fileRef.current?.click()}>
                📎 Đính kèm
              </button>

              <button className="btn-primary" disabled={loading}>
                {loading ? "Đang gửi..." : "Gửi"}
              </button>
            </div>
          </div>
        </div>

        {err && <div className="err" style={{ marginTop: 8 }}>{err}</div>}
      </form>

      <div className="cmt-list">
        {items.map((c) => (
          <div className="cmt-item" key={c.id}>
            <div className="avatar sm">{(c.author_name || "U")[0]?.toUpperCase?.() || "U"}</div>

            <div className="cmt-bubble">
              <div className="cmt-top">
                <div className="cmt-name truncate">{c.author_name || "User"}</div>
                <div className="cmt-time">{fmt(c.created_at)}</div>
              </div>

              <div className="cmt-text">{c.content}</div>

              {!!c.media?.length && (
                <div className="cmt-media">
                  {c.media.map((m, i) => (
                    <a className="cmt-media-item" key={i} href={m.url} target="_blank" rel="noreferrer">
                      {m.mediaType === "video" ? (
                        <div className="cmt-videoTag">▶ video</div>
                      ) : (
                        <img src={m.url} alt="" />
                      )}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {!items.length && <div className="muted" style={{ padding: "10px 0" }}>Chưa có bình luận nào</div>}
      </div>
    </div>
  );
}
