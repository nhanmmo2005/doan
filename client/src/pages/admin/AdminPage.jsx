import { useEffect, useState } from "react";
import axios from "axios";
import AppLayout from "../../components/AppLayout";

const API = "http://localhost:5000";

export default function AdminPage() {
  const token = localStorage.getItem("token");
  const [pending, setPending] = useState([]);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const res = await axios.get(`${API}/api/admin/posts/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPending(res.data);
    } catch (e) {
      setErr(e.response?.data?.msg || "Không tải được danh sách pending.");
    }
  }

  async function setStatus(id, status) {
    setErr("");
    try {
      await axios.patch(
        `${API}/api/admin/posts/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await load();
    } catch (e) {
      setErr(e.response?.data?.msg || "Cập nhật thất bại.");
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <AppLayout>
      <div className="grid">
        <div className="card" style={{ padding: 14 }}>
          <div className="spread">
            <div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>🛠️ Admin Dashboard</div>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>
                Duyệt bài viết: pending → approved / rejected
              </div>
            </div>
            <button className="navbtn" onClick={load}>↻ Tải lại</button>
          </div>

          {err && <div className="err" style={{ marginTop: 12 }}>{err}</div>}

          <div className="hr" />

          <div className="col" style={{ gap: 12 }}>
            {pending.map((p) => (
              <div key={p.id} className="card post">
                <div className="spread">
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      {p.author_name} • {p.restaurant_name} • ⭐{p.rating}
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 12 }}>
                      {new Date(p.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className="badge">pending</span>
                </div>

                <p style={{ marginTop: 10, color: "#dbe5ff", lineHeight: 1.5 }}>
                  {p.content}
                </p>

                <div className="spread" style={{ marginTop: 10 }}>
                  <span className="pill">ID: {p.id}</span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setStatus(p.id, "rejected")}>Từ chối</button>
                    <button onClick={() => setStatus(p.id, "approved")}>Duyệt</button>
                  </div>
                </div>
              </div>
            ))}

            {!pending.length && (
              <div style={{ color: "var(--muted)" }}>
                Không có bài chờ duyệt.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
