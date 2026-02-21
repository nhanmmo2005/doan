import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import Composer from "../components/Composer";
import FeedPostCard from "../components/FeedPostCard";
import { http } from "../api/http";
import { getUser } from "../auth";
import HotList from "../components/HotList";

export default function FeedPage() {
  const loc = useLocation();
  const search = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const focusComment = search.get("focus_comment");
  const focusReviewComment = search.get("focus_review_comment");

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

  const user = getUser();

  return (
    <AppLayout left={<HotList restaurants={restaurants} />}>
      <div className="feed-wrap col">
        {user ? <Composer restaurants={restaurants} onSubmit={createPost} loading={loadingPost} /> : null}
        {err && <div className="err">{err}</div>}

        {posts.map((p) => (
          <FeedPostCard key={p.id} post={p} onLike={like} onChanged={load} />
        ))}

        {!posts.length && <div className="pill">Chưa có bài nào</div>}
      </div>
    </AppLayout>
  );
}
