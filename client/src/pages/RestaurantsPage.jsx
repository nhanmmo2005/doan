import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout";

export default function RestaurantsPage() {
  const [q, setQ] = useState("");
  const [area, setArea] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    // TODO: GET /api/restaurants?search=&area=&price=&type=
    setItems([
      { id: 1, name: "Mì Quảng 1A", type: "Mì Quảng", area: "Hải Châu", price: "30-50k", rating: 4.5, image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800" },
      { id: 2, name: "Bánh tráng cuốn Trần", type: "Đặc sản", area: "Sơn Trà", price: "50-100k", rating: 4.2, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=800" },
    ]);
  }, []);

  const filtered = items.filter(r =>
    (!q || r.name.toLowerCase().includes(q.toLowerCase())) &&
    (!area || r.area === area) &&
    (!price || r.price === price) &&
    (!type || r.type === type)
  );

  return (
    <AppLayout>
      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <div className="spread">
          <div style={{ fontWeight: 900, fontSize: 18 }}>🍜 Quán ăn Đà Nẵng</div>
          <span className="badge">Filter</span>
        </div>
        <div className="hr" />
        <div className="row" style={{ flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search quán..." />
          </div>
          <div style={{ minWidth: 180 }}>
            <input value={type} onChange={(e)=>setType(e.target.value)} placeholder="Loại món (vd: Mì Quảng)" />
          </div>
          <div style={{ minWidth: 160 }}>
            <input value={price} onChange={(e)=>setPrice(e.target.value)} placeholder="Giá (vd: 30-50k)" />
          </div>
          <div style={{ minWidth: 160 }}>
            <input value={area} onChange={(e)=>setArea(e.target.value)} placeholder="Khu vực (vd: Hải Châu)" />
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:16 }}>
        {filtered.map(r => (
          <Link key={r.id} to={`/restaurants/${r.id}`} className="card" style={{ overflow:"hidden" }}>
            <img src={r.image} alt="" style={{ width:"100%", height:160, objectFit:"cover", display:"block" }} />
            <div style={{ padding: 12 }}>
              <div style={{ fontWeight: 800 }}>{r.name}</div>
              <div style={{ color:"var(--muted)", fontSize:12, marginTop:4 }}>
                {r.type} • {r.area} • {r.price} • ⭐ {r.rating}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
