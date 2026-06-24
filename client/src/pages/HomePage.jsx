import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { productApi, challengeApi } from "../services/api";
import ProductCard from "../components/product/ProductCard";
import { Loading } from "../components/common";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    productApi.getAll({ limit: 6 })
      .then((r) => setProducts(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false));

    challengeApi.getAll({ status: "aktif", limit: 3 })
      .then((r) => setChallenges(r.data.data || []))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-eco-900 via-leaf to-eco-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur text-eco-200 text-sm px-3 py-1.5 rounded-full font-medium">
              ♻️ Marketplace Daur Ulang Indonesia
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold leading-tight">
              Limbah jadi produk.<br />
              <span className="text-eco-300">Bumi jadi lebih baik.</span>
            </h1>
            <p className="text-eco-100 text-lg max-w-lg leading-relaxed">
              Beli produk kerajinan dari limbah, donasikan sampah Anda kepada pengrajin, dan ikut challenge daur ulang bulanan bersama komunitas.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link to="/products" className="bg-white text-leaf font-bold px-6 py-3 rounded-xl hover:bg-eco-50 transition-colors">
                Lihat Produk
              </Link>
              <Link to="/donations/create" className="bg-white/10 border border-white/30 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">
                Donasi Limbah
              </Link>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4 max-w-sm">
            {[
              { icon: "🧴", label: "Plastik → Produk" },
              { icon: "🧵", label: "Kain → Fashion" },
              { icon: "🪵", label: "Kayu → Furnitur" },
              { icon: "⚙️", label: "Logam → Kerajinan" },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-xs text-eco-200 font-medium">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { v: "12+ Ton", l: "Limbah Terolah" },
            { v: "340+", l: "Produk Tersedia" },
            { v: "50+ CO₂", l: "Ton Dihemat" },
            { v: "1.200+", l: "Pengguna Aktif" },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-display font-extrabold text-2xl text-leaf">{s.v}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Produk Terbaru */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-xs text-leaf font-semibold uppercase tracking-wider mb-1">Marketplace</p>
            <h2 className="font-display font-bold text-2xl text-gray-800">Produk Terbaru</h2>
          </div>
          <Link to="/products" className="text-sm text-leaf font-medium hover:underline">Lihat semua →</Link>
        </div>
        {loadingProducts ? (
          <Loading />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Alur Donasi Limbah */}
      <section className="bg-eco-900 text-white py-14">
        <div className="max-w-4xl mx-auto px-4 text-center mb-10">
          <h2 className="font-display font-bold text-2xl mb-2">Cara Kerja Donasi Limbah</h2>
          <p className="text-eco-200 text-sm">Punya sampah? Salurkan langsung ke pengrajin yang membutuhkan — dapat Eco Points.</p>
        </div>
        <div className="max-w-4xl mx-auto px-4 grid md:grid-cols-4 gap-6">
          {[
            { n: "1", icon: "♻️", t: "Pilih Jenis Limbah", d: "Tentukan jenis & estimasi berat limbah yang ingin kamu donasikan." },
            { n: "2", icon: "🔍", t: "Cari Pengrajin", d: "Sistem mencarikan pengrajin terdekat yang membutuhkan limbah tersebut." },
            { n: "3", icon: "🤝", t: "Konfirmasi Donasi", d: "Pengrajin mengonfirmasi dan kamu mengantarkan atau minta dijemput." },
            { n: "4", icon: "🌿", t: "Dapat Eco Points", d: "Setelah limbah diterima, kamu otomatis mendapat Eco Points sebagai reward." },
          ].map((s) => (
            <div key={s.n} className="text-center flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-eco-700 rounded-full flex items-center justify-center text-2xl">{s.icon}</div>
              <h3 className="font-semibold text-sm">{s.t}</h3>
              <p className="text-eco-300 text-xs leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/donations/create" className="inline-block bg-eco-400 text-eco-900 font-bold px-6 py-3 rounded-xl hover:bg-eco-300 transition-colors">
            Mulai Donasi Sekarang
          </Link>
        </div>
      </section>

      {/* Challenge aktif */}
      {challenges.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-14">
          <div className="flex justify-between items-end mb-6">
            <div>
              <p className="text-xs text-leaf font-semibold uppercase tracking-wider mb-1">Komunitas</p>
              <h2 className="font-display font-bold text-2xl text-gray-800">Challenge Aktif</h2>
            </div>
            <Link to="/challenges" className="text-sm text-leaf font-medium hover:underline">Lihat semua →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {challenges.map((c) => (
              <Link to={`/challenges/${c.id}`} key={c.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <span className="badge-eco">🏆 Aktif</span>
                  <span className="text-xs text-gray-400">{new Date(c.end_date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                </div>
                <h3 className="font-display font-semibold text-gray-800 mb-2">{c.title}</h3>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                  <div
                    className="bg-leaf h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (c.current_kg / c.target_kg) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{c.current_kg} / {c.target_kg} kg</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
