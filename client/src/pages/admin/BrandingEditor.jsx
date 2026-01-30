import { useState, useEffect } from "react";
import Button from "../../components/ui/Button";

export default function BrandingEditor() {
  const [title, setTitle] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [msg, setMsg] = useState("");

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
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>URL logo (ảnh vuông)</label>
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--border)" }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="primary" onClick={save}>Lưu</Button>
          <Button variant="secondary" onClick={clearBrand}>Xoá</Button>
        </div>

        {msg && <div style={{ color: "var(--muted)", fontWeight: 700 }}>{msg}</div>}
      </div>
    </div>
  );
}

