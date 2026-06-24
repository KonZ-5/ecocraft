import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { challengeApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Loading, Alert, formatTanggal } from "../components/common";

export default function ChallengeDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [joining, setJoining] = useState(false);
  const [progressForm, setProgressForm] = useState({ contributed_kg: "", proof_image: "" });
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [showProgressForm, setShowProgressForm] = useState(false);

  const fetchChallenge = () => {
    challengeApi.getById(id)
      .then((r) => setChallenge(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchChallenge(); }, [id]);

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    try {
      await challengeApi.join(id);
      setAlert({ type: "success", msg: "Berhasil ikut challenge! Sekarang update kontribusi kamu." });
      fetchChallenge();
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal ikut challenge." });
    } finally {
      setJoining(false);
    }
  };

  const handleUpdateProgress = async (e) => {
    e.preventDefault();
    setUpdatingProgress(true);
    try {
      await challengeApi.updateProgress(id, {
        contributed_kg: Number(progressForm.contributed_kg),
        proof_image: progressForm.proof_image || undefined,
      });
      setAlert({ type: "success", msg: "Kontribusi berhasil diperbarui!" });
      fetchChallenge();
      setShowProgressForm(false);
    } catch (err) {
      setAlert({ type: "error", msg: err.response?.data?.message || "Gagal update progress." });
    } finally {
      setUpdatingProgress(false);
    }
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-12"><Loading /></div>;
  if (!challenge) return <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">Challenge tidak ditemukan.</div>;

  const pct = Math.min(100, (challenge.current_kg / challenge.target_kg) * 100);
  const isParticipant = challenge.leaderboard?.some((l) => l.user_id === user?.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/challenges" className="text-sm text-leaf hover:underline mb-6 inline-block">← Kembali ke Challenge</Link>

      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

      <div className="card mb-6 mt-4">
        <div className="flex justify-between items-start mb-4">
          <span className={`badge ${challenge.status === "aktif" ? "badge-eco" : "badge-gray"}`}>
            {challenge.status === "aktif" ? "🏆 Aktif" : "✅ Selesai"}
          </span>
          <div className="text-xs text-gray-400 text-right">
            <div>{formatTanggal(challenge.start_date)} —</div>
            <div>{formatTanggal(challenge.end_date)}</div>
          </div>
        </div>
        <h1 className="font-display font-bold text-2xl text-gray-800 mb-2">{challenge.title}</h1>
        <p className="text-gray-600 text-sm mb-6">{challenge.description}</p>

        <div className="mb-2 flex justify-between text-sm font-medium">
          <span>Progress Komunitas</span>
          <span className="text-leaf">{challenge.current_kg} / {challenge.target_kg} kg</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 mb-4">
          <div className="bg-leaf h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-xs text-gray-400 text-center">{pct.toFixed(0)}% dari target tercapai</div>
      </div>

      {/* Aksi */}
      {user && challenge.status === "aktif" && (
        <div className="card mb-6">
          {!isParticipant ? (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">Bergabung dan mulai kontribusikan limbah kamu!</p>
              <button onClick={handleJoin} disabled={joining} className="btn-primary">
                {joining ? "Bergabung..." : "🏆 Ikut Challenge Ini"}
              </button>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-eco-700">✅ Kamu sudah ikut challenge ini</span>
                <button onClick={() => setShowProgressForm(!showProgressForm)} className="btn-secondary text-sm">
                  Update Kontribusi
                </button>
              </div>
              {showProgressForm && (
                <form onSubmit={handleUpdateProgress} className="space-y-3 border-t pt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kontribusi (kg)</label>
                    <input type="number" step="0.1" min="0" value={progressForm.contributed_kg}
                      onChange={(e) => setProgressForm({ ...progressForm, contributed_kg: e.target.value })}
                      className="input" placeholder="Total limbah yang kamu kontribusikan" required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL Foto Bukti</label>
                    <input type="url" value={progressForm.proof_image}
                      onChange={(e) => setProgressForm({ ...progressForm, proof_image: e.target.value })}
                      className="input" placeholder="https://..."
                    />
                  </div>
                  <button type="submit" disabled={updatingProgress} className="btn-primary">
                    {updatingProgress ? "Menyimpan..." : "Simpan Kontribusi"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {!user && challenge.status === "aktif" && (
        <div className="card mb-6 text-center">
          <p className="text-sm text-gray-600 mb-3">Login terlebih dahulu untuk ikut challenge ini.</p>
          <Link to="/login" className="btn-primary">Masuk Sekarang</Link>
        </div>
      )}

      {/* Leaderboard */}
      <div className="card">
        <h2 className="font-display font-semibold text-gray-800 mb-4">🏅 Leaderboard</h2>
        {!challenge.leaderboard?.length ? (
          <p className="text-sm text-gray-400 text-center py-4">Belum ada peserta.</p>
        ) : (
          <div className="space-y-3">
            {challenge.leaderboard.map((p, i) => (
              <div key={p.user_id} className={`flex items-center gap-3 p-2 rounded-lg ${p.user_id === user?.id ? "bg-eco-50" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${i === 0 ? "bg-amber-400 text-white" : i === 1 ? "bg-gray-300 text-white" : i === 2 ? "bg-amber-700 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {i + 1}
                </div>
                <div className="flex-1 font-medium text-sm text-gray-700">{p.name} {p.user_id === user?.id && <span className="text-eco-600 text-xs">(Kamu)</span>}</div>
                <div className="text-leaf font-bold text-sm">{p.contributed_kg} kg</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
