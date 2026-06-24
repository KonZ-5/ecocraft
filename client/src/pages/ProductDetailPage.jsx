import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { productApi, cartApi, reviewApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { Loading, Alert, StatusBadge, formatRupiah, formatTanggal } from "../components/common";

const WASTE_EMOJI = { plastik: "🧴", kertas: "📄", kain: "🧵", logam: "⚙️", kayu: "🪵" };

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { fetchCartCount } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingCart, setAddingCart] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      try {
        const pr = await productApi.getById(id);
        setProduct(pr.data.data);

        try {
          const rr = await reviewApi.getAll({
            product_id: id,
            limit: 10,
          });

          setReviews(rr.data.data || []);
        } catch (err) {
          console.error("Review error:", err);
          setReviews([]);
        }
      } catch (err) {
        console.error("Product error:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleAddCart = async () => {
    if (!user) return navigate("/login");
    setAddingCart(true);
    try {
      await cartApi.add({ product_id: product.id, qty });
      await fetchCartCount();
      setAlert({ type: "success", msg: `${qty} item berhasil ditambahkan ke keranjang!` });
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal menambahkan ke keranjang" });
    } finally {
      setAddingCart(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-12"><Loading /></div>;
  if (!product) return <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-500">Produk tidak ditemukan.</div>;

  const emoji = WASTE_EMOJI[product.waste_category_name] || "♻️";

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link to="/products" className="text-sm text-leaf hover:underline mb-6 inline-block">← Kembali ke Produk</Link>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        {/* Gambar */}
        <div className="bg-gradient-to-br from-eco-50 to-eco-100 rounded-2xl aspect-square flex items-center justify-center text-8xl">
          {product.image ? (
            <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-2xl" />
          ) : <span>{emoji}</span>}
        </div>

        {/* Info produk */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="badge-eco">{emoji} {product.waste_category_name}</span>
            {product.pengrajin_verified && <span className="badge-eco">✓ Pengrajin Terverifikasi</span>}
          </div>

          <h1 className="font-display font-bold text-2xl text-gray-800">{product.name}</h1>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm">oleh</span>
            <span className="font-semibold text-leaf text-sm">{product.workshop_name}</span>
            {avgRating && (
              <span className="text-amber-500 text-sm ml-2">★ {avgRating} ({reviews.length} ulasan)</span>
            )}
          </div>

          <p className="text-gray-600 text-sm leading-relaxed">{product.description || "Tidak ada deskripsi."}</p>

          {/* Dampak lingkungan */}
          <div className="bg-eco-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500 text-xs">Limbah Digunakan</div>
              <div className="font-bold text-eco-700">{product.waste_weight_kg} kg {product.waste_category_name}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">CO₂ Dihemat</div>
              <div className="font-bold text-eco-700">💚 {product.carbon_saved_kg} kg</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Eco Score Pengrajin</div>
              <div className="font-bold text-eco-700">🌿 {product.pengrajin_eco_score || 0}</div>
            </div>
            <div>
              <div className="text-gray-500 text-xs">Stok</div>
              <div className={`font-bold ${product.stock > 5 ? "text-eco-700" : "text-amber-600"}`}>{product.stock} unit</div>
            </div>
          </div>

          {/* Harga & tombol */}
          <div className="flex items-center gap-4 pt-2">
            <span className="font-display font-extrabold text-3xl text-leaf">{formatRupiah(product.price)}</span>
          </div>

          {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

          {user?.role === "pembeli" && product.stock > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-lg">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-gray-600 hover:text-leaf">−</button>
                <span className="px-3 py-2 text-sm font-semibold min-w-[2.5rem] text-center">{qty}</span>
                <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-3 py-2 text-gray-600 hover:text-leaf">+</button>
              </div>
              <button
                onClick={handleAddCart}
                disabled={addingCart}
                className="btn-primary flex-1"
              >
                {addingCart ? "Menambahkan..." : "Tambah ke Keranjang"}
              </button>
            </div>
          )}

          {!user && (
            <Link to="/login" className="btn-primary text-center">Login untuk membeli</Link>
          )}

          {product.stock === 0 && (
            <div className="bg-red-50 text-red-600 text-sm text-center py-3 rounded-lg font-medium">Stok Habis</div>
          )}
        </div>
      </div>

      {/* Ulasan */}
      <div>
        <h2 className="font-display font-bold text-xl text-gray-800 mb-4">Ulasan Pembeli</h2>
        {reviews.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8">Belum ada ulasan untuk produk ini.</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-gray-700">{r.reviewer_name}</span>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map((s) => (
                      <span key={s} className={s <= r.rating ? "text-amber-400" : "text-gray-200"}>★</span>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{r.comment || <span className="text-gray-400 italic">Tanpa komentar</span>}</p>
                <p className="text-xs text-gray-400 mt-1">{formatTanggal(r.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
