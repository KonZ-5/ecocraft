import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { productApi } from "../../services/api";
import { Alert, Loading } from "../../components/common";

const WASTE_CATEGORIES = [
  { id: 1, name: "plastik", emoji: "🧴" },
  { id: 2, name: "kertas", emoji: "📄" },
  { id: 3, name: "kain",   emoji: "🧵" },
  { id: 4, name: "logam",  emoji: "⚙️" },
  { id: 5, name: "kayu",   emoji: "🪵" },
];

const EMPTY = { name: "", description: "", price: "", stock: "", waste_category_id: "", waste_weight_kg: "", image: "" };

export default function ProductFormPage() {
  const { id } = useParams();           // ada id = mode edit
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  // Kalau mode edit, load data produk dulu
  useEffect(() => {
    if (!isEdit) return;
    productApi.getById(id)
      .then((r) => {
        const p = r.data.data;
        setForm({
          name:              p.name             || "",
          description:       p.description      || "",
          price:             p.price            || "",
          stock:             p.stock            || "",
          waste_category_id: p.waste_category_id|| "",
          waste_weight_kg:   p.waste_weight_kg  || "",
          image:             p.image            || "",
        });
      })
      .catch(() => setAlert({ type: "error", msg: "Gagal memuat data produk." }))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);
    if (!form.waste_category_id) return setAlert({ type: "error", msg: "Pilih kategori limbah terlebih dahulu." });

    setSaving(true);
    const payload = {
      ...form,
      price:             Number(form.price),
      stock:             Number(form.stock),
      waste_category_id: Number(form.waste_category_id),
      waste_weight_kg:   Number(form.waste_weight_kg),
      image:             form.image || null,
    };

    try {
      if (isEdit) {
        await productApi.update(id, payload);
        setAlert({ type: "success", msg: "Produk berhasil diperbarui!" });
      } else {
        await productApi.create(payload);
        navigate("/pengrajin/dashboard", { state: { success: "Produk berhasil ditambahkan!" } });
      }
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal menyimpan produk." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-12"><Loading /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/pengrajin/dashboard" className="text-sm text-leaf hover:underline mb-6 inline-block">
        ← Kembali ke Dashboard
      </Link>

      <h1 className="font-display font-bold text-2xl text-gray-800 mb-6">
        {isEdit ? "Edit Produk" : "Tambah Produk Baru"}
      </h1>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

        {/* Nama */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Produk <span className="text-red-500">*</span>
          </label>
          <input
            name="name" value={form.name} onChange={handleChange}
            className="input" placeholder="Contoh: Tas Tote dari Plastik Daur Ulang" required
          />
        </div>

        {/* Deskripsi */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
          <textarea
            name="description" value={form.description} onChange={handleChange}
            className="input" rows={3} placeholder="Ceritakan bahan, proses, dan keunikan produk ini..."
          />
        </div>

        {/* Kategori limbah */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kategori Limbah <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {WASTE_CATEGORIES.map((c) => (
              <button
                key={c.id} type="button"
                onClick={() => setForm({ ...form, waste_category_id: c.id })}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all text-xs font-medium
                  ${Number(form.waste_category_id) === c.id
                    ? "border-leaf bg-eco-50 text-leaf"
                    : "border-gray-100 bg-white text-gray-500 hover:border-eco-200"}`}
              >
                <span className="text-2xl">{c.emoji}</span>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Berat limbah */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Berat Limbah Digunakan (kg) <span className="text-red-500">*</span>
          </label>
          <input
            name="waste_weight_kg" type="number" step="0.01" min="0.01"
            value={form.waste_weight_kg} onChange={handleChange}
            className="input" placeholder="Contoh: 0.5" required
          />
          <p className="text-xs text-gray-400 mt-1">
            Dipakai untuk menghitung CO₂ yang dihemat secara otomatis.
          </p>
        </div>

        {/* Harga & Stok */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Harga (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              name="price" type="number" min="1"
              value={form.price} onChange={handleChange}
              className="input" placeholder="50000" required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stok <span className="text-red-500">*</span>
            </label>
            <input
              name="stock" type="number" min="0"
              value={form.stock} onChange={handleChange}
              className="input" placeholder="10" required
            />
          </div>
        </div>

        {/* URL Gambar */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL Foto Produk</label>
          <input
            name="image" type="url"
            value={form.image} onChange={handleChange}
            className="input" placeholder="https://..."
          />
          <p className="text-xs text-gray-400 mt-1">
            Tempel URL gambar dari hosting foto (Imgur, Cloudinary, dsb). Upload langsung akan didukung di versi berikutnya.
          </p>
        </div>

        {/* Preview CO2 estimasi */}
        {form.waste_weight_kg && form.waste_category_id && (
          <div className="bg-eco-50 rounded-xl p-4 text-sm">
            <p className="text-eco-700 font-medium">
              💚 Estimasi CO₂ dihemat:{" "}
              <strong>
                {(
                  Number(form.waste_weight_kg) *
                  [0, 6.0, 1.1, 5.5, 9.0, 1.8][Number(form.waste_category_id)]
                ).toFixed(2)}{" "}
                kg
              </strong>
            </p>
            <p className="text-eco-600 text-xs mt-0.5">
              Akan dihitung ulang otomatis oleh sistem saat disimpan.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? "Menyimpan..." : isEdit ? "Simpan Perubahan" : "Tambah Produk"}
          </button>
          <Link to="/pengrajin/dashboard" className="btn-secondary">Batal</Link>
        </div>
      </form>
    </div>
  );
}
