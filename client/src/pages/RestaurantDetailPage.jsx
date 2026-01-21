import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { http } from "../api/http";
import { getUser } from "../auth";
import { uploadMedia } from "../api/upload";
import ReviewCommentBox from "../components/ReviewCommentBox";
import Lightbox from "../components/Lightbox";
import {
  FaMapMarkerAlt,
  FaUtensils,
  FaDollarSign,
  FaStar,
  FaRegStar,
  FaLocationArrow,
  FaTrash,
  FaImage,
  FaVideo,
  FaTimes,
} from "react-icons/fa";
import Button from "../components/ui/Button";

function ReviewForm({ restaurant, onSubmit }) {
  const [priceRating, setPriceRating] = useState(0);
  const [foodRating, setFoodRating] = useState(0);
  const [hygieneRating, setHygieneRating] = useState(0);
  const [hoverPrice, setHoverPrice] = useState(0);
  const [hoverFood, setHoverFood] = useState(0);
  const [hoverHygiene, setHoverHygiene] = useState(0);
  const [comment, setComment] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const me = getUser();

  if (!me) return null;

  // Tính trung bình
  const avgRating = priceRating && foodRating && hygieneRating
    ? Math.round((priceRating + foodRating + hygieneRating) / 3)
    : 0;

  function handleMediaSelect(e) {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"));
    
    if (validFiles.length === 0) {
      alert("Chỉ chấp nhận file ảnh hoặc video");
      return;
    }

    if (mediaFiles.length + validFiles.length > 10) {
      alert("Tối đa 10 ảnh/video");
      return;
    }

    setMediaFiles([...mediaFiles, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreviews((prev) => [
          ...prev,
          {
            file,
            url: e.target.result,
            type: file.type.startsWith("image/") ? "image" : "video",
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeMedia(index) {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    setMediaPreviews(mediaPreviews.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!priceRating || priceRating < 1 || priceRating > 5) {
      alert("Vui lòng đánh giá Giá cả");
      return;
    }
    if (!foodRating || foodRating < 1 || foodRating > 5) {
      alert("Vui lòng đánh giá Thức ăn ngon");
      return;
    }
    if (!hygieneRating || hygieneRating < 1 || hygieneRating > 5) {
      alert("Vui lòng đánh giá Vệ sinh thực phẩm");
      return;
    }

    try {
      setSubmitting(true);
      setUploading(true);

      // Upload media first
      let media = [];
      if (mediaFiles.length > 0) {
        const uploadResults = await uploadMedia(mediaFiles);
        media = uploadResults.map((result, idx) => ({
          type: result.mediaType,
          url: result.url,
          sortOrder: idx,
        }));
      }

      // Create review
      await http.post(`/api/reviews`, {
        restaurant_id: restaurant.id,
        price_rating: priceRating,
        food_rating: foodRating,
        hygiene_rating: hygieneRating,
        comment: comment.trim() || null,
        media,
      });

      setPriceRating(0);
      setFoodRating(0);
      setHygieneRating(0);
      setComment("");
      setMediaFiles([]);
      setMediaPreviews([]);
      alert("Đánh giá đã được gửi, đang chờ duyệt!");
      onSubmit?.();
    } catch (e) {
      alert(e?.response?.data?.msg || "Đánh giá thất bại");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  return (
    <div className="card" style={{ padding: 16, marginBottom: 16 }}>
      <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 900 }}>Viết đánh giá</h3>
      <form onSubmit={handleSubmit}>
        {/* Giá cả */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
            Giá cả
          </div>
          <div className="restaurant-review-form-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setPriceRating(star)}
                onMouseEnter={() => setHoverPrice(star)}
                onMouseLeave={() => setHoverPrice(0)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 28,
                  color: star <= (hoverPrice || priceRating) ? "#fbbf24" : "#d1d5db",
                  padding: 0,
                  margin: "0 4px",
                }}
              >
                <FaStar />
              </button>
            ))}
          </div>
        </div>

        {/* Thức ăn ngon */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
            Thức ăn ngon
          </div>
          <div className="restaurant-review-form-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFoodRating(star)}
                onMouseEnter={() => setHoverFood(star)}
                onMouseLeave={() => setHoverFood(0)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 28,
                  color: star <= (hoverFood || foodRating) ? "#fbbf24" : "#d1d5db",
                  padding: 0,
                  margin: "0 4px",
                }}
              >
                <FaStar />
              </button>
            ))}
          </div>
        </div>

        {/* Vệ sinh thực phẩm */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
            Vệ sinh thực phẩm
          </div>
          <div className="restaurant-review-form-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setHygieneRating(star)}
                onMouseEnter={() => setHoverHygiene(star)}
                onMouseLeave={() => setHoverHygiene(0)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 28,
                  color: star <= (hoverHygiene || hygieneRating) ? "#fbbf24" : "#d1d5db",
                  padding: 0,
                  margin: "0 4px",
                }}
              >
                <FaStar />
              </button>
            ))}
          </div>
        </div>

        {/* Điểm trung bình */}
        {avgRating > 0 && (
          <div style={{ marginBottom: 16, padding: 12, background: "var(--chip)", borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>Điểm trung bình</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  style={{
                    color: star <= avgRating ? "#fbbf24" : "#d1d5db",
                    fontSize: 24,
                  }}
                />
              ))}
              <span style={{ fontSize: 16, fontWeight: 700, marginLeft: 8 }}>
                {avgRating}/5
              </span>
            </div>
          </div>
        )}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn (tùy chọn)"
          rows={4}
          maxLength={500}
          style={{
            width: "100%",
            padding: 12,
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 14,
            resize: "vertical",
            outline: "none",
            fontFamily: "inherit",
            marginBottom: 12,
          }}
        />
        
        {/* Media upload */}
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              background: "var(--chip)",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <FaImage /> <FaVideo /> Thêm ảnh/video
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleMediaSelect}
              style={{ display: "none" }}
              disabled={submitting || mediaFiles.length >= 10}
            />
          </label>
          {mediaFiles.length > 0 && (
            <span style={{ marginLeft: 12, fontSize: 12, color: "var(--muted)" }}>
              {mediaFiles.length}/10
            </span>
          )}
        </div>

        {/* Media previews */}
        {mediaPreviews.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {mediaPreviews.map((preview, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  width: 100,
                  height: 100,
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                }}
              >
                {preview.type === "image" ? (
                  <img
                    src={preview.url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <video
                    src={preview.url}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMedia(idx)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    borderRadius: "50%",
                    width: 28,
                    height: 28,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    border: "none",
                  }}
                >
                  <FaTimes />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            {comment.length}/500 ký tự
          </span>
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!avgRating || submitting || uploading}
          style={{ minWidth: 120 }}
        >
          {uploading ? "Đang tải..." : submitting ? "Đang gửi..." : "Gửi đánh giá"}
        </Button>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
          * Đánh giá cần được admin duyệt trước khi hiển thị
        </div>
      </form>
    </div>
  );
}

function ReviewItem({ review, onDelete }) {
  const me = getUser();
  const canDelete = me && (me.id === review.user_id || me.role === "admin");
  const [showComments, setShowComments] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  function fmtTime(ts) {
    try {
      const d = new Date(ts);
      const now = new Date();
      const diff = now - d;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return "Vừa xong";
      if (minutes < 60) return `${minutes} phút trước`;
      if (hours < 24) return `${hours} giờ trước`;
      if (days < 7) return `${days} ngày trước`;
      return d.toLocaleDateString("vi-VN");
    } catch {
      return "";
    }
  }

  return (
    <div className="restaurant-review-item">
      <div className="restaurant-review-header">
        <div className="restaurant-review-author">
          {review.author_avatar ? (
            <img src={review.author_avatar} alt={review.author_name} />
          ) : (
            <div className="restaurant-review-avatar-char">
              {(review.author_name?.[0] || "U").toUpperCase()}
            </div>
          )}
          <div>
            <div className="restaurant-review-author-name">{review.author_name}</div>
            <div className="restaurant-review-time">{fmtTime(review.created_at)}</div>
          </div>
        </div>
        <div className="restaurant-review-rating">
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                style={{
                  color: star <= review.rating ? "#fbbf24" : "#d1d5db",
                  fontSize: 14,
                }}
              />
            ))}
            <span style={{ marginLeft: 4, fontSize: 13, fontWeight: 600 }}>
              {review.rating}/5
            </span>
          </div>
          {(review.price_rating || review.food_rating || review.hygiene_rating) && (
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
              Giá: {review.price_rating || "N/A"} • Món: {review.food_rating || "N/A"} • Vệ sinh: {review.hygiene_rating || "N/A"}
            </div>
          )}
        </div>
      </div>
      {review.comment && (
        <div className="restaurant-review-comment">{review.comment}</div>
      )}
      {review.media && review.media.length > 0 && (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
            {review.media.map((m, idx) => (
              <div
                key={idx}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                onClick={() => {
                  setLightboxIndex(idx);
                  setLightboxOpen(true);
                }}
              >
                {m.type === "image" ? (
                  <img
                    src={m.url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", position: "relative", background: "#000" }}>
                    <video
                      src={m.url}
                      style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
                      muted
                      playsInline
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        background: "rgba(0,0,0,0.7)",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        pointerEvents: "none",
                      }}
                    >
                      ▶ VIDEO
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Lightbox
            open={lightboxOpen}
            items={review.media.map((m) => ({
              url: m.url,
              mediaType: m.type,
            }))}
            index={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
            onPrev={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : review.media.length - 1))}
            onNext={() => setLightboxIndex((prev) => (prev < review.media.length - 1 ? prev + 1 : 0))}
          />
        </>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          style={{ background: "transparent", border: "none", color: "var(--primary)", padding: 0 }}
        >
          {review.comment_count || 0} bình luận
        </Button>
        {canDelete && (
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="restaurant-review-delete"
            onClick={() => {
              if (confirm("Xoá đánh giá này?")) {
                onDelete(review.id);
              }
            }}
            title="Xoá đánh giá"
          >
            <FaTrash />
          </Button>
        )}
      </div>
      {showComments && <ReviewCommentBox reviewId={review.id} />}
    </div>
  );
}

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    loadRestaurant();
    loadReviews();
  }, [id]);

  async function loadRestaurant() {
    setErr("");
    try {
      setLoading(true);
      const res = await http.get(`/api/restaurants/${id}`);
      if (res.data) {
        setRestaurant(res.data);
      } else {
        setErr("Không tìm thấy quán ăn");
      }
    } catch (e) {
      console.error("Load restaurant error:", e);
      setErr(e?.response?.data?.msg || "Tải thông tin quán thất bại");
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews() {
    try {
      setReviewsLoading(true);
      const res = await http.get(`/api/reviews`, {
        params: { restaurant_id: id },
      });
      setReviews(res.data || []);
    } catch (e) {
      console.error("Load reviews error:", e);
    } finally {
      setReviewsLoading(false);
    }
  }

  async function handleDeleteReview(reviewId) {
    const me = getUser();
    if (!me) return;
    
    try {
      // User có thể xóa review của mình qua /api/reviews/:id
      // Admin có thể xóa qua /api/admin/reviews/:id
      const review = reviews.find((r) => r.id === reviewId);
      if (me.role === "admin") {
        await http.delete(`/api/admin/reviews/${reviewId}`);
      } else {
        await http.delete(`/api/reviews/${reviewId}`);
      }
      await loadReviews();
      await loadRestaurant(); // Reload để cập nhật avg_rating
    } catch (e) {
      alert(e?.response?.data?.msg || "Xoá đánh giá thất bại");
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="feed-wrap col">
          <div className="pill">Đang tải...</div>
        </div>
      </AppLayout>
    );
  }

  if (err || !restaurant) {
    return (
      <AppLayout>
        <div className="feed-wrap col">
          <div className="err">{err || "Không tìm thấy quán ăn"}</div>
        </div>
      </AppLayout>
    );
  }

  const mealTimeLabels = {
    sang: "Ăn sáng",
    trua: "Ăn trưa",
    toi: "Ăn tối",
    vat: "Ăn vặt",
    henho: "Hẹn hò",
    all: "Mọi lúc",
  };

  return (
    <AppLayout>
      <div className="feed-wrap col">
        <div className="card" style={{ overflow: "hidden", marginBottom: 16 }}>
          {restaurant.image_url ? (
            <img
              src={restaurant.image_url}
              alt={restaurant.name}
              style={{ width: "100%", height: 320, objectFit: "cover", display: "block" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: 320,
                background: "var(--bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
                fontSize: 64,
              }}
            >
              <FaUtensils />
            </div>
          )}
          <div style={{ padding: 20 }}>
            <div className="spread" style={{ marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ margin: "0 0 12px 0", fontSize: 24, fontWeight: 900 }}>
                  {restaurant.name}
                </h1>
                <div className="restaurant-detail-meta" style={{ marginBottom: 8 }}>
                  {restaurant.type && (
                    <span className="restaurant-detail-meta-item">
                      <FaUtensils /> {restaurant.type}
                    </span>
                  )}
                  {restaurant.area && (
                    <span className="restaurant-detail-meta-item">
                      <FaMapMarkerAlt /> {restaurant.area}
                    </span>
                  )}
                  {restaurant.price_range && (
                    <span className="restaurant-detail-meta-item">
                      <FaDollarSign /> {restaurant.price_range}
                    </span>
                  )}
                  {restaurant.meal_time && restaurant.meal_time !== "all" && (
                    <span className="restaurant-detail-meta-item">
                      {mealTimeLabels[restaurant.meal_time]}
                    </span>
                  )}
                </div>
                {restaurant.address && (
                  <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>
                    <FaMapMarkerAlt style={{ marginRight: 4 }} />
                    {restaurant.address}
                  </div>
                )}
                {restaurant.latitude && restaurant.longitude && (
                  <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 12 }}>
                    <FaLocationArrow style={{ marginRight: 4 }} />
                    {typeof restaurant.latitude === 'number' ? restaurant.latitude.toFixed(6) : restaurant.latitude}, {typeof restaurant.longitude === 'number' ? restaurant.longitude.toFixed(6) : restaurant.longitude}
                  </div>
                )}
                {restaurant.avg_rating && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <FaStar style={{ color: "#fbbf24", fontSize: 20 }} />
                      <span style={{ fontSize: 18, fontWeight: 900 }}>
                        {parseFloat(restaurant.avg_rating).toFixed(1)}
                      </span>
                    </div>
                    <span style={{ color: "var(--muted)", fontSize: 14 }}>
                      ({restaurant.review_count || 0} đánh giá)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <ReviewForm restaurant={restaurant} onSubmit={() => {
          loadReviews();
          loadRestaurant();
        }} />

        <div className="card" style={{ padding: 16 }}>
          <h2 style={{ margin: "0 0 16px 0", fontSize: 18, fontWeight: 900 }}>
            Đánh giá ({reviews.length})
          </h2>
          <div className="hr" style={{ marginBottom: 16 }} />

          {reviewsLoading ? (
            <div className="pill">Đang tải đánh giá...</div>
          ) : reviews.length === 0 ? (
            <div style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>
              Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá quán này!
            </div>
          ) : (
            <div className="restaurant-reviews-list">
              {reviews.map((review) => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  onDelete={handleDeleteReview}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
