import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { challengeApi } from "../services/api";
import { Loading, Empty, formatTanggal } from "../components/common";

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    challengeApi.getAll({ status: filter || undefined })
      .then((r) => setChallenges(r.data.data || []))
      .catch(() => setChallenges([]))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-gray-800 mb-1">Challenge Daur Ulang</h1>
        <p className="text-gray-500 text-sm">Ikuti tantangan bulanan, kontribusikan limbah, dan raih Eco Points bonus!</p>
      </div>

      <div className="flex gap-2 mb-6">
        {["", "aktif", "selesai"].map((s) => (
          <button key={s || "all"} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === s ? "bg-leaf text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-leaf"}`}
          >
            {s === "" ? "Semua" : s === "aktif" ? "🟢 Aktif" : "✅ Selesai"}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : challenges.length === 0 ? (
        <Empty icon="🏆" title="Belum ada challenge" desc="Pantau terus, admin akan segera membuat challenge baru!" />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {challenges.map((c) => (
            <Link to={`/challenges/${c.id}`} key={c.id} className="card hover:shadow-md transition-shadow flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <span className={`badge ${c.status === "aktif" ? "badge-eco" : "badge-gray"}`}>
                  {c.status === "aktif" ? "🏆 Aktif" : "✅ Selesai"}
                </span>
                <span className="text-xs text-gray-400">{formatTanggal(c.end_date)} berakhir</span>
              </div>
              <h3 className="font-display font-semibold text-gray-800">{c.title}</h3>
              {c.waste_category_name && <p className="text-xs text-gray-500">Kategori: {c.waste_category_name}</p>}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{c.current_kg} / {c.target_kg} kg</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-leaf h-2 rounded-full"
                    style={{ width: `${Math.min(100, (c.current_kg / c.target_kg) * 100)}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
