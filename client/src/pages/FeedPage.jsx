import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import Composer from "../components/Composer";
import FeedPostCard from "../components/FeedPostCard";
import { http } from "../api/http";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loadingPost, setLoadingPost] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const [p, r] = await Promise.all([
        http.get("/api/posts"),
        http.get("/api/restaurants"),
      ]);
      setPosts(p.data);
      setRestaurants(r.data);
    } catch (e) {
      setErr(e.response?.data?.msg || "Server error");
    }
  }

  useEffect(() => { load(); }, []);

  async function createPost(payload) {
    setErr("");
    try {
      setLoadingPost(true);
      await http.post("/api/posts", payload);
      await load();
    } catch (e) {
      setErr(e.response?.data?.msg || "Đăng bài thất bại");
    } finally {
      setLoadingPost(false);
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
        <Composer restaurants={restaurants} onSubmit={createPost} loading={loadingPost} />
        {err && <div className="err">{err}</div>}

        {posts.map((p) => (
          <FeedPostCard key={p.id} post={p} onLike={like} onChanged={load} />
        ))}


        {!posts.length && <div className="pill">Chưa có bài nào</div>}
      </div>
    </AppLayout>
  );
}
