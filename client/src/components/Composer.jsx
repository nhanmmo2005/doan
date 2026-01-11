import { useEffect, useMemo, useRef, useState } from "react";
import { uploadMedia } from "../api/upload";

const MAX_FILES = 10;

function buildPreviews(files) {
  return files.map((f) => ({
    file: f,
    url: URL.createObjectURL(f),
    mediaType: f.type.startsWith("video/") ? "video" : "image",
  }));
}

function MediaPreview({ previews, onRemove }) {
  const videos = previews.filter((p) => p.mediaType === "video");
  const images = previews.filter((p) => p.mediaType === "image");

  return (
    <div className="composer-preview">
      {/* Videos (inline, 1 dòng / video) */}
      {videos.map((v, idx) => (
        <div className="preview-video" key={`v-${idx}`}>
          <video controls preload="metadata">
            <source src={v.url} />
          </video>
          <button type="button" className="preview-remove" onClick={() => onRemove(v.file)}>
            ✕
          </button>
        </div>
      ))}

      {/* Images grid (FB-ish) */}
      {images.length > 0 && (
        <div
          className={[
            "preview-grid",
            images.length === 1 ? "g1" : "",
            images.length === 2 ? "g2" : "",
            images.length === 3 ? "g3" : "",
            images.length >= 4 ? "g4" : "",
          ].join(" ")}
        >
          {images.slice(0, 4).map((img, i) => {
            const more = i === 3 && images.length > 4;
            return (
              <div className="preview-tile" key={`i-${i}`}>
                <img src={img.url} alt="" />
                <button type="button" className="preview-remove" onClick={() => onRemove(img.file)}>
                  ✕
                </button>
                {more && <div className="preview-more">+{images.length - 4}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Composer({ restaurants, onSubmit, loading }) {
  const [content, setContent] = useState("");
  const [restaurantId, setRestaurantId] = useState(""); // tag quán (optional - sau này dùng)
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileRef = useRef(null);
  const areaRef = useRef(null);

  // build preview URLs
  useEffect(() => {
    previews.forEach((p) => URL.revokeObjectURL(p.url));
    setPreviews(buildPreviews(files));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const busy = loading || uploading;

  function addFiles(newFiles) {
    const arr = Array.from(newFiles || []);
    if (!arr.length) return;

    const merged = [...files, ...arr].slice(0, MAX_FILES);
    setFiles(merged);
  }

  function removeFile(file) {
    setFiles((prev) => prev.filter((x) => x !== file));
  }

  function pickFiles() {
    fileRef.current?.click();
  }

  // Ctrl+V paste ảnh
  function onPaste(e) {
    const items = e.clipboardData?.items || [];
    const pasted = [];
    for (const it of items) {
      if (it.type?.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) pasted.push(f);
      }
    }
    if (pasted.length) addFiles(pasted);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!content.trim()) return setErr("Bạn chưa nhập nội dung.");

    try {
      let media = [];

      if (files.length) {
        setUploading(true);
        // upload 1 lần cho tất cả files
        media = await uploadMedia(files);
      }

      await onSubmit({
        type: "status",
        content,
        media, // <-- quan trọng: feed lấy từ post_media
        restaurantId: restaurantId || null, // tag quán (optional)
      });

      setContent("");
      setRestaurantId("");
      setFiles([]);
      areaRef.current?.focus();
    } catch (e2) {
      setErr(e2?.response?.data?.msg || "Đăng bài thất bại");
    } finally {
      setUploading(false);
    }
  }

  const helper = useMemo(() => {
    const count = files.length;
    if (!count) return "Tip: Ctrl+V để dán ảnh • Chọn nhiều ảnh/video như Facebook";
    return `Đã chọn ${count}/${MAX_FILES} file`;
  }, [files.length]);

  return (
    <div className="card composer-card">
      <div className="composer-head">
        <div className="composer-title">Tạo bài viết</div>
        <div className="composer-sub">Status / rủ kèo / hỏi quán ngon — kiểu mạng xã hội mini</div>
      </div>

      <form onSubmit={handleSubmit} className="composer-form">
        {/* tag quán (optional) */}
        {!!restaurants?.length && (
          <div className="composer-tag">
            <span className="label">Gắn quán (tuỳ chọn)</span>
            <select value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)}>
              <option value="">-- Chưa chọn --</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.area})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="composer-row">
          <div className="avatar">U</div>

          <div className="composer-input">
            <textarea
              ref={areaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onPaste={onPaste}
              placeholder="Bạn đang nghĩ gì? Rủ bạn đi ăn, tìm quán ngon, hỏi món hot Đà Nẵng..."
            />
            <div className="composer-hint">{helper}</div>
          </div>
        </div>

        {/* preview */}
        {previews.length > 0 && <MediaPreview previews={previews} onRemove={removeFile} />}

        <div className="composer-actions">
          <div className="left">
            <input
              ref={fileRef}
              className="hiddenFile"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={(e) => addFiles(e.target.files)}
            />
            <button type="button" className="btn-chip" onClick={pickFiles}>
              📷 Ảnh/Video
            </button>
            <span className="pill">⚠️ Từ thô tục sẽ bị che</span>
          </div>

          <button className="btn-primary" disabled={busy}>
            {busy ? "Đang đăng..." : "Đăng"}
          </button>
        </div>

        {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}
      </form>
    </div>
  );
}
