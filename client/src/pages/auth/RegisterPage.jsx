import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../services/api";
import { Alert } from "../../components/common";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "pembeli", workshop_name: "", description: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register(form);
      setSuccess("Registrasi berhasil! Silakan login.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registrasi gagal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">♻️</span>
          <h1 className="font-display font-bold text-2xl text-gray-800 mt-2">Daftar Akun EcoCraft</h1>
          <p className="text-gray-500 text-sm mt-1">Sudah punya akun? <Link to="/login" className="text-leaf font-medium hover:underline">Masuk</Link></p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="Nama kamu" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="input" placeholder="nama@email.com" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} className="input" placeholder="Minimal 6 karakter" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daftar sebagai</label>
            <select name="role" value={form.role} onChange={handleChange} className="input">
              <option value="pembeli">Pembeli</option>
              <option value="pengrajin">Pengrajin</option>
            </select>
          </div>

          {form.role === "pengrajin" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Workshop <span className="text-red-500">*</span></label>
                <input name="workshop_name" value={form.workshop_name} onChange={handleChange} className="input" placeholder="Nama workshop / usaha kamu" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi Workshop</label>
                <textarea name="description" value={form.description} onChange={handleChange} className="input" rows={3} placeholder="Ceritakan sedikit tentang usaha daur ulang kamu..." />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                ℹ️ Akun pengrajin perlu diverifikasi admin terlebih dahulu sebelum bisa mengunggah produk.
              </div>
            </>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Mendaftarkan..." : "Daftar Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}
