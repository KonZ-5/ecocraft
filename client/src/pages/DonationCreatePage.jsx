import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
// Bagian import di bawah ini sudah digabung agar tidak error lagi
import { donationApi, adminApi, pengrajinApi } from "../services/api";
import { Alert } from "../components/common";

const WASTE_CATEGORIES = [
  { id: 1, name: "plastik", emoji: "🧴" },
  { id: 2, name: "kertas", emoji: "📄" },
  { id: 3, name: "kain", emoji: "🧵" },
  { id: 4, name: "logam", emoji: "⚙️" },
  { id: 5, name: "kayu", emoji: "🪵" },
];

export default function CreateDonationPage() {
  const navigate = useNavigate();
  const [pengrajinList, setPengrajinList] = useState([]);
  const [form, setForm] = useState({ pengrajin_id: "", waste_category_id: "", estimated_weight: "", notes: "" });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    pengrajinApi
      .getVerified()
      .then((r) => {
        setPengrajinList(r.data.data || []);
      })
      .catch((err) => {
        console.error("Gagal mengambil data pengrajin:", err);

        setAlert({
          type: "error",
          msg: "Gagal memuat daftar pengrajin",
        });
      });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    setLoading(true);
    try {
      const res = await donationApi.create({
        pengrajin_id: Number(form.pengrajin_id),
        waste_category_id: Number(form.waste_category_id),
        estimated_weight: Number(form.estimated_weight),
        notes: form.notes,
      });
      navigate("/pembeli/donations", { state: { success: "Request donasi berhasil dikirim! Menunggu konfirmasi pengrajin." } });
    } catch (err) {
      console.error("Donation Error:", err);

      setAlert({
        type: "error",
        msg:
          err.response?.data?.message ||
          "Gagal membuat donasi.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="font-display font-bold text-2xl text-gray-800 mb-2">Donasi Limbah</h1>
      <p className="text-sm text-gray-500 mb-8">Salurkan limbah rumah tangga kamu ke pengrajin yang membutuhkan dan dapatkan Eco Points.</p>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {alert && <Alert type={alert.type} message={alert.msg} />}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Limbah <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-5 gap-2">
            {WASTE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setForm({ ...form, waste_category_id: c.id })}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all text-xs font-medium
                  ${Number(form.waste_category_id) === c.id ? "border-leaf bg-eco-50 text-leaf" : "border-gray-100 bg-white text-gray-500 hover:border-eco-200"}`}
              >
                <span className="text-2xl">{c.emoji}</span>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan Pengrajin <span className="text-red-500">*</span></label>
          <select name="pengrajin_id" value={form.pengrajin_id} onChange={handleChange} className="input" required>
            <option value="">Pilih pengrajin...</option>
            {pengrajinList.map((p) => (
              <option key={p.id} value={p.id}>{p.workshop_name} ({p.name})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimasi Berat (kg) <span className="text-red-500">*</span></label>
          <input
            name="estimated_weight"
            type="number"
            step="0.1"
            min="0.1"
            value={form.estimated_weight}
            onChange={handleChange}
            className="input"
            placeholder="Contoh: 2.5"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            className="input"
            rows={3}
            placeholder="Deskripsi singkat limbah (kondisi, jumlah, dll)..."
          />
        </div>

        <div className="bg-eco-50 rounded-lg p-3 text-xs text-eco-700">
          🌿 Setelah pengrajin mengonfirmasi penerimaan, Anda akan mendapat <strong>10 Eco Points per kg</strong> limbah yang diterima.
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={
            loading ||
            !form.waste_category_id ||
            !form.pengrajin_id ||
            !form.estimated_weight
          }
        >
          {loading ? "Mengirim..." : "Kirim Request Donasi"}
        </button>
      </form>
    </div>
  );
}