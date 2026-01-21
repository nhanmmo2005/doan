// client/src/pages/ProfilePage.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { http } from "../api/http";
import { getUser } from "../auth";
import FeedPostCard from "../components/FeedPostCard";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import {
  FaUser,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaFileAlt,
  FaHandshake,
  FaUsers,
  FaUserPlus,
  FaImage,
  FaStar,
} from "react-icons/fa";

function ProfileHeader({ profile, onChanged }) {
  const me = getUser();
  const isMe = profile.is_me;
  const [editing, setEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [name, setName] = useState(profile.name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setName(profile.name || "");
    setBio(profile.bio || "");
  }, [profile]);

  async function handleFollow() {
    try {
      if (profile.is_following) {
        await http.post(`/api/users/${profile.id}/unfollow`);
      } else {
        await http.post(`/api/users/${profile.id}/follow`);
      }
      onChanged?.();
    } catch (e) {
      alert(e?.response?.data?.msg || "Thao tác thất bại");
    }
  }

  async function handleSave() {
    setErr("");
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("bio", bio.trim());
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      await http.put(`/api/users/${profile.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setEditing(false);
      setAvatarFile(null);
      onChanged?.();
    } catch (e) {
      setErr(e?.response?.data?.msg || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  }

  const avatarDisplay = avatarFile
    ? URL.createObjectURL(avatarFile)
    : profile.avatar_url || null;

  return (
    <div className="card profile-header">
      <div className="profile-avatar-section">
        <div className="profile-avatar-wrapper">
          {editing ? (
            <label className="avatar-upload-label">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files[0])}
                style={{ display: "none" }}
              />
              {avatarDisplay ? (
                <img src={avatarDisplay} alt="Avatar" className="profile-avatar-large" />
              ) : (
                <div className="profile-avatar-large profile-avatar-placeholder">
                  <FaUser />
                </div>
              )}
              <div className="avatar-upload-overlay">
                <FaImage />
                <span>Đổi ảnh</span>
              </div>
            </label>
          ) : (
            <div className="profile-avatar-large">
              {avatarDisplay ? (
                <img src={avatarDisplay} alt={profile.name} />
              ) : (
                <div className="profile-avatar-placeholder">
                  {(profile.name?.[0] || "U").toUpperCase()}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="profile-info">
          {editing ? (
            <>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên"
                className="profile-edit-input"
                maxLength={100}
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Giới thiệu về bạn..."
                className="profile-edit-textarea"
                rows={3}
                maxLength={500}
              />
              {err && <div className="err" style={{ marginTop: 8, marginBottom: 8 }}>{err}</div>}
              <div className="profile-edit-actions">
                <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>
                  Huỷ
                </Button>
                <Button type="button" variant="primary" size="sm" onClick={handleSave} disabled={loading}>
                  {loading ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="profile-name">{profile.name}</h1>
              {profile.bio && <p className="profile-bio">{profile.bio}</p>}
              <div className="profile-stats">
                <div className="profile-stat-item">
                  <FaFileAlt className="profile-stat-icon" />
                  <span>{profile.post_count || 0} bài viết</span>
                </div>
                <div className="profile-stat-item">
                  <FaUsers className="profile-stat-icon" />
                  <span>{profile.follower_count || 0} người theo dõi</span>
                </div>
                <div className="profile-stat-item">
                  <FaUserPlus className="profile-stat-icon" />
                  <span>Đang theo dõi {profile.following_count || 0}</span>
                </div>
                {profile.eating_plan_count > 0 && (
                  <div className="profile-stat-item">
                    <FaHandshake className="profile-stat-icon" />
                    <span>{profile.eating_plan_count} kèo ăn</span>
                  </div>
                )}
                {(profile.review_count || 0) > 0 && (
                  <div className="profile-stat-item">
                    <FaStar className="profile-stat-icon" />
                    <span>Đã đánh giá {profile.review_count || 0} quán</span>
                  </div>
                )}
              </div>
              {isMe ? (
                <Button type="button" variant="primary" size="md" onClick={() => setEditing(true)}>
                  <FaEdit style={{ marginRight: 6 }} />
                  Chỉnh sửa hồ sơ
                </Button>
              ) : (
                <Button
                  type="button"
                  variant={profile.is_following ? "secondary" : "primary"}
                  size="sm"
                  onClick={handleFollow}
                >
                  {profile.is_following ? (
                    <>
                      <FaCheckCircle style={{ marginRight: 6 }} />
                      Đã theo dõi
                    </>
                  ) : (
                    <>
                      <FaUserPlus style={{ marginRight: 6 }} />
                      Theo dõi
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function fmtDate(dt) {
  try {
    const d = new Date(dt);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString("vi-VN");
  } catch {
    return "";
  }
}

export default function ProfilePage() {
  const { id } = useParams();
  const me = getUser();
  const userId = id ? Number(id) : me?.id;

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [eatingPlans, setEatingPlans] = useState([]);
  const [activeTab, setActiveTab] = useState("posts"); // 'posts' | 'eating-plans'
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (userId) loadProfile();
  }, [userId]);

  useEffect(() => {
    if (userId) {
      if (activeTab === "posts") {
        loadPosts();
      } else {
        loadEatingPlans();
      }
    }
  }, [userId, activeTab]);

  async function loadProfile() {
    setErr("");
    try {
      setLoading(true);
      const res = await http.get(`/api/users/${userId}`);
      setProfile(res.data);
    } catch (e) {
      setErr(e?.response?.data?.msg || "Tải hồ sơ thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function loadPosts() {
    try {
      const res = await http.get(`/api/users/${userId}/posts`);
      setPosts(res.data || []);
    } catch (e) {
      console.error("Load posts error:", e);
      setPosts([]);
    }
  }

  async function loadEatingPlans() {
    try {
      const res = await http.get(`/api/users/${userId}/eating-plans`);
      setEatingPlans(res.data || []);
    } catch (e) {
      console.error("Load eating plans error:", e);
      setEatingPlans([]);
    }
  }

  async function like(postId) {
    try {
      await http.post(`/api/posts/${postId}/like`);
      await loadPosts();
    } catch {}
  }

  if (!userId) {
    return (
      <AppLayout>
        <div className="feed-wrap col">
          <div className="err">Vui lòng đăng nhập</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="feed-wrap col">
        {err && <div className="err">{err}</div>}

        {loading && !profile && <div className="pill">Đang tải...</div>}

        {profile && (
          <>
            <ProfileHeader profile={profile} onChanged={loadProfile} />

            <div className="card profile-tabs">
              <button
                type="button"
                className={`tab ${activeTab === "posts" ? "active" : ""}`}
                onClick={() => setActiveTab("posts")}
              >
                <FaFileAlt style={{ marginRight: 6 }} />
                Bài viết ({profile.post_count || 0})
              </button>
              <button
                type="button"
                className={`tab ${activeTab === "eating-plans" ? "active" : ""}`}
                onClick={() => setActiveTab("eating-plans")}
              >
                <FaHandshake style={{ marginRight: 6 }} />
                Kèo ăn ({profile.eating_plan_count || 0})
              </button>
            </div>

            {activeTab === "posts" && (
              <div className="col">
                {posts.length === 0 ? (
                  <div className="card" style={{ padding: 40, textAlign: "center" }}>
                    <FaFileAlt style={{ fontSize: 48, color: "var(--muted)", marginBottom: 16 }} />
                    <p style={{ color: "var(--muted)", margin: 0 }}>Chưa có bài viết nào</p>
                  </div>
                ) : (
                  posts.map((p) => (
                    <FeedPostCard key={p.id} post={p} onLike={like} onChanged={loadPosts} />
                  ))
                )}
              </div>
            )}

            {activeTab === "eating-plans" && (
              <div className="col">
                {eatingPlans.length === 0 ? (
                  <div className="card" style={{ padding: 40, textAlign: "center" }}>
                    <FaHandshake style={{ fontSize: 48, color: "var(--muted)", marginBottom: 16 }} />
                    <p style={{ color: "var(--muted)", margin: 0 }}>Chưa có kèo ăn nào</p>
                  </div>
                ) : (
                  eatingPlans.map((plan) => (
                    <div key={plan.id} className="card keo-an-card">
                      <div className="keo-an-header">
                        <h3 className="keo-an-title">{plan.title}</h3>
                        <div className="keo-an-meta">
                          <span>{fmtDate(plan.planned_at)}</span>
                          <span>{plan.participant_count || 0} người tham gia</span>
                        </div>
                      </div>
                      {plan.description && <div className="keo-an-description">{plan.description}</div>}
                      <Link
                        to={`/keo-an`}
                        className="chip"
                        style={{ marginTop: 12, display: "inline-block" }}
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
