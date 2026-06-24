import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import ProfilePage from "./pages/profile/ProfilePage";

// Halaman publik
import HomePage           from "./pages/HomePage";
import ProductsPage       from "./pages/ProductsPage";
import ProductDetailPage  from "./pages/ProductDetailPage";
import ChallengesPage     from "./pages/ChallengesPage";
import ChallengeDetailPage from "./pages/ChallengeDetailPage";

// Auth
import LoginPage    from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Pembeli
import CartPage         from "./pages/CartPage";
import CheckoutPage     from "./pages/CheckoutPage";
import OrdersPage       from "./pages/pembeli/OrdersPage";
import OrderDetailPage  from "./pages/pembeli/OrderDetailPage";
import DonationsPage    from "./pages/pembeli/DonationsPage";
import DonationCreatePage from "./pages/DonationCreatePage";

// Pengrajin
import PengrajinDashboard from "./pages/pengrajin/DashboardPage";
import ProductFormPage    from "./pages/pengrajin/ProductFormPage";

// Admin
import AdminDashboard from "./pages/admin/DashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<MainLayout />}>

              {/* ── Publik ── */}
              <Route index element={<HomePage />} />
              <Route path="products"         element={<ProductsPage />} />
              <Route path="products/:id"     element={<ProductDetailPage />} />
              <Route path="challenges"       element={<ChallengesPage />} />
              <Route path="challenges/:id"   element={<ChallengeDetailPage />} />
              <Route path="login"            element={<LoginPage />} />
              <Route path="register"         element={<RegisterPage />} />

              {/* ── Pembeli ── */}
              <Route path="cart" element={
                <ProtectedRoute allowedRoles={["pembeli"]}>
                  <CartPage />
                </ProtectedRoute>
              } />
              <Route path="checkout" element={
                <ProtectedRoute allowedRoles={["pembeli"]}>
                  <CheckoutPage />
                </ProtectedRoute>
              } />
              <Route path="pembeli/orders" element={
                <ProtectedRoute allowedRoles={["pembeli"]}>
                  <OrdersPage />
                </ProtectedRoute>
              } />
              <Route path="pembeli/orders/:id" element={
                <ProtectedRoute allowedRoles={["pembeli"]}>
                  <OrderDetailPage />
                </ProtectedRoute>
              } />
              <Route path="pembeli/donations" element={
                <ProtectedRoute allowedRoles={["pembeli"]}>
                  <DonationsPage />
                </ProtectedRoute>
              } />
              <Route path="donations/create" element={
                <ProtectedRoute allowedRoles={["pembeli", "pengrajin"]}>
                  <DonationCreatePage />
                </ProtectedRoute>
              } />

              {/* ── Pengrajin ── */}
              <Route path="pengrajin/dashboard" element={
                <ProtectedRoute allowedRoles={["pengrajin"]}>
                  <PengrajinDashboard />
                </ProtectedRoute>
              } />
              <Route path="pengrajin/products/create" element={
                <ProtectedRoute allowedRoles={["pengrajin"]}>
                  <ProductFormPage />
                </ProtectedRoute>
              } />
              <Route path="pengrajin/products/edit/:id" element={
                <ProtectedRoute allowedRoles={["pengrajin"]}>
                  <ProductFormPage />
                </ProtectedRoute>
              } />

              {/* ── Admin ── */}
              <Route path="admin" element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              <Route
                path="profile"
                element={
                  <ProtectedRoute
                    allowedRoles={["admin", "pengrajin", "pembeli"]}
                  >
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={
                <div className="max-w-xl mx-auto px-4 py-20 text-center">
                  <div className="text-6xl mb-4">🌿</div>
                  <h1 className="font-display font-bold text-2xl text-gray-700 mb-2">Halaman tidak ditemukan</h1>
                  <p className="text-gray-500 text-sm mb-6">URL yang kamu tuju tidak ada.</p>
                  <a href="/" className="btn-primary">Kembali ke Beranda</a>
                </div>
              } />

            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
