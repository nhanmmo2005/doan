import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { http } from "../api/http"; // nếu file nằm trong src/pages/RegisterPage.jsx
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

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
      await http.post("/api/auth/register", { name, email, password });
      alert("Đăng ký thành công! Hãy đăng nhập.");
      nav("/login");
    } catch (e) {
      setErr(e?.response?.data?.msg || "Đăng ký thất bại.");
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
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Email</label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="abc@gmail.com" />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Mật khẩu</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="tối thiểu 6 ký tự" />
        </div>

        <div style={{ marginTop: 12 }}>
          <label>Nhập lại mật khẩu</label>
          <Input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} />
        </div>

        {err && <p style={{ color: "red", marginTop: 12 }}>{err}</p>}

        <div style={{ marginTop: 16 }}>
          <Button type="submit" variant="primary" size="md" className="btn-block" disabled={loading}>
            {loading ? "Đang đăng ký..." : "Tạo tài khoản"}
          </Button>
        </div>
      </form>

      <p style={{ marginTop: 12 }}>
        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
      </p>
    </div>
  );
}
