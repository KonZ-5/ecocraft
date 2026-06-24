import { useState, useEffect } from "react";
import {
  adminApi,
  challengeApi,
  donationApi,
} from "../../services/api";
import { Loading, Alert, StatusBadge, Empty, formatRupiah, formatTanggal } from "../../components/common";

// ── Form challenge ────────────────────────────────
const EMPTY_CHALLENGE = { title: "", description: "", waste_category_id: "", target_kg: "", start_date: "", end_date: "" };
const WASTE_CATS = [
  { id: 1, name: "plastik" }, { id: 2, name: "kertas" },
  { id: 3, name: "kain" },   { id: 4, name: "logam" }, { id: 5, name: "kayu" },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("donasi");
  const [pendingDonations, setPendingDonations] = useState([]);
  const [pengrajinList, setPengrajinList] = useState([]);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [userFilter, setUserFilter] = useState("false");   // default tampilkan yg belum verified
  const [challenges, setChallenges] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  // Challenge form
  const [challengeForm, setChallengeForm] = useState(EMPTY_CHALLENGE);
  const [savingChallenge, setSavingChallenge] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);

  const fetchAll = async () => {
    setLoading(true);

    try {
      const [pr, cr, ppr, dr] = await Promise.all([
        adminApi.getPengrajin({
          verified: userFilter,
          limit: 50,
        }),
        challengeApi.getAll({
          limit: 20,
        }),
        adminApi.getPendingProducts(),
        donationApi.getAll({
          status: "menunggu",
        }),
      ]);

      setPengrajinList(pr.data.data || []);
      setChallenges(cr.data.data || []);
      setPendingProducts(ppr.data.data || []);
      setPendingDonations(dr.data.data || []);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [userFilter]);

  const handleVerify = async (id) => {
    try {
      await adminApi.verifyPengrajin(id);
      setAlert({ type: "success", msg: "Pengrajin berhasil diverifikasi!" });
      fetchAll();
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal verifikasi." });
    }
  };

  const handleVerifyProduct = async (id) => {
    try {
      await adminApi.verifyProduct(id);

      setAlert({
        type: "success",
        msg: "Produk berhasil diverifikasi!"
      });

      fetchAll();
    } catch (err) {
      setAlert({
        type: "error",
        msg: err.response?.data?.message || "Gagal verifikasi produk."
      });
    }
  };

  const handleVerifyDonation = async (id) => {
    try {
      await donationApi.confirm(id, {
        status: "dikonfirmasi",
      });

      setAlert({
        type: "success",
        msg: "Donasi berhasil diverifikasi!",
      });

      fetchAll();
    } catch (err) {
      setAlert({
        type: "error",
        msg:
          err.response?.data?.message ||
          "Gagal memverifikasi donasi.",
      });
    }
  };

  const handleSuspend = async (userId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    if (!confirm(`${newStatus === "suspended" ? "Suspend" : "Aktifkan"} akun ini?`)) return;
    try {
      await adminApi.updateUserStatus(userId, { status: newStatus });
      setAlert({ type: "success", msg: `Akun berhasil di-${newStatus === "suspended" ? "suspend" : "aktifkan"}.` });
      fetchAll();
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal mengubah status." });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Hapus akun ini secara permanen? Tindakan ini tidak bisa dibatalkan.")) return;
    try {
      await adminApi.deleteUser(userId);
      setAlert({ type: "success", msg: "Akun berhasil dihapus." });
      fetchAll();
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal menghapus akun." });
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    setSavingChallenge(true);
    try {
      await challengeApi.create({
        ...challengeForm,
        target_kg: Number(challengeForm.target_kg),
        waste_category_id: challengeForm.waste_category_id ? Number(challengeForm.waste_category_id) : undefined,
      });
      setAlert({ type: "success", msg: "Challenge berhasil dibuat!" });
      setChallengeForm(EMPTY_CHALLENGE);
      setShowChallengeForm(false);
      fetchAll();
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal membuat challenge." });
    } finally {
      setSavingChallenge(false);
    }
  };

  const handleDeleteChallenge = async (id) => {
    if (!confirm("Hapus challenge ini?")) return;
    try {
      await challengeApi.delete(id);
      setAlert({ type: "success", msg: "Challenge berhasil dihapus." });
      fetchAll();
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal menghapus challenge." });
    }
  };

  const TABS = [
    { key: "donasi", label: "♻️ Verifikasi Donasi" },
    { key: "pengrajin", label: "🔍 Verifikasi Pengrajin" },
    { key: "produk", label: "📦 Verifikasi Produk" },
    { key: "challenges", label: "🏆 Challenge" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="font-display font-bold text-2xl text-gray-800 mb-6">Dashboard Admin</h1>

      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

      {/* Tab navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit flex-wrap">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-white text-leaf shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <Loading /> : (
        <>
          {/* ═══ TAB VERIFIKASI DONASI ═══ */}
          {tab === "donasi" && (
            <div>
              {pendingDonations.length === 0 ? (
                <Empty
                  icon="♻️"
                  title="Tidak ada donasi yang menunggu verifikasi"
                />
              ) : (
                <div className="space-y-3">
                  {pendingDonations.map((d) => (
                    <div key={d.id} className="card">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {d.waste_category_name}
                          </h3>

                          <p className="text-sm text-gray-500">
                            Donatur: {d.donor_name}
                          </p>

                          <p className="text-sm text-gray-500">
                            Pengrajin: {d.workshop_name}
                          </p>

                          <p className="text-sm text-gray-500">
                            Tanggal: {formatTanggal(d.created_at)}
                          </p>

                          <p className="mt-2 font-medium">
                            Estimasi: {d.estimated_weight} kg
                          </p>

                          {d.notes && (
                            <p className="text-sm italic text-gray-400 mt-1">
                              {d.notes}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() =>
                            handleVerifyDonation(d.id)
                          }
                          className="btn-primary"
                        >
                          ✓ Verifikasi
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB VERIFIKASI PENGRAJIN ═══ */}
          {tab === "pengrajin" && (
            <div>
              <div className="flex gap-2 mb-4">
                {[
                  { val: "false", label: "⏳ Belum Diverifikasi" },
                  { val: "true",  label: "✅ Sudah Diverifikasi" },
                ].map((f) => (
                  <button key={f.val} onClick={() => setUserFilter(f.val)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      userFilter === f.val ? "bg-leaf text-white border-leaf" : "bg-white text-gray-600 border-gray-200 hover:border-leaf"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {pengrajinList.length === 0 ? (
                <Empty icon="✅" title={userFilter === "false" ? "Semua pengrajin sudah diverifikasi!" : "Belum ada pengrajin terverifikasi"} />
              ) : (
                <div className="space-y-3">
                  {pengrajinList.map((p) => (
                    <div key={p.id} className="card">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800">{p.workshop_name}</div>
                          <div className="text-sm text-gray-500">{p.name} · {p.email}</div>
                          {p.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{p.description}</p>
                          )}
                          <div className="text-xs text-gray-400 mt-1">
                            Eco Score: {p.eco_score} · Total Limbah: {p.total_waste_kg} kg
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end shrink-0">
                          <StatusBadge status={p.is_verified} />
                          <span className={`badge ${p.account_status === "active" ? "badge-eco" : "badge-red"}`}>
                            {p.account_status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {!p.is_verified && (
                          <button onClick={() => handleVerify(p.id)} className="btn-primary text-xs py-1.5">
                            ✓ Verifikasi Sekarang
                          </button>
                        )}
                        <button
                          onClick={() => handleSuspend(p.user_id, p.account_status)}
                          className={`text-xs py-1.5 px-3 rounded-lg border font-medium transition-colors ${
                            p.account_status === "active"
                              ? "border-amber-300 text-amber-600 hover:bg-amber-50"
                              : "border-eco-300 text-eco-700 hover:bg-eco-50"
                          }`}
                        >
                          {p.account_status === "active" ? "Suspend Akun" : "Aktifkan Akun"}
                        </button>
                        <button onClick={() => handleDeleteUser(p.user_id)} className="text-xs py-1.5 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium">
                          Hapus Akun
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB VERIFIKASI PRODUK ═══ */}
          {tab === "produk" && (
            <div>
              {pendingProducts.length === 0 ? (
                <Empty
                  icon="📦"
                  title="Tidak ada produk yang menunggu verifikasi"
                />
              ) : (
                <div className="space-y-3">
                  {pendingProducts.map((p) => (
                    <div key={p.id} className="card">
                      <div className="flex gap-4">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-24 h-24 rounded-lg object-cover border"
                        />

                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">
                            {p.name}
                          </h3>

                          <p className="text-sm text-gray-500 mt-1">
                            {p.description}
                          </p>

                          <div className="text-xs text-gray-400 mt-2">
                            Harga: {formatRupiah(p.price)}
                          </div>

                          <div className="text-xs text-gray-400">
                            Stock: {p.stock}
                          </div>

                          <div className="text-xs text-gray-400">
                            Limbah: {p.waste_weight_kg} kg
                          </div>
                        </div>

                        <div>
                          <button
                            onClick={() => handleVerifyProduct(p.id)}
                            className="btn-primary"
                          >
                            ✓ Verifikasi
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ TAB CHALLENGE ═══ */}
          {tab === "challenges" && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowChallengeForm(!showChallengeForm)} className="btn-primary text-sm">
                  {showChallengeForm ? "✕ Tutup Form" : "+ Buat Challenge Baru"}
                </button>
              </div>

              {/* Form buat challenge */}
              {showChallengeForm && (
                <form onSubmit={handleCreateChallenge} className="card mb-6 space-y-4">
                  <h3 className="font-display font-semibold text-gray-800">Buat Challenge Baru</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Judul <span className="text-red-500">*</span></label>
                    <input value={challengeForm.title} onChange={(e) => setChallengeForm({ ...challengeForm, title: e.target.value })}
                      className="input" placeholder="Contoh: Daur Ulang Plastik Juli 2026" required />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                    <textarea value={challengeForm.description} onChange={(e) => setChallengeForm({ ...challengeForm, description: e.target.value })}
                      className="input" rows={2} placeholder="Deskripsi singkat challenge..." />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Limbah</label>
                      <select value={challengeForm.waste_category_id} onChange={(e) => setChallengeForm({ ...challengeForm, waste_category_id: e.target.value })} className="input">
                        <option value="">Semua kategori</option>
                        {WASTE_CATS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target (kg) <span className="text-red-500">*</span></label>
                      <input type="number" min="1" value={challengeForm.target_kg}
                        onChange={(e) => setChallengeForm({ ...challengeForm, target_kg: e.target.value })}
                        className="input" placeholder="100" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai <span className="text-red-500">*</span></label>
                      <input type="date" value={challengeForm.start_date}
                        onChange={(e) => setChallengeForm({ ...challengeForm, start_date: e.target.value })}
                        className="input" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Selesai <span className="text-red-500">*</span></label>
                      <input type="date" value={challengeForm.end_date}
                        onChange={(e) => setChallengeForm({ ...challengeForm, end_date: e.target.value })}
                        className="input" required />
                    </div>
                  </div>

                  <button type="submit" disabled={savingChallenge} className="btn-primary">
                    {savingChallenge ? "Menyimpan..." : "Buat Challenge"}
                  </button>
                </form>
              )}

              {/* Daftar challenge */}
              {challenges.length === 0 ? (
                <Empty icon="🏆" title="Belum ada challenge" />
              ) : (
                <div className="space-y-3">
                  {challenges.map((c) => (
                    <div key={c.id} className="card">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`badge ${c.status === "aktif" ? "badge-eco" : "badge-gray"}`}>
                              {c.status === "aktif" ? "🏆 Aktif" : "✅ Selesai"}
                            </span>
                            {c.waste_category_name && <span className="badge-gray">{c.waste_category_name}</span>}
                          </div>
                          <div className="font-semibold text-gray-800">{c.title}</div>
                          <div className="text-xs text-gray-400">
                            {formatTanggal(c.start_date)} — {formatTanggal(c.end_date)}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteChallenge(c.id)}
                          className="text-xs text-red-500 hover:text-red-700 px-2 py-1 border border-red-200 rounded-lg shrink-0 ml-4">
                          Hapus
                        </button>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{c.current_kg} / {c.target_kg} kg</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div className="bg-leaf h-2 rounded-full" style={{ width: `${Math.min(100, (c.current_kg / c.target_kg) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
