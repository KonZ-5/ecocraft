# EcoCraft — Frontend (React + Vite)

Frontend untuk Marketplace Produk Daur Ulang & Kerajinan Limbah. Dibangun dengan React + Vite + Tailwind CSS, terintegrasi penuh dengan backend Express yang sudah dibuat sebelumnya.

## Tech Stack
- **React 18** + **Vite**
- **React Router DOM v6** — client-side routing
- **Axios** — HTTP request ke backend, dengan interceptor JWT otomatis
- **Tailwind CSS v3** — styling utility-first
- **Google Fonts** — Plus Jakarta Sans (display) + Inter (body)

## Cara Menjalankan

### 1. Pastikan backend sudah berjalan di port 5000

```bash
cd server && npm run dev
```

### 2. Install dependencies frontend

```bash
cd ecocraft-client
npm install
```

### 3. Atur URL backend

```bash
cp .env.example .env
# Edit .env kalau backend di port/host berbeda dari default (http://localhost:5000)
```

### 4. Jalankan development server

```bash
npm run dev
# Buka http://localhost:5173
```

### 5. Build untuk production

```bash
npm run build
# Output ada di folder dist/
```

## Struktur Halaman & Akses

| Halaman | Path | Akses |
|---|---|---|
| Beranda | `/` | Publik |
| Daftar Produk | `/products` | Publik |
| Detail Produk | `/products/:id` | Publik |
| Challenge | `/challenges` | Publik |
| Detail Challenge | `/challenges/:id` | Login untuk join |
| Login | `/login` | — |
| Register | `/register` | — |
| Keranjang | `/cart` | Pembeli |
| Checkout | `/checkout` | Pembeli |
| Riwayat Pesanan | `/pembeli/orders` | Pembeli |
| Detail Pesanan | `/pembeli/orders/:id` | Pembeli |
| Donasi Saya | `/pembeli/donations` | Pembeli |
| Buat Donasi | `/donations/create` | Pembeli / Pengrajin |
| Dashboard Pengrajin | `/pengrajin/dashboard` | Pengrajin |
| Tambah Produk | `/pengrajin/products/create` | Pengrajin |
| Edit Produk | `/pengrajin/products/edit/:id` | Pengrajin |
| Dashboard Admin | `/admin` | Admin |

## Fitur per Halaman

**Beranda** — hero section, stats bar, 6 produk terbaru, cara kerja donasi limbah, challenge aktif

**Daftar Produk** — grid produk dengan filter nama & kategori limbah, pagination

**Detail Produk** — info produk + dampak CO₂ + eco score pengrajin + tombol tambah ke keranjang + ulasan pembeli

**Keranjang & Checkout** — update qty, hapus item, ringkasan harga, input alamat pengiriman, konfirmasi order

**Dashboard Pengrajin** — 3 tab: kelola produk (CRUD), konfirmasi donasi masuk, update status pesanan

**Dashboard Admin** — 3 tab: statistik platform, verifikasi pengrajin, buat/hapus challenge

## Akun Demo (dari seed database)
- Admin: `admin@ecocraft.com` / `admin123`
- Pengrajin: `siti@test.com` / `123456`
- Pembeli: `andi@test.com` / `123456`

## Struktur Folder

```
src/
├── components/
│   ├── common/
│   │   ├── index.jsx          # Loading, Alert, Empty, StatusBadge, formatRupiah, dll
│   │   └── ProtectedRoute.jsx
│   ├── layout/
│   │   ├── MainLayout.jsx
│   │   └── Navbar.jsx
│   └── product/
│       └── ProductCard.jsx
├── context/
│   ├── AuthContext.jsx        # state login global + persist localStorage
│   └── CartContext.jsx        # jumlah item keranjang global (badge navbar)
├── pages/
│   ├── auth/                  # Login, Register
│   ├── pembeli/               # Orders, OrderDetail, Donations
│   ├── pengrajin/             # Dashboard, ProductForm
│   ├── admin/                 # Dashboard admin
│   ├── HomePage.jsx
│   ├── ProductsPage.jsx
│   ├── ProductDetailPage.jsx
│   ├── ChallengesPage.jsx
│   ├── ChallengeDetailPage.jsx
│   ├── CartPage.jsx
│   ├── CheckoutPage.jsx
│   └── DonationCreatePage.jsx
├── services/
│   └── api.js                 # semua fungsi HTTP ke backend (dikelompokkan per resource)
├── App.jsx                    # routing lengkap
├── main.jsx
└── index.css                  # Tailwind + custom utility classes
```
