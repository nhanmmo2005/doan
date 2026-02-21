import { useEffect, useRef, useState } from "react";
import Button from "../../components/ui/Button";
import { uploadMedia } from "../../api/upload";

export default function BrandingEditor() {
  const [title, setTitle] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("siteBrand");
      if (stored) {
        const parsed = JSON.parse(stored);
        setTitle(parsed.title || "");
        setLogoUrl(parsed.logoUrl || "");
      } else {
        setTitle("Foodbook");
        setLogoUrl("");
      }
    } catch (e) {
      setTitle("Foodbook");
    }
  }, []);

  async function handlePickLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // basic validation
    if (!file.type?.startsWith("image/")) {
      setMsg("Vui lòng chọn file ảnh");
      return;
    }

    setMsg("");
    setUploading(true);
    try {
      const res = await uploadMedia([file]);
      const url = res?.[0]?.url;
      if (!url) throw new Error("Upload không trả về url");
      setLogoUrl(url);
      setMsg("Upload logo thành công. Bấm Lưu để áp dụng.");
    } catch (err) {
      console.error(err);
      setMsg("Upload logo thất bại");
    } finally {
      setUploading(false);
      // allow re-select same file
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function save() {
    try {
      const payload = { title: title || "Foodbook", logoUrl: logoUrl || null };
      localStorage.setItem("siteBrand", JSON.stringify(payload));
      setMsg("Lưu thành công — làm mới trang để thấy thay đổi.");
    } catch (e) {
      setMsg("Lưu thất bại");
    }
  }

  function clearBrand() {
    localStorage.removeItem("siteBrand");
    setTitle("Foodbook");
    setLogoUrl("");
    setMsg("Đã xoá cấu hình — làm mới trang để thấy thay đổi.");
  }

  return (
    <div style={{ padding: 12, maxWidth: 680 }}>
      <h3>Chỉnh Branding (tiêu đề & logo)</h3>
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Tiêu đề trang</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Logo</label>

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid var(--border)",
                background: "var(--bg)",
                display: "grid",
                placeItems: "center",
              }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "var(--muted)", fontWeight: 800 }}>No logo</span>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handlePickLogo}
                style={{ display: "none" }}
              />
              <Button
                variant="secondary"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Đang upload..." : "Chọn ảnh từ máy"}
              </Button>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>URL logo (tuỳ chọn)</label>
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)" }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="primary" onClick={save}>
            Lưu
          </Button>
          <Button variant="secondary" onClick={clearBrand}>
            Xoá
          </Button>
        </div>

        {msg && <div style={{ color: "var(--muted)", fontWeight: 700 }}>{msg}</div>}
      </div>
    </div>
  );
}
