import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { http } from "../api/http";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";



export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      setLoading(true);
      const res = await http.post("/api/auth/login", { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "admin") nav("/admin");
      else nav("/feed");
    } catch (e) {
      setErr(e.response?.data?.msg || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
      <h2>Đăng nhập</h2>

      <form onSubmit={onSubmit}>
        <div>
          <label>Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@domain.com" />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Mật khẩu</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {err && <p style={{ color: "red", marginTop: 12 }}>{err}</p>}

        <div style={{ marginTop: 16 }}>
          <Button type="submit" variant="primary" size="md" className="btn-block" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </div>
      </form>

      <p style={{ marginTop: 12 }}>
        Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
      </p>
    </div>
  );
}
