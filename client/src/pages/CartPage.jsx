import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cartApi } from "../services/api";
import { useCart } from "../context/CartContext";
import { Loading, Alert, Empty, formatRupiah } from "../components/common";

export default function CartPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const { fetchCartCount } = useCart();
  const navigate = useNavigate();

  const fetchCart = async () => {
    try {
      const res = await cartApi.get();
      setItems(res.data.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCart(); }, []);

  const handleQtyChange = async (cartId, qty) => {
    if (qty < 1) return;
    try {
      await cartApi.update(cartId, { qty });
      await fetchCart();
      await fetchCartCount();
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal update jumlah" });
    }
  };

  const handleRemove = async (cartId) => {
    try {
      await cartApi.remove(cartId);
      await fetchCart();
      await fetchCartCount();
    } catch {
      setAlert({ type: "error", msg: "Gagal menghapus item" });
    }
  };

  const total = items.reduce((s, i) => s + Number(i.price) * i.qty, 0);
  const totalCarbonSaved = items.reduce((s, i) => s + Number(i.carbon_saved_kg) * i.qty, 0);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-12"><Loading /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display font-bold text-2xl text-gray-800 mb-6">Keranjang Belanja</h1>

      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} className="mb-4" />}

      {items.length === 0 ? (
        <Empty
          icon="🛒"
          title="Keranjang kosong"
          desc="Temukan produk daur ulang yang kamu suka dan tambahkan ke keranjang."
          action={<Link to="/products" className="btn-primary">Lihat Produk</Link>}
        />
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div key={item.cart_id} className="card flex gap-4 items-center">
                <div className="w-16 h-16 bg-eco-50 rounded-lg flex items-center justify-center text-2xl shrink-0">
                  {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" /> : "♻️"}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product_id}`} className="font-semibold text-sm text-gray-800 hover:text-leaf line-clamp-1">{item.name}</Link>
                  <div className="text-leaf font-bold">{formatRupiah(item.price)}</div>
                  <div className="text-xs text-gray-400">💚 {(item.carbon_saved_kg * item.qty).toFixed(2)} kg CO₂ dihemat</div>
                </div>
                <div className="flex items-center border border-gray-200 rounded-lg shrink-0">
                  <button onClick={() => handleQtyChange(item.cart_id, item.qty - 1)} className="px-2 py-1 text-gray-600 hover:text-leaf text-lg">−</button>
                  <span className="px-2 py-1 text-sm font-semibold min-w-[2rem] text-center">{item.qty}</span>
                  <button onClick={() => handleQtyChange(item.cart_id, item.qty + 1)} disabled={item.qty >= item.stock} className="px-2 py-1 text-gray-600 hover:text-leaf text-lg disabled:opacity-30">+</button>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-gray-800">{formatRupiah(item.price * item.qty)}</div>
                  <button onClick={() => handleRemove(item.cart_id)} className="text-xs text-red-400 hover:text-red-600 mt-1">Hapus</button>
                </div>
              </div>
            ))}
          </div>

          {/* Ringkasan */}
          <div className="card">
            <h2 className="font-display font-semibold text-gray-800 mb-4">Ringkasan Pesanan</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>{items.length} item</span>
                <span>{formatRupiah(total)}</span>
              </div>
              <div className="flex justify-between text-eco-700 font-medium">
                <span>💚 Total CO₂ dihemat</span>
                <span>{totalCarbonSaved.toFixed(2)} kg</span>
              </div>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-3 mb-4">
              <span>Total</span>
              <span className="text-leaf">{formatRupiah(total)}</span>
            </div>
            <button onClick={() => navigate("/checkout")} className="btn-primary w-full">
              Lanjut ke Checkout →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
