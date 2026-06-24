import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-white border-t border-gray-100 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          © 2026 EcoCraft — Marketplace Produk Daur Ulang & Kerajinan Limbah
        </div>
      </footer>
    </div>
  );
}
