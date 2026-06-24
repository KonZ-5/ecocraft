import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { orderApi, reviewApi } from "../../services/api";
import { Loading, Alert, StatusBadge, formatRupiah, formatTanggal } from "../../components/common";

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [alert, setAlert] = useState(location.state?.success ? { type: "success", msg: "Pesanan berhasil dibuat! 🎉" } : null);

  // Review state
  const [reviewForm, setReviewForm] = useState({});
  const [submittingReview, setSubmittingReview] = useState(null);

  const fetchOrder = async () => {
    try {
      const res = await orderApi.getById(id);
      setOrder(res.data.data);
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleCancel = async () => {
    if (!confirm("Batalkan pesanan ini?")) return;
    setCancelling(true);
    try {
      await orderApi.cancel(id);
      await fetchOrder();
      setAlert({ type: "success", msg: "Pesanan berhasil dibatalkan." });
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal membatalkan pesanan." });
    } finally {
      setCancelling(false);
    }
  };

  const handleReview = async (item) => {
    const form = reviewForm[item.product_id] || {};
    if (!form.rating) return setAlert({ type: "error", msg: "Pilih rating bintang terlebih dahulu." });
    setSubmittingReview(item.product_id);
    try {
      await reviewApi.create({ product_id: item.product_id, order_id: Number(id), rating: form.rating, comment: form.comment || "" });
      setAlert({ type: "success", msg: "Ulasan berhasil dikirim!" });
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal mengirim ulasan." });
    } finally {
      setSubmittingReview(null);
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-12"><Loading /></div>;
  if (!order) return <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">Pesanan tidak ditemukan.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/pembeli/orders" className="text-sm text-leaf hover:underline mb-6 inline-block">← Kembali ke Pesanan</Link>

      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

      <div className="flex items-center justify-between mb-6 mt-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-800">Pesanan #{order.id}</h1>
          <p className="text-sm text-gray-500">{formatTanggal(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Info pengiriman */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-700 mb-2 text-sm">Alamat Pengiriman</h2>
        <p className="text-sm text-gray-600">{order.shipping_address}</p>
      </div>

      {/* Item */}
      <div className="card mb-4">
        <h2 className="font-semibold text-gray-700 mb-3 text-sm">Item Pesanan</h2>
        <div className="space-y-3">
          {order.items?.map((item) => (
            <div key={item.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
              <div>
                <div className="font-medium text-gray-800">{item.product_name || item.name}</div>
                <div className="text-gray-400 text-xs">× {item.qty} — 💚 {(item.carbon_saved_kg * item.qty).toFixed(2)} kg CO₂</div>
              </div>
              <div className="font-semibold">{formatRupiah(item.price * item.qty)}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold mt-3 pt-3 border-t">
          <span>Total</span><span className="text-leaf">{formatRupiah(order.total_price)}</span>
        </div>
      </div>

      {/* Tombol batalkan */}
      {order.status === "pending" && (
        <button onClick={handleCancel} disabled={cancelling} className="btn-danger mb-6">
          {cancelling ? "Membatalkan..." : "Batalkan Pesanan"}
        </button>
      )}

      {/* Review section - hanya kalau order selesai */}
      {order.status === "selesai" && order.items?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-700 mb-4">Tulis Ulasan</h2>
          <div className="space-y-5">
            {order.items.map((item) => (
              <div key={item.product_id} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                <div className="font-medium text-sm text-gray-700 mb-2">{item.product_name || item.name}</div>
                <div className="flex gap-1 mb-2">
                  {[1,2,3,4,5].map((s) => (
                    <button key={s} type="button"
                      onClick={() => setReviewForm({ ...reviewForm, [item.product_id]: { ...reviewForm[item.product_id], rating: s } })}
                      className={`text-2xl transition-transform hover:scale-110 ${(reviewForm[item.product_id]?.rating || 0) >= s ? "text-amber-400" : "text-gray-200"}`}
                    >★</button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  className="input text-sm"
                  placeholder="Tulis komentar (opsional)..."
                  value={reviewForm[item.product_id]?.comment || ""}
                  onChange={(e) => setReviewForm({ ...reviewForm, [item.product_id]: { ...reviewForm[item.product_id], comment: e.target.value } })}
                />
                <button
                  onClick={() => handleReview(item)}
                  disabled={submittingReview === item.product_id}
                  className="btn-primary text-sm mt-2"
                >
                  {submittingReview === item.product_id ? "Mengirim..." : "Kirim Ulasan"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
