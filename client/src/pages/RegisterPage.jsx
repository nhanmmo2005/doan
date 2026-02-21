import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { http } from "../api/http";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function RegisterPage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verifyToken, setVerifyToken] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // countdown resend OTP
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setInterval(() => setOtpCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [otpCooldown]);

  async function handleSendOtp() {
    setErr("");
    if (!name.trim()) return setErr("Vui lòng nhập họ tên.");
    if (!email.trim()) return setErr("Vui lòng nhập email.");
    if (!password || password.length < 6) return setErr("Mật khẩu tối thiểu 6 ký tự.");
    if (password !== password2) return setErr("Mật khẩu nhập lại không khớp.");

    try {
      setSendingOtp(true);
      await http.post("/api/auth/send-otp", { email });
      setOtpCooldown(60);
      alert("Đã gửi mã OTP về email. Vui lòng kiểm tra hộp thư (hoặc spam).");
    } catch (e) {
      setErr(e?.response?.data?.msg || "Gửi OTP thất bại.");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleVerifyOtp() {
    setErr("");
    if (!otp || otp.trim().length < 6) return setErr("Vui lòng nhập đủ mã OTP 6 số.");

    try {
      setVerifyingOtp(true);
      const res = await http.post("/api/auth/verify-otp", { email, otp: otp.trim() });
      const token = res?.data?.verifyToken;
      if (!token) return setErr("Không nhận được verifyToken.");

      setVerifyToken(token);
      setIsVerified(true);
      alert("Xác thực email thành công!");
    } catch (e) {
      setErr(e?.response?.data?.msg || "Xác thực OTP thất bại.");
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    if (!isVerified || !verifyToken) return setErr("Vui lòng xác thực email trước.");

    try {
      setLoading(true);
      await http.post("/api/auth/register", { name, email, password, verifyToken });
      alert("Đăng ký thành công! Hãy đăng nhập.");
      nav("/login");
    } catch (e) {
      setErr(e?.response?.data?.msg || "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 450, margin: "60px auto", padding: "0 20px" }}>
      <div className="card" style={{ padding: 32 }}>
        <h2 style={{ textAlign: "center", marginBottom: 24, fontWeight: 900 }}>Đăng ký</h2>

        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Họ tên</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              disabled={isVerified}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Email</label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="abc@gmail.com"
              disabled={isVerified}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Mật khẩu</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tối thiểu 6 ký tự"
              disabled={isVerified}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Nhập lại mật khẩu</label>
            <Input
              type="password"
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              disabled={isVerified}
            />
          </div>

          {!isVerified ? (
            <div style={{ marginTop: 24 }}>
              <Button
                type="button"
                variant="primary"
                size="lg"
                className="btn-block"
                onClick={handleSendOtp}
                disabled={sendingOtp || otpCooldown > 0}
              >
                {sendingOtp ? "Đang gửi..." : otpCooldown > 0 ? `Gửi lại sau (${otpCooldown}s)` : "Gửi mã xác thực"}
              </Button>

              {otpCooldown > 0 && !isVerified && (
                <div style={{ marginTop: 20, padding: 20, background: "var(--bg)", borderRadius: 12, border: "1px solid var(--border)" }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Nhập mã OTP (6 số)</label>
                  <div style={{ display: "flex", gap: 12 }}>
                    <Input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      maxLength={6}
                    />
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otp.length < 6}
                    >
                      {verifyingOtp ? "..." : "Xác thực"}
                    </Button>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
                    Mã xác thực đã được gửi đến email của bạn.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <div style={{ color: "var(--primary)", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>✓</span> Email đã được xác thực
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="btn-block"
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Hoàn tất đăng ký"}
              </Button>
            </div>
          )}

          {err && <p style={{ color: "#ef4444", marginTop: 16, textAlign: "center", fontSize: 14 }}>{err}</p>}
        </form>

        <p style={{ marginTop: 24, textAlign: "center", fontSize: 14, color: "var(--muted)" }}>
          Đã có tài khoản? <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>Đăng nhập ngay</Link>
        </p>
      </div>
    </div>
  );
}
