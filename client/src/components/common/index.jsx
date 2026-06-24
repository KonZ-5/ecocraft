// Loading spinner
export function Loading({ text = "Memuat..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-4 border-eco-200 border-t-leaf rounded-full animate-spin" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}

// Alert/Toast
export function Alert({ type = "error", message, onClose }) {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-700",
    success: "bg-eco-50 border-eco-200 text-eco-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
    warn: "bg-amber-50 border-amber-200 text-amber-700",
  };
  if (!message) return null;
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm flex justify-between items-start gap-3 ${styles[type]}`}>
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-60 hover:opacity-100 shrink-0">✕</button>
      )}
    </div>
  );
}

// Empty state
export function Empty({ icon = "📭", title, desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="text-5xl">{icon}</div>
      <h3 className="font-display font-semibold text-gray-700 text-lg">{title}</h3>
      {desc && <p className="text-sm text-gray-500 max-w-xs">{desc}</p>}
      {action}
    </div>
  );
}

// Status badge untuk order, donasi, dll
const STATUS_MAP = {
  // Order
  pending: { label: "Menunggu", cls: "badge-warn" },
  dikemas: { label: "Dikemas", cls: "badge bg-blue-100 text-blue-700" },
  dikirim: { label: "Dikirim", cls: "badge bg-purple-100 text-purple-700" },
  selesai: { label: "Selesai", cls: "badge-eco" },
  dibatalkan: { label: "Dibatalkan", cls: "badge-red" },
  // Donasi
  menunggu: { label: "Menunggu", cls: "badge-warn" },
  dikonfirmasi: { label: "Dikonfirmasi", cls: "badge bg-blue-100 text-blue-700" },
  diterima: { label: "Diterima", cls: "badge-eco" },
  ditolak: { label: "Ditolak", cls: "badge-red" },
  // Challenge
  aktif: { label: "Aktif", cls: "badge-eco" },
  // Pengrajin
  true: { label: "Terverifikasi ✓", cls: "badge-eco" },
  false: { label: "Belum Diverifikasi", cls: "badge-warn" },
};

export function StatusBadge({ status }) {
  const s = STATUS_MAP[String(status)] || { label: status, cls: "badge-gray" };
  return <span className={s.cls}>{s.label}</span>;
}

// Format angka ke Rupiah
export function formatRupiah(angka) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);
}

// Format tanggal
export function formatTanggal(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// Eco Points chip
export function EcoPointsChip({ points }) {
  return (
    <span className="inline-flex items-center gap-1 bg-eco-100 text-eco-800 text-xs font-semibold px-2 py-0.5 rounded-full">
      🌿 {points} poin
    </span>
  );
}
