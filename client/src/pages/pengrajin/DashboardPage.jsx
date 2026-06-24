import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { productApi, donationApi, orderApi } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { Loading, Alert, StatusBadge, Empty, formatRupiah, formatTanggal } from "../../components/common";

export default function PengrajinDashboard() {
  const { user, refreshUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [donations, setDonations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [tab, setTab] = useState("products");

  // Efek untuk memuat data user terbaru saat komponen pertama kali di-mount
  useEffect(() => {
    const loadLatestUser = async () => {
      try {
        await refreshUser();
      } catch (err) {
        console.error("Refresh user error:", err);
      }
    };

    loadLatestUser();
  }, []);

  // Efek Polling untuk Refresh Data User (misal: update status verifikasi atau eco score) setiap 10 detik
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await refreshUser();
      } catch (err) {
        console.error("Gagal refresh user:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [refreshUser]);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [pr, dr, or] = await Promise.all([
        productApi.getMyProducts(),
        donationApi.getAll(),
        orderApi.getAll(),
      ]);

      // Produk milik pengrajin login
      setProducts(pr.data?.data || []);

      // Filter donasi untuk pengrajin login
      const allDonations = dr.data?.data || [];

      const myDonations = allDonations.filter(
        (d) => Number(d.pengrajin_id) === Number(user?.pengrajin_profile?.id)
      );

      setDonations(myDonations);

      // Order yang berisi produk milik pengrajin
      const allOrders = or.data?.data || [];

      const myOrders = allOrders.filter(
        (o) =>
          Number(o.pengrajin_id) === Number(user?.pengrajin_profile?.id)
      );

      setOrders(myOrders);

    } catch (err) {
      console.error("Dashboard error:", err);

      setAlert({
        type: "error",
        msg:
          err.response?.data?.message ||
          "Gagal memuat dashboard pengrajin",
      });
    } finally {
      setLoading(false);
    }
  }; 

  useEffect(() => {
    if (!user) return;

    fetchData();
  }, [user]);

  const handleDeleteProduct = async (id) => {
    if (!confirm("Hapus produk ini?")) return;
    try {
      await productApi.delete(id);
      setAlert({ type: "success", msg: "Produk berhasil dihapus/dinonaktifkan." });
      fetchData();
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal menghapus produk." });
    }
  };

  const handleConfirmDonation = async (donationId, status, actual_weight) => {
    try {
      await donationApi.confirm(donationId, { status, actual_weight });
      setAlert({ type: "success", msg: `Donasi berhasil di-${status}.` });
      fetchData();
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal konfirmasi donasi." });
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await orderApi.updateStatus(orderId, { status });
      setAlert({ type: "success", msg: `Status order berhasil diubah ke '${status}'.` });
      fetchData();
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal update status." });
    }
  };

  const pendingDonations = donations.filter(
    (d) => d.status === "menunggu"
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-800">Dashboard Pengrajin</h1>
          <p className="text-gray-500 text-sm">Halo, {user?.name}! 👋</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 mb-0.5">Eco Score</div>
          <div className="font-display font-extrabold text-2xl text-leaf">🌿 {user?.pengrajin_profile?.eco_score || "—"}</div>
        </div>
      </div>

      {!user?.pengrajin_profile?.is_verified && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 mb-6">
          ⏳ Akun Anda belum diverifikasi oleh admin. Setelah diverifikasi, Anda dapat mengunggah produk.
        </div>
      )}

      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {[
          { key: "products", label: `Produk (${products.length})` },
          { key: "donations", label: `Donasi Masuk (${donations.length})`, urgent: pendingDonations.length > 0 },
          { key: "orders", label: `Pesanan (${orders.length})` },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${tab === t.key ? "bg-white text-leaf shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {t.label}
            {t.urgent && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : (
        <>
          {/* === TAB PRODUK === */}
          {tab === "products" && (
            <div>
              <div className="flex justify-end mb-4">
                <Link to="/pengrajin/products/create" className="btn-primary text-sm">+ Tambah Produk</Link>
              </div>
              {products.length === 0 ? (
                <Empty icon="📦" title="Belum ada produk" desc="Tambahkan produk pertama kamu untuk mulai berjualan."
                  action={<Link to="/pengrajin/products/create" className="btn-primary">Tambah Produk</Link>}
                />
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <div key={p.id} className="card flex items-center gap-4">
                      <div className="w-12 h-12 bg-eco-50 rounded-lg flex items-center justify-center text-2xl shrink-0">♻️</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-800 truncate">{p.name}</div>
                        <div className="text-xs text-gray-400">{p.waste_category_name} • Stok: {p.stock}</div>
                      </div>
                      <div className="text-leaf font-bold shrink-0">{formatRupiah(p.price)}</div>
                      {!p.is_active && <span className="badge-warn shrink-0">Nonaktif</span>}
                      {p.is_active && (
                        p.is_verified
                          ? <span className="badge-eco shrink-0">✓ Terverifikasi</span>
                          : <span className="badge-warn shrink-0">⏳ Menunggu Verifikasi</span>
                      )}
                      <div className="flex gap-2 shrink-0">
                        <Link to={`/pengrajin/products/edit/${p.id}`} className="btn-secondary text-xs py-1 px-2">Edit</Link>
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-xs text-red-500 hover:text-red-700 px-2 py-1 border border-red-200 rounded-lg">Hapus</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* === TAB DONASI === */}
          {tab === "donations" && (
            <div className="space-y-4">
              {donations.length === 0 ? (
                <Empty icon="♻️" title="Belum ada donasi masuk" />
              ) : donations.map((d) => (
                <div key={d.id} className="card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{d.donor_name} → {d.waste_category_name}</div>
                      <div className="text-xs text-gray-400">{formatTanggal(d.created_at)}</div>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="text-sm text-gray-600">Estimasi: <strong>{d.estimated_weight} kg</strong></div>
                  {d.notes && <p className="text-xs text-gray-400 italic mt-1">{d.notes}</p>}

                  {d.status === "menunggu" && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleConfirmDonation(d.id, "dikonfirmasi")} className="btn-primary text-xs py-1">Konfirmasi</button>
                      <button onClick={() => handleConfirmDonation(d.id, "ditolak")} className="btn-danger text-xs py-1">Tolak</button>
                    </div>
                  )}
                  {d.status === "dikonfirmasi" && (
                    <div className="mt-3 flex items-end gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-gray-600 mb-1 block">Berat aktual (kg)</label>
                        <input type="number" step="0.1" className="input text-sm" id={`aw-${d.id}`} defaultValue={d.estimated_weight} />
                      </div>
                      <button
                        onClick={() => {
                          const aw = document.getElementById(`aw-${d.id}`).value;
                          handleConfirmDonation(d.id, "diterima", Number(aw));
                        }}
                        className="btn-primary text-xs py-2"
                      >
                        Tandai Diterima
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* === TAB ORDER === */}
          {tab === "orders" && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <Empty icon="📦" title="Belum ada pesanan masuk" />
              ) : orders.map((o) => (
                <div key={o.id} className="card">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <div className="font-semibold text-sm text-gray-700">Pesanan #{o.id}</div>
                      <div className="text-xs text-gray-400">{formatTanggal(o.created_at)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-leaf">{formatRupiah(o.total_price)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                  {o.status === "pending" && (
                    <button onClick={() => handleUpdateOrderStatus(o.id, "dikemas")} className="btn-primary text-xs py-1.5">Mulai Kemas</button>
                  )}
                  {o.status === "dikemas" && (
                    <button onClick={() => handleUpdateOrderStatus(o.id, "dikirim")} className="btn-primary text-xs py-1.5">Tandai Dikirim</button>
                  )}
                  {o.status === "dikirim" && (
                    <button onClick={() => handleUpdateOrderStatus(o.id, "selesai")} className="btn-primary text-xs py-1.5">Selesaikan Pesanan</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}