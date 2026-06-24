import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Inject JWT token otomatis ke setiap request kalau ada di localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Kalau 401, token expired/invalid -> hapus dan redirect ke login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ======= AUTH =======
export const authApi = {
  register: (data) => api.post("/api/auth/register", data),
  login: (data) => api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
};

// ======= PRODUK =======
export const productApi = {
  getAll: (params) => api.get("/api/products", { params }),

  getMyProducts: () =>
    api.get("/api/products/my-products"),

  getById: (id) =>
    api.get(`/api/products/${id}`),

  create: (data) =>
    api.post("/api/products", data),

  update: (id, data) =>
    api.put(`/api/products/${id}`, data),

  delete: (id) =>
    api.delete(`/api/products/${id}`),
};

// ======= CART =======
export const cartApi = {
  get: () => api.get("/api/cart"),
  add: (data) => api.post("/api/cart", data),
  update: (id, data) => api.put(`/api/cart/${id}`, data),
  remove: (id) => api.delete(`/api/cart/${id}`),
};

// ======= ORDER =======
export const orderApi = {
  checkout: (data) => api.post("/api/orders", data),
  getAll: (params) => api.get("/api/orders", { params }),
  getById: (id) => api.get(`/api/orders/${id}`),
  updateStatus: (id, data) => api.put(`/api/orders/${id}/status`, data),
  cancel: (id) => api.delete(`/api/orders/${id}`),
};

// ======= DONASI LIMBAH =======
export const donationApi = {
  getAll: (params) => api.get("/api/donations", { params }),
  getById: (id) => api.get(`/api/donations/${id}`),
  create: (data) => api.post("/api/donations", data),
  confirm: (id, data) => api.put(`/api/donations/${id}/confirm`, data),
  cancel: (id) => api.delete(`/api/donations/${id}`),
};

// ======= CHALLENGE =======
export const challengeApi = {
  getAll: (params) => api.get("/api/challenges", { params }),
  getById: (id) => api.get(`/api/challenges/${id}`),
  create: (data) => api.post("/api/challenges", data),
  update: (id, data) => api.put(`/api/challenges/${id}`, data),
  delete: (id) => api.delete(`/api/challenges/${id}`),
  join: (id) => api.post(`/api/challenges/${id}/join`),
  updateProgress: (id, data) => api.put(`/api/challenges/${id}/progress`, data),
};

// ======= REVIEW =======
export const reviewApi = {
  getAll: (params) => api.get("/api/reviews", { params }),
  create: (data) => api.post("/api/reviews", data),
  update: (id, data) => api.put(`/api/reviews/${id}`, data),
  delete: (id) => api.delete(`/api/reviews/${id}`),
};

// ======= ADMIN =======
export const adminApi = {
  getStats: () => api.get("/api/admin/stats"),
  getPengrajin: (params) => api.get("/api/admin/pengrajin", { params }),
  getPendingProducts: () =>
  api.get("/api/admin/products/pending"),
  verifyProduct: (id) =>
  api.put(`/api/admin/products/${id}/verify`),
  verifyPengrajin: (id) => api.put(`/api/admin/pengrajin/${id}/verify`),
  updateUserStatus: (id, data) => api.patch(`/api/admin/users/${id}/status`, data),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
};

export const pengrajinApi = {
  getVerified: () => api.get("/api/pengrajin/verified"),
};

export default api;
