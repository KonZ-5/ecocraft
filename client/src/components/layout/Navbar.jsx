import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useEffect } from "react";

export default function Navbar() {
  const { user } = useAuth();
  const { cartCount, fetchCartCount } = useCart();
  const location = useLocation();

  useEffect(() => {
    if (user?.role === "pembeli") fetchCartCount();
  }, [user, location.pathname]);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">♻️</span>
            <span className="font-display font-bold text-leaf text-xl">EcoCraft</span>
          </Link>

          {/* Nav Links - tengah */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link to="/products" className="hover:text-leaf transition-colors">Produk</Link>
            <Link to="/challenges" className="hover:text-leaf transition-colors">Challenge</Link>
            {user && (user.role === "pembeli" || user.role === "pengrajin") && (
              <Link to="/donations/create" className="hover:text-leaf transition-colors">Donasi Limbah</Link>
            )}
          </div>

          {/* Kanan - aksi user */}
          <div className="flex items-center gap-3">
            {!user ? (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-leaf">Masuk</Link>
                <Link to="/register" className="btn-primary text-sm">Daftar</Link>
              </>
            ) : (
              <>
                {/* Keranjang - hanya pembeli */}
                {user.role === "pembeli" && (
                  <Link to="/cart" className="relative p-2 text-gray-600 hover:text-leaf">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-leaf text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                        {cartCount > 9 ? "9+" : cartCount}
                      </span>
                    )}
                  </Link>
                )}

                {/* Dashboard sesuai role */}
                {user.role === "admin" && (
                  <Link to="/admin" className="text-sm font-medium text-gray-600 hover:text-leaf">Dashboard Admin</Link>
                )}
                {user.role === "pengrajin" && (
                  <Link to="/pengrajin/dashboard" className="text-sm font-medium text-gray-600 hover:text-leaf">Dashboard</Link>
                )}
                {user.role === "pembeli" && (
                  <Link to="/pembeli/orders" className="text-sm font-medium text-gray-600 hover:text-leaf">Pesanan</Link>
                )}

                {/* Avatar & nama - klik untuk ke halaman profile */}
                <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-eco-100 flex items-center justify-center text-leaf font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden md:block">{user.name}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
