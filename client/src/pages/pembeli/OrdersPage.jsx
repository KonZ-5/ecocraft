import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { orderApi } from "../../services/api";
import { Loading, Empty, StatusBadge, formatRupiah, formatTanggal } from "../../components/common";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getAll()
      .then((r) => setOrders(r.data.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-12"><Loading /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display font-bold text-2xl text-gray-800 mb-6">Pesanan Saya</h1>

      {orders.length === 0 ? (
        <Empty icon="📦" title="Belum ada pesanan" desc="Yuk, beli produk daur ulang pertamamu!"
          action={<Link to="/products" className="btn-primary">Lihat Produk</Link>}
        />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link to={`/pembeli/orders/${o.id}`} key={o.id} className="card hover:shadow-md transition-shadow block">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-400 mb-1">{formatTanggal(o.created_at)}</div>
                  <div className="font-semibold text-gray-700">Pesanan #{o.id}</div>
                  <div className="text-sm text-gray-500 mt-0.5">💚 {Number(o.total_carbon_saved).toFixed(2)} kg CO₂ dihemat</div>
                </div>
                <div className="text-right">
                  <StatusBadge status={o.status} />
                  <div className="font-bold text-leaf mt-1">{formatRupiah(o.total_price)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
