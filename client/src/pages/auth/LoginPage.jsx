import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Alert } from "../../components/common";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "pengrajin") navigate("/pengrajin/dashboard");
      else navigate(from === "/login" ? "/" : from);
    } catch (err) {
      setError(err.response?.data?.message || "Login gagal. Periksa email dan password Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-4xl">♻️</span>
          <h1 className="font-display font-bold text-2xl text-gray-800 mt-2">Masuk ke EcoCraft</h1>
          <p className="text-gray-500 text-sm mt-1">Belum punya akun? <Link to="/register" className="text-leaf font-medium hover:underline">Daftar di sini</Link></p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && <Alert type="error" message={error} />}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className="input" placeholder="nama@email.com" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} className="input" placeholder="Minimal 6 karakter" required />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Masuk..." : "Masuk"}
          </button>

          <div className="border-t pt-3">
            <p className="text-xs text-gray-400 text-center">Akun demo: admin@ecocraft.com / admin123</p>
          </div>
        </form>
      </div>
    </div>
  );
}
