import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cartApi, orderApi } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Loading, Alert, formatRupiah } from "../components/common";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { fetchCartCount } = useCart();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [address, setAddress] = useState(user?.address || "");

  useEffect(() => {
    cartApi.get()
      .then((r) => {
        const data = r.data.data || [];
        if (data.length === 0) navigate("/cart");
        setItems(data);
      })
      .catch(() => navigate("/cart"))
      .finally(() => setLoading(false));
  }, []);

  const total = items.reduce((s, i) => s + Number(i.price) * i.qty, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!address.trim()) return setAlert({ type: "error", msg: "Alamat pengiriman wajib diisi." });
    setSubmitting(true);
    try {
      const res = await orderApi.checkout({ shipping_address: address });
      await fetchCartCount();
      navigate(`/pembeli/orders/${res.data.data.id}`, { state: { success: true } });
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Checkout gagal, coba lagi." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-12"><Loading /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display font-bold text-2xl text-gray-800 mb-6">Checkout</h1>

      <form onSubmit={handleCheckout} className="grid md:grid-cols-5 gap-6">
        {/* Kiri - alamat */}
        <div className="md:col-span-3 space-y-4">
          {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

          <div className="card">
            <h2 className="font-display font-semibold text-gray-800 mb-3">Alamat Pengiriman</h2>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input"
              rows={3}
              placeholder="Contoh: Jl. Merpati No. 5, RT 02/RW 04, Bandung, Jawa Barat 40123"
              required
            />
          </div>

          <div className="card">
            <h2 className="font-display font-semibold text-gray-800 mb-3">Item Pesanan</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.cart_id} className="flex justify-between items-center text-sm">
                  <div className="text-gray-700">{item.name} <span className="text-gray-400">× {item.qty}</span></div>
                  <div className="font-medium">{formatRupiah(item.price * item.qty)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kanan - ringkasan */}
        <div className="md:col-span-2">
          <div className="card sticky top-20">
            <h2 className="font-display font-semibold text-gray-800 mb-4">Ringkasan</h2>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>{formatRupiah(total)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Pengiriman</span><span className="text-eco-600">Gratis</span>
              </div>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-3 mb-4">
              <span>Total</span><span className="text-leaf">{formatRupiah(total)}</span>
            </div>
            <div className="bg-eco-50 rounded-lg p-3 text-xs text-eco-700 mb-4">
              🌿 Dengan membeli produk daur ulang, Anda berkontribusi mengurangi limbah dan emisi CO₂.
            </div>
            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? "Memproses..." : "Konfirmasi Pesanan"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
