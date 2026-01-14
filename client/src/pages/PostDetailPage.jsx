// client/src/pages/PostDetailPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import FeedPostCard from "../components/FeedPostCard";
import { http } from "../api/http";

export default function PostDetailPage() {
  const nav = useNavigate();
  const { id } = useParams();

  const [post, setPost] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await http.get(`/api/posts/${id}`);
      setPost(res.data);
    } catch (e) {
      setPost(null);
      setErr(e?.response?.data?.msg || "Không tải được bài viết");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fullLink = `${window.location.origin}/posts/${id}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      window.prompt("Copy link bài viết:", fullLink);
    }
  }

  async function like(postId) {
    try {
      await http.post(`/api/posts/${postId}/like`);
      await load();
    } catch {}
  }

  return (
    <AppLayout>
      <div className="feed-wrap col">
        <div
          className="card"
          style={{ padding: 14, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
        >
          <button type="button" className="chip" onClick={() => nav(-1)}>
            ← Quay lại
          </button>

          <div className="pill" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span className="muted" style={{ fontSize: 13 }}>Link bài viết</span>
            <a
              href={fullLink}
              style={{
                textDecoration: "none",
                color: "inherit",
                maxWidth: 420,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={fullLink}
            >
              {fullLink}
            </a>
          </div>

          <button type="button" className="chip" onClick={copyLink}>
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>

        {loading && <div className="pill">Đang tải...</div>}
        {err && !loading && <div className="err">{err}</div>}

        {!loading && !err && post && (
          <FeedPostCard
            post={post}
            onLike={like}
            onChanged={load}
            autoOpenComments={true}
          />
        )}
      </div>
    </AppLayout>
  );
}
