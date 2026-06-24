import { useState, useEffect } from "react";
import { productApi } from "../services/api";
import ProductCard from "../components/product/ProductCard";
import { Loading, Empty } from "../components/common";

const WASTE_CATEGORIES = ["", "plastik", "kertas", "kain", "logam", "kayu"];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState({ name: "", waste_category: "" });

  const limit = 12;

  const fetchProducts = (pg = 1) => {
    setLoading(true);
    productApi.getAll({ name: search.name, waste_category: search.waste_category, page: pg, limit })
      .then((r) => {
        const data = r.data.data || [];
        setProducts(data);
        setHasMore(data.length === limit);
        setPage(pg);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(1); }, [search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch({ name, waste_category: category });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl text-gray-800 mb-1">Semua Produk</h1>
        <p className="text-gray-500 text-sm">Produk kerajinan dari bahan daur ulang, dibuat oleh pengrajin terverifikasi.</p>
      </div>

      {/* Filter */}
      <form onSubmit={handleSearch} className="flex flex-wrap gap-3 mb-8">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cari nama produk..."
          className="input max-w-xs"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input max-w-[180px]">
          <option value="">Semua Kategori</option>
          {WASTE_CATEGORIES.filter(Boolean).map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <button type="submit" className="btn-primary">Cari</button>
        {(search.name || search.waste_category) && (
          <button type="button" onClick={() => { setName(""); setCategory(""); setSearch({ name: "", waste_category: "" }); }} className="btn-secondary">
            Reset
          </button>
        )}
      </form>

      {loading ? (
        <Loading />
      ) : products.length === 0 ? (
        <Empty icon="📦" title="Produk tidak ditemukan" desc="Coba ubah kata kunci atau kategori pencarian" />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="flex justify-center gap-3 mt-8">
            <button
              onClick={() => fetchProducts(page - 1)}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-40"
            >← Sebelumnya</button>
            <span className="flex items-center text-sm text-gray-500">Hal. {page}</span>
            <button
              onClick={() => fetchProducts(page + 1)}
              disabled={!hasMore}
              className="btn-secondary disabled:opacity-40"
            >Berikutnya →</button>
          </div>
        </>
      )}
    </div>
  );
}
