import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import FeedPostCard from "../components/FeedPostCard";
import { http } from "../api/http";

export default function PostDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [post, setPost] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const postUrl = useMemo(() => `${window.location.origin}/posts/${id}`, [id]);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const res = await http.get(`/api/posts/${id}`);
      setPost(res.data);
    } catch (e) {
      setErr(e.response?.data?.msg || "Không tải được bài viết");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function like(postId) {
    try {
      await http.post(`/api/posts/${postId}/like`);
      await load();
    } catch {}
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      window.prompt("Copy link bài viết:", postUrl);
    }
  }

  return (
    <AppLayout>
      <div className="feed-wrap col">
        <div className="detailTopBar">
          <button className="chip" onClick={() => nav(-1)}>← Quay lại</button>

          <div className="detailLink">
            <div className="muted" style={{ fontSize: 12 }}>Link bài viết</div>
            <div className="detailLinkRow">
              <span className="truncate">{postUrl}</span>
              <button className="chip" type="button" onClick={copyLink}>
                {copied ? "Đã copy ✓" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {loading && <div className="pill">Đang tải…</div>}
        {err && <div className="err">{err}</div>}

        {post && <FeedPostCard post={post} onLike={like} autoOpenComments />}
      </div>
    </AppLayout>
  );
}
