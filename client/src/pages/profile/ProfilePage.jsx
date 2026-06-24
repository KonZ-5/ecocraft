import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { EcoPointsChip, StatusBadge, formatTanggal } from "../../components/common";

const ROLE_LABEL = {
  admin: "Admin",
  pengrajin: "Pengrajin",
  pembeli: "Pembeli",
};

const ROLE_DASHBOARD = {
  admin: { to: "/admin", label: "Dashboard Admin" },
  pengrajin: { to: "/pengrajin/dashboard", label: "Dashboard Pengrajin" },
  pembeli: { to: "/pembeli/orders", label: "Pesanan Saya" },
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const dashboard = ROLE_DASHBOARD[user.role];

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="card">
        {/* Header profile */}
        <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-eco-100 flex items-center justify-center text-leaf font-bold text-2xl shrink-0">
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="font-display font-bold text-xl text-gray-800 truncate">{user.name}</h1>
            <span className="badge-eco mt-1 inline-block">{ROLE_LABEL[user.role] || user.role}</span>
          </div>
        </div>

        {/* Info dasar */}
        <div className="py-6 space-y-3 text-sm">
          {user.email && (
            <div className="flex justify-between">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-800">{user.email}</span>
            </div>
          )}
          {user.address && (
            <div className="flex justify-between gap-4">
              <span className="text-gray-500 shrink-0">Alamat</span>
              <span className="font-medium text-gray-800 text-right">{user.address}</span>
            </div>
          )}
          {typeof user.eco_points === "number" && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Eco Points</span>
              <EcoPointsChip points={user.eco_points} />
            </div>
          )}
          {user.status && (
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status Akun</span>
              <span className={`badge ${user.status === "active" ? "badge-eco" : "badge-red"}`}>
                {user.status === "active" ? "Aktif" : "Suspended"}
              </span>
            </div>
          )}
          {user.created_at && (
            <div className="flex justify-between">
              <span className="text-gray-500">Bergabung Sejak</span>
              <span className="font-medium text-gray-800">{formatTanggal(user.created_at)}</span>
            </div>
          )}
        </div>

        {/* Info tambahan khusus pengrajin */}
        {user.role === "pengrajin" && user.pengrajin_profile && (
          <div className="py-6 border-t border-gray-100 space-y-3 text-sm">
            <h2 className="font-display font-semibold text-gray-800 mb-1">Profil Workshop</h2>
            <div className="flex justify-between">
              <span className="text-gray-500">Nama Workshop</span>
              <span className="font-medium text-gray-800">{user.pengrajin_profile.workshop_name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status Verifikasi</span>
              <StatusBadge status={user.pengrajin_profile.is_verified} />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Eco Score</span>
              <span className="font-medium text-leaf">🌿 {user.pengrajin_profile.eco_score ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Limbah Diolah</span>
              <span className="font-medium text-gray-800">{user.pengrajin_profile.total_waste_kg ?? 0} kg</span>
            </div>
            {user.pengrajin_profile.description && (
              <p className="text-gray-500 text-xs italic pt-1">{user.pengrajin_profile.description}</p>
            )}
          </div>
        )}

        {/* Aksi */}
        <div className="pt-6 border-t border-gray-100 flex flex-col gap-2">
          {dashboard && (
            <Link to={dashboard.to} className="btn-secondary text-center">
              {dashboard.label}
            </Link>
          )}
          <button onClick={handleLogout} className="btn-danger w-full">
            Keluar dari Akun
          </button>
        </div>
      </div>
    </div>
  );
}
