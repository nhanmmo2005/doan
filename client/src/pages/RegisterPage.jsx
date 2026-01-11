import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

export default function RegisterPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!name || !email || !password) return setErr("Vui lòng nhập đủ thông tin.");
    if (password.length < 6) return setErr("Mật khẩu tối thiểu 6 ký tự.");
    if (password !== password2) return setErr("Mật khẩu nhập lại không khớp.");

    try {
      setLoading(true);
      await axios.post(`${API}/api/auth/register`, { name, email, password });
      alert("Đăng ký thành công! Hãy đăng nhập.");
      nav("/login");
    } catch (e) {
      setErr(e.response?.data?.msg || "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 20 }}>
      <h2>Đăng ký</h2>

      <form onSubmit={onSubmit}>
        <div>
          <label>Họ tên</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%" }}
            placeholder="Nguyễn Văn A"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%" }}
            placeholder="abc@gmail.com"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Mật khẩu</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%" }}
            placeholder="tối thiểu 6 ký tự"
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Nhập lại mật khẩu</label>
          <input
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        {err && <p style={{ color: "red", marginTop: 12 }}>{err}</p>}

        <button disabled={loading} style={{ marginTop: 16, width: "100%" }}>
          {loading ? "Đang đăng ký..." : "Tạo tài khoản"}
        </button>
      </form>

      <p style={{ marginTop: 12 }}>
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </div>
  );
}
