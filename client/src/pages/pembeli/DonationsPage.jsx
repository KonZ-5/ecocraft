import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { donationApi } from "../../services/api";
import { Loading, Empty, StatusBadge, Alert, formatTanggal } from "../../components/common";

export default function DonationsPage() {
  const location = useLocation();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(location.state?.success ? { type: "success", msg: location.state.success } : null);
  const [cancelling, setCancelling] = useState(null);

  const fetchDonations = () => {
    donationApi.getAll()
      .then((r) => setDonations(r.data.data || []))
      .catch(() => setDonations([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDonations(); }, []);

  const handleCancel = async (id) => {
    if (!confirm("Batalkan donasi ini?")) return;
    setCancelling(id);
    try {
      await donationApi.cancel(id);
      setAlert({ type: "success", msg: "Donasi berhasil dibatalkan." });
      fetchDonations();
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal membatalkan donasi." });
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-12"><Loading /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display font-bold text-2xl text-gray-800">Donasi Limbah Saya</h1>
        <Link to="/donations/create" className="btn-primary text-sm">+ Donasi Baru</Link>
      </div>

      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} className="mb-4" />}

      {donations.length === 0 ? (
        <Empty icon="♻️" title="Belum ada donasi" desc="Donasikan limbah rumah tangga kamu dan dapatkan Eco Points!"
          action={<Link to="/donations/create" className="btn-primary">Mulai Donasi</Link>}
        />
      ) : (
        <div className="space-y-4">
          {donations.map((d) => (
            <div key={d.id} className="card">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{d.waste_category_name} → {d.workshop_name}</div>
                  <div className="text-xs text-gray-400">{formatTanggal(d.created_at)}</div>
                </div>
                <StatusBadge status={d.status} />
              </div>
              <div className="text-sm text-gray-600">
                Estimasi: <strong>{d.estimated_weight} kg</strong>
                {d.actual_weight && <span className="ml-3">Aktual: <strong>{d.actual_weight} kg</strong></span>}
              </div>
              {d.notes && <p className="text-xs text-gray-400 mt-1 italic">{d.notes}</p>}
              {d.status === "menunggu" && (
                <button
                  onClick={() => handleCancel(d.id)}
                  disabled={cancelling === d.id}
                  className="mt-3 text-xs text-red-500 hover:text-red-700"
                >
                  {cancelling === d.id ? "Membatalkan..." : "Batalkan Donasi"}
                </button>
              )}
              {d.status === "diterima" && (
                <div className="mt-2 text-xs text-eco-600 font-medium">
                  ✅ +{Math.round(d.actual_weight * 10)} Eco Points didapat
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
