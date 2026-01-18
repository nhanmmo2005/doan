import { useEffect, useMemo, useRef, useState } from "react";
import { uploadMedia } from "../api/upload";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhotoFilm,
  faTriangleExclamation,
  faUtensils,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";

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
      {/* Videos: 1 dòng / video */}
      {videos.map((v, idx) => (
        <div className="preview-video" key={`v-${idx}`}>
          <video controls preload="metadata">
            <source src={v.url} />
          </video>
          <button
            type="button"
            className="preview-remove"
            onClick={() => onRemove(v.file)}
            aria-label="Bỏ video"
            title="Bỏ"
          >
            ×
          </button>
        </div>
      ))}

      {/* Images grid */}
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
                <button
                  type="button"
                  className="preview-remove"
                  onClick={() => onRemove(img.file)}
                  aria-label="Bỏ ảnh"
                  title="Bỏ"
                >
                  ×
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
  const [restaurantId, setRestaurantId] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);

  const fileRef = useRef(null);
  const areaRef = useRef(null);

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
        media = await uploadMedia(files);
      }

      await onSubmit({
        type: "status",
        content,
        media,
        restaurantId: restaurantId || null,
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
    if (!count) return "";
    return `Đã chọn ${count}/${MAX_FILES} file`;
  }, [files.length]);

  return (
    <div className="card composer-card">
      <div className="composer-head">
        <div className="composer-title">Tạo bài viết</div>
        <div className="composer-sub">Status / rủ kèo / hỏi quán ngon — mạng xã hội mini</div>
      </div>

      <form onSubmit={handleSubmit} className="composer-form">
        {!!restaurants?.length && (
          <div className="composer-tag">
            <span className="label">
              <FontAwesomeIcon icon={faUtensils} /> Gắn quán (tuỳ chọn)
            </span>
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
              <FontAwesomeIcon icon={faPhotoFilm} />
              <span>Ảnh/Video</span>
            </button>

            <span className="pill">
              <FontAwesomeIcon icon={faTriangleExclamation} />
              <span>Từ thô tục sẽ bị che</span>
            </span>
          </div>

          <button className="btn-primary" disabled={busy}>
            <FontAwesomeIcon icon={faPaperPlane} />
            <span style={{ marginLeft: 8 }}>{busy ? "Đang đăng..." : "Đăng"}</span>
          </button>
        </div>

        {err && (
          <div className="err" style={{ marginTop: 10 }}>
            {err}
          </div>
        )}
      </form>
    </div>
  );
}
