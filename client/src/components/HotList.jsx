import { Link } from "react-router-dom";

export default function HotList({ restaurants = [] }) {
  const items = Array.isArray(restaurants) ? restaurants.slice(0, 3) : [];

  return (
    <div className="card soft side-section hot-list">
      <div className="side-title">Quán ăn hot hôm nay</div>
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((r) => (
          <Link
            key={r.id}
            to={`/restaurants/${r.id}`}
            style={{ display: "flex", gap: 14, alignItems: "center", textDecoration: "none", color: "inherit" }}
          >
            <div style={{ width: 80, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0, background: "#f3f4f6" }}>
              {r.image_url ? (
                <img src={r.image_url} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : null}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{r.name}</div>
              <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>
                {r.rating ? `★ ${r.rating} • ${r.reviews_count || 0} đánh giá` : "Chưa có đánh giá"}
              </div>
            </div>

            <div style={{ color: "var(--muted)", fontSize: 13, whiteSpace: "nowrap" }}>{r.distance || ""}</div>
          </Link>
        ))}

        <div style={{ paddingTop: 6 }}>
          <Link to="/restaurants" style={{ color: "var(--primary)", fontWeight: 700 }}>
            Xem thêm &gt;
          </Link>
        </div>
      </div>
    </div>
  );
}

