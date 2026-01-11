import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import FeedPostCard from "../components/FeedPostCard";
import { http } from "../api/http";

export default function PostDetailPage() {
  const { id } = useParams();
  const nav = useNavigate();

  const [post, setPost] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function like(postId) {
    try {
      await http.post(`/api/posts/${postId}/like`);
      await load();
    } catch {}
  }

  return (
    <AppLayout>
      <div className="feed-wrap col">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="chip" onClick={() => nav(-1)}>← Quay lại</button>
          <div className="pill">Link share: /posts/{id}</div>
        </div>

        {loading && <div className="pill">Đang tải...</div>}
        {err && <div className="err">{err}</div>}

        {post && <FeedPostCard post={post} onLike={like} autoOpenComments />}
      </div>
    </AppLayout>
  );
}
