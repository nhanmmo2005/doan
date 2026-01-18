import { useState, useEffect } from "react";
import { http } from "../api/http";
import { Link } from "react-router-dom";
import { FaTag, FaCalendarCheck, FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function BannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBanners();
  }, []);

  async function loadBanners() {
    try {
      const res = await http.get("/api/banners");
      setBanners(res.data || []);
      if (res.data?.length > 0) {
        setCurrentIndex(0);
      }
    } catch (e) {
      console.error("Load banners error:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000); // Auto slide mỗi 5 giây
    return () => clearInterval(timer);
  }, [banners.length]);

  if (loading) {
    return (
      <div className="card soft side-section">
        <div className="side-title">Khuyến mãi & Booking</div>
        <div className="muted" style={{ fontSize: 13, padding: 12, textAlign: "center" }}>
          Đang tải...
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="card soft side-section">
        <div className="side-title">Khuyến mãi & Booking</div>
        <div className="muted" style={{ fontSize: 13, padding: 12, textAlign: "center" }}>
          Chưa có khuyến mãi nào
        </div>
      </div>
    );
  }

  const currentBanner = banners[currentIndex];

  function goToPrev() {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }

  function goToNext() {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }

  function goToSlide(index) {
    setCurrentIndex(index);
  }

  const bannerUrl = currentBanner.link_url || (currentBanner.restaurant_id ? `/restaurants/${currentBanner.restaurant_id}` : "#");

  return (
    <div className="card soft side-section banner-carousel-wrapper">
      <div className="side-title">
        {currentBanner.banner_type === "promotion" ? (
          <>
            <FaTag style={{ marginRight: 6, color: "#e74c3c" }} />
            Khuyến mãi
          </>
        ) : (
          <>
            <FaCalendarCheck style={{ marginRight: 6, color: "#3498db" }} />
            Nhận booking
          </>
        )}
      </div>

      <div className="banner-carousel">
        <div className="banner-slide">
          {currentBanner.image_url ? (
            <img
              src={currentBanner.image_url}
              alt={currentBanner.title}
              className="banner-image"
            />
          ) : (
            <div className="banner-placeholder">
              <div className="banner-placeholder-icon">
                {currentBanner.banner_type === "promotion" ? <FaTag /> : <FaCalendarCheck />}
              </div>
            </div>
          )}

          <div className="banner-content">
            {currentBanner.restaurant_name && (
              <div className="banner-restaurant-name">{currentBanner.restaurant_name}</div>
            )}
            <div className="banner-title">{currentBanner.title}</div>
            {currentBanner.description && (
              <div className="banner-description">{currentBanner.description}</div>
            )}
            {bannerUrl !== "#" && (
              <Link
                to={bannerUrl}
                className="banner-link-btn"
                onClick={(e) => {
                  if (currentBanner.link_url?.startsWith("http")) {
                    e.preventDefault();
                    window.open(currentBanner.link_url, "_blank");
                  }
                }}
              >
                Xem chi tiết →
              </Link>
            )}
          </div>
        </div>

        {banners.length > 1 && (
          <>
            <button
              type="button"
              className="banner-nav-btn banner-nav-prev"
              onClick={goToPrev}
              aria-label="Banner trước"
            >
              <FaChevronLeft />
            </button>
            <button
              type="button"
              className="banner-nav-btn banner-nav-next"
              onClick={goToNext}
              aria-label="Banner sau"
            >
              <FaChevronRight />
            </button>

            <div className="banner-dots">
              {banners.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`banner-dot ${idx === currentIndex ? "active" : ""}`}
                  onClick={() => goToSlide(idx)}
                  aria-label={`Banner ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
