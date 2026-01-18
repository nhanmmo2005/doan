import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import { http } from "../api/http";
import { getUser } from "../auth";
import {
  FaSearch,
  FaUtensils,
  FaMapMarkerAlt,
  FaDollarSign,
  FaFilter,
  FaTimes,
  FaStar,
  FaRegStar,
  FaLocationArrow,
  FaSort,
  FaSun,
  FaMoon,
  FaCloudSun,
  FaHeart,
  FaShoppingBag,
} from "react-icons/fa";

// Rating Component for inline rating
function RestaurantRating({ restaurant, onRate }) {
  const [hoverRating, setHoverRating] = useState(0);
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const me = getUser();

  if (!me) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!rating || rating < 1 || rating > 5) {
      alert("Vui lòng chọn điểm từ 1-5 sao");
      return;
    }

    try {
      setSubmitting(true);
      await http.post(`/api/restaurants/${restaurant.id}/reviews`, {
        rating,
        comment: comment.trim() || null,
      });
      setShowRatingPopup(false);
      setRating(0);
      setComment("");
      onRate?.();
    } catch (e) {
      alert(e?.response?.data?.msg || "Đánh giá thất bại");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="restaurant-rating-wrapper"
      onMouseEnter={() => setShowRatingPopup(true)}
      onMouseLeave={() => setShowRatingPopup(false)}
      onClick={(e) => {
        // Only prevent default for rating actions, not for parent Link
        e.stopPropagation();
      }}
    >
      <div className="restaurant-rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={(e) => {
              e.stopPropagation();
              setRating(star);
            }}
            style={{ cursor: "pointer", color: star <= (hoverRating || rating || Math.round(restaurant.avg_rating || 0)) ? "#fbbf24" : "#d1d5db" }}
          >
            {star <= (hoverRating || rating || Math.round(restaurant.avg_rating || 0)) ? <FaStar /> : <FaRegStar />}
          </span>
        ))}
        {restaurant.avg_rating && (
          <span className="restaurant-rating-text">
            {parseFloat(restaurant.avg_rating).toFixed(1)} ({restaurant.review_count || 0})
          </span>
        )}
      </div>

      {showRatingPopup && (
        <form 
          className="restaurant-rating-popup" 
          onSubmit={handleSubmit}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="restaurant-rating-popup-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRating(star);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 24,
                  color: star <= (hoverRating || rating) ? "#fbbf24" : "#d1d5db",
                }}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <FaStar />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Viết đánh giá (tùy chọn)"
            rows={2}
            style={{ width: "100%", marginTop: 8, padding: 8, border: "1px solid var(--border)", borderRadius: 8 }}
            maxLength={500}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="submit"
            className="primary"
            disabled={!rating || submitting}
            style={{ marginTop: 8, width: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            {submitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </form>
      )}
    </div>
  );
}

export default function RestaurantsPage() {
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [mealTime, setMealTime] = useState("");
  const [sort, setSort] = useState("name");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState("");
  const [locationError, setLocationError] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  // Request location
  useEffect(() => {
    if (navigator.geolocation) {
      setLocationLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          setLocation({
            lat,
            lng,
          });
          setLocationError("");
          setLocationLoading(false);

          // Reverse geocode để lấy địa chỉ
          fetchAddress(lat, lng);
        },
        (error) => {
          setLocationError("Không thể lấy vị trí");
          setLocationLoading(false);
        }
      );
    }
  }, []);

  // Function để reverse geocode
  async function fetchAddress(lat, lng) {
    setAddressLoading(true);
    try {
      // Sử dụng OpenStreetMap Nominatim API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'FoodbookApp/1.0',
            'Accept-Language': 'vi'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error("API error");
      }
      
      const data = await response.json();
      console.log("Geocode response:", data);
      
      if (data && data.address) {
        // Tạo địa chỉ từ các thành phần
        const addr = data.address;
        const parts = [];
        
        // Ưu tiên các trường phổ biến
        if (addr.road || addr.street) parts.push(addr.road || addr.street);
        if (addr.quarter || addr.suburb || addr.neighbourhood) {
          parts.push(addr.quarter || addr.suburb || addr.neighbourhood);
        }
        if (addr.district || addr.city_district || addr.county) {
          parts.push(addr.district || addr.city_district || addr.county);
        }
        if (addr.city || addr.town || addr.village) {
          parts.push(addr.city || addr.town || addr.village);
        }
        
        if (parts.length > 0) {
          setLocationAddress(parts.join(", "));
        } else if (data.display_name) {
          // Fallback: dùng display_name, lấy 2-3 phần đầu
          const nameParts = data.display_name.split(",").map(s => s.trim());
          setLocationAddress(nameParts.slice(0, Math.min(3, nameParts.length - 1)).join(", "));
        } else {
          setLocationAddress("Vị trí hiện tại");
        }
      } else if (data && data.display_name) {
        // Fallback: dùng display_name
        const nameParts = data.display_name.split(",").map(s => s.trim());
        setLocationAddress(nameParts.slice(0, Math.min(3, nameParts.length - 1)).join(", "));
      } else {
        setLocationAddress("Vị trí hiện tại");
      }
      setAddressLoading(false);
    } catch (e) {
      console.error("Reverse geocode error:", e);
      // Fallback: tạo địa chỉ từ tọa độ một cách thân thiện hơn
      setLocationAddress("Vị trí hiện tại");
      setAddressLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setErr("");
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q) params.append("search", q);
      if (area) params.append("area", area);
      if (type) params.append("type", type);
      if (priceRange) params.append("price_range", priceRange);
      if (mealTime) params.append("meal_time", mealTime);
      if (sort) params.append("sort", sort);
      if (location) {
        params.append("lat", location.lat);
        params.append("lng", location.lng);
      }

      const res = await http.get(`/api/restaurants?${params.toString()}`);
      setItems(res.data || []);
    } catch (e) {
      setErr(e?.response?.data?.msg || "Tải danh sách quán thất bại");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      load();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [q, area, type, priceRange, mealTime, sort, location]);

  const uniqueAreas = useMemo(() => {
    const areas = items.map((r) => r.area).filter(Boolean);
    return Array.from(new Set(areas)).sort();
  }, [items]);

  const uniqueTypes = useMemo(() => {
    const types = items.map((r) => r.type).filter(Boolean);
    return Array.from(new Set(types)).sort();
  }, [items]);

  const uniquePriceRanges = useMemo(() => {
    const prices = items.map((r) => r.price_range).filter(Boolean);
    return Array.from(new Set(prices)).sort();
  }, [items]);

  const hasFilters = area || type || priceRange || mealTime;

  function clearFilters() {
    setArea("");
    setType("");
    setPriceRange("");
    setMealTime("");
  }

  const mealTimeOptions = [
    { value: "sang", label: "Ăn sáng", icon: FaSun },
    { value: "trua", label: "Ăn trưa", icon: FaCloudSun },
    { value: "toi", label: "Ăn tối", icon: FaMoon },
    { value: "vat", label: "Ăn vặt", icon: FaShoppingBag },
    { value: "henho", label: "Hẹn hò", icon: FaHeart },
  ];

  return (
    <AppLayout>
      <div className="feed-wrap col">
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div className="spread" style={{ marginBottom: 16 }}>
            <h1 style={{ margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <FaUtensils style={{ color: "var(--primary)" }} />
              Tìm quán ăn
            </h1>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {locationLoading && (
                <span className="chip" style={{ fontSize: 12 }}>
                  Đang lấy vị trí...
                </span>
              )}
              {location && (
                <span className="chip" style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, background: "rgba(37,99,235,0.1)", color: "#2563eb" }}>
                  <FaLocationArrow /> {addressLoading ? "Đang lấy địa chỉ..." : (locationAddress || "Vị trí hiện tại")}
                </span>
              )}
              <button
                type="button"
                className="chip"
                onClick={() => setShowFilters(!showFilters)}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <FaFilter />
                Lọc
              </button>
            </div>
          </div>

          <div className="restaurant-search-bar" style={{ marginBottom: showFilters ? 16 : 0 }}>
            <div className="restaurant-search-input-wrapper">
              <FaSearch className="restaurant-search-icon" />
              <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Tìm kiếm quán ăn, địa chỉ..."
                className="restaurant-search-input"
              />
              {q && (
                <button
                  type="button"
                  className="restaurant-search-clear"
                  onClick={() => setQ("")}
                  title="Xóa tìm kiếm"
                >
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          {/* Sort options */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="restaurant-filter-select"
              style={{ minWidth: 150 }}
            >
              <option value="name">Sắp xếp: Tên A-Z</option>
              <option value="rating">Sắp xếp: Đánh giá cao</option>
              {location && <option value="distance">Sắp xếp: Gần nhất</option>}
            </select>
          </div>

          {/* Meal time quick filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: showFilters ? 16 : 0, flexWrap: "wrap" }}>
            {mealTimeOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={mealTime === opt.value ? "tab active" : "tab"}
                  onClick={() => setMealTime(mealTime === opt.value ? "" : opt.value)}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <Icon /> {opt.label}
                </button>
              );
            })}
          </div>

          {showFilters && (
            <div className="restaurant-filters" style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <div className="restaurant-filter-row">
                <div className="restaurant-filter-group">
                  <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                    <FaMapMarkerAlt style={{ color: "var(--primary)" }} />
                    Khu vực
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="restaurant-filter-select"
                  >
                    <option value="">Tất cả khu vực</option>
                    {uniqueAreas.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="restaurant-filter-group">
                  <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                    <FaUtensils style={{ color: "var(--primary)" }} />
                    Loại món
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="restaurant-filter-select"
                  >
                    <option value="">Tất cả loại</option>
                    {uniqueTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="restaurant-filter-group">
                  <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                    <FaDollarSign style={{ color: "var(--primary)" }} />
                    Giá
                  </label>
                  <select
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    className="restaurant-filter-select"
                  >
                    <option value="">Tất cả mức giá</option>
                    {uniquePriceRanges.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {hasFilters && (
                <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    className="chip"
                    onClick={clearFilters}
                    style={{ fontSize: 13 }}
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {err && <div className="err">{err}</div>}

        {loading && <div className="pill">Đang tải...</div>}

        {!loading && items.length === 0 && (
          <div className="pill" style={{ textAlign: "center", padding: 40 }}>
            {q || hasFilters ? "Không tìm thấy quán nào phù hợp" : "Chưa có quán nào"}
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="restaurant-grid">
            {items.map((r) => (
              <div key={r.id} className="restaurant-card-wrapper">
                <div className="restaurant-card">
                  {r.is_featured && (
                    <div className="restaurant-featured-badge">Nổi bật</div>
                  )}
                  <Link
                    to={`/restaurants/${r.id}`}
                    style={{ textDecoration: "none", color: "inherit", display: "block" }}
                  >
                    <div className="restaurant-card-image">
                      {r.image_url ? (
                        <img src={r.image_url} alt={r.name} />
                      ) : (
                        <div className="restaurant-card-placeholder">
                          <FaUtensils />
                        </div>
                      )}
                    </div>
                    <div className="restaurant-card-content">
                      <div className="restaurant-card-name">{r.name}</div>
                      <div className="restaurant-card-meta">
                        {r.type && (
                          <span className="restaurant-card-meta-item">
                            <FaUtensils /> {r.type}
                          </span>
                        )}
                        {r.area && (
                          <span className="restaurant-card-meta-item">
                            <FaMapMarkerAlt /> {r.area}
                          </span>
                        )}
                        {r.price_range && (
                          <span className="restaurant-card-meta-item">
                            <FaDollarSign /> {r.price_range}
                          </span>
                        )}
                        {r.distance_km && (
                          <span className="restaurant-card-meta-item">
                            <FaLocationArrow /> {r.distance_km} km
                          </span>
                        )}
                      </div>
                      {r.address && (
                        <div className="restaurant-card-address">{r.address}</div>
                      )}
                      {r.avg_rating && (
                        <div className="restaurant-card-rating">
                          <FaStar style={{ color: "#fbbf24" }} />
                          <span>{parseFloat(r.avg_rating).toFixed(1)}</span>
                          <span style={{ color: "var(--muted)", marginLeft: 4 }}>
                            ({r.review_count || 0} đánh giá)
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <RestaurantRating restaurant={r} onRate={load} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
