import { Link } from "react-router-dom";
import { formatRupiah } from "../common";

const WASTE_EMOJI = {
  plastik: "🧴", kertas: "📄", kain: "🧵", logam: "⚙️", kayu: "🪵",
};

export default function ProductCard({ product }) {
  const emoji = WASTE_EMOJI[product.waste_category_name] || "♻️";
  return (
    <Link to={`/products/${product.id}`} className="card hover:shadow-md transition-shadow group flex flex-col gap-3">
      {/* Gambar placeholder */}
      <div className="w-full h-44 bg-gradient-to-br from-eco-50 to-eco-100 rounded-lg flex items-center justify-center text-5xl">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded-lg" />
        ) : (
          <span>{emoji}</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="badge-eco text-xs">{emoji} {product.waste_category_name}</span>
        </div>
        <h3 className="font-display font-semibold text-gray-800 group-hover:text-leaf transition-colors line-clamp-2 leading-snug">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500">oleh {product.workshop_name}</p>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <span className="font-bold text-leaf text-lg">{formatRupiah(product.price)}</span>
        <span className="text-xs text-gray-400">💚 hemat {product.carbon_saved_kg} kg CO₂</span>
      </div>
    </Link>
  );
}
