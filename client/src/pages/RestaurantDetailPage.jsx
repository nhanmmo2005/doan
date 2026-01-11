import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";

export default function RestaurantDetailPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // TODO: GET /api/restaurants/:id và /api/restaurants/:id/reviews
    setRestaurant({
      id,
      name: "Mì Quảng 1A",
      area: "Hải Châu",
      price: "30-50k",
      rating: 4.5,
      address: "Hải Phòng, Đà Nẵng",
      image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1200",
    });
    setReviews([
      { id: 11, author_name: "Nhân", content: "Ngon, đông nhưng phục vụ nhanh", created_at: Date.now() - 3600000 },
    ]);
  }, [id]);

  if (!restaurant) return null;

  return (
    <AppLayout>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div className="card" style={{ overflow:"hidden" }}>
          <img src={restaurant.image} alt="" style={{ width:"100%", height:320, objectFit:"cover", display:"block" }} />
          <div style={{ padding: 14 }}>
            <div className="spread">
              <div>
                <div style={{ fontWeight: 900, fontSize: 22 }}>{restaurant.name}</div>
                <div style={{ color:"var(--muted)", marginTop:6, fontSize: 13 }}>
                  {restaurant.address} • {restaurant.area} • {restaurant.price} • ⭐ {restaurant.rating}
                </div>
              </div>
              <Link className="navbtn" to={`/create-review?restaurantId=${restaurant.id}`}>
                ✍️ Viết review
              </Link>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 14, marginTop: 16 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>🧾 Review liên quan</div>
          <div className="hr" />
          <div className="col">
            {reviews.map(r => (
              <div key={r.id} className="side-item" style={{ alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontWeight: 800 }}>{r.author_name}</div>
                  <div style={{ color:"var(--muted)", fontSize: 12 }}>{new Date(r.created_at).toLocaleString()}</div>
                  <div style={{ marginTop: 6 }}>{r.content}</div>
                </div>
              </div>
            ))}
            {!reviews.length && <div style={{ color:"var(--muted)" }}>Chưa có review.</div>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
