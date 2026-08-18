# 🛍️ Agung Jastip — Manajemen Jasa Titip (Jastip)

Aplikasi web full-stack untuk mengelola bisnis jastip (jasa titip belanja):
trip, pesanan, kurs, biaya operasional, tagihan WhatsApp otomatis, dan label resi.

**Tech Stack:** Next.js (App Router) · React 19 · Tailwind CSS · shadcn/ui · Supabase · Vercel

---

## ✨ Fitur

| Fitur | Keterangan |
|---|---|
| 📊 **Dashboard Keuangan** | Modal, uang masuk (DP/lunas), piutang, estimasi keuntungan, biaya operasional per trip + progress trip |
| 💱 **Kurs Live otomatis** | Auto-kalkulasi harga beli → IDR dari API gratis; fallback input manual bila API bermasalah |
| 📦 **Manajemen Pesanan** | Tabel ribuan pesanan dengan Search, Sort, Filter (trip, pengiriman, status), pagination, CRUD |
| 💬 **Chat WA Tagihan** | Generate link `wa.me` otomatis berisi sisa tagihan, rincian barang & instruksi transfer |
| 💸 **Chat WA Refund** | Generate link `wa.me` narasi barang habis + konfirmasi rekening refund |
| 🏷️ **Label Resi Auto** | Cetak label pengiriman per customer, layout ramah printer thermal (CSS `@media print`, 80mm) |
| 🧾 **Biaya Operasional** | Catat pengeluaran: Makan, Cargo, Transport, Akomodasi, Lainnya |
| 👥 **Customer** | Data customer + WhatsApp + alamat, dipakai untuk tagihan & label |
| 🔐 **Login wajib** | Aplikasi terkunci — masuk dengan sandi sebelum mengelola apa pun |
| 🌗 **Mode Terang/Gelap** | Toggle tema (ikut sistem, terang, atau gelap) di sidebar & header |
| 📱 **Responsif all-device** | HP, tablet, dan desktop — sidebar jadi menu drawer, tabel bisa digulir |

---

## 🚀 Menjalankan di Lokal

### 1. Prasyarat
- Node.js 18.18+ (disarankan 20+)
- Akun [Supabase](https://supabase.com) (gratis)

### 2. Install dependencies

```bash
npm install
```

### 2b. Mode Lokal (tanpa Supabase) — uji langsung 🚀

Belum punya Supabase? **Tidak masalah.** Tanpa mengisi `.env.local` sama sekali, aplikasi otomatis
berjalan dalam **Mode Lokal**:

- Semua data (trip, pesanan, customer, biaya) disimpan di `localStorage` browser.
- Diisi **data contoh** realistis saat pertama dibuka, jadi seluruh fitur bisa langsung dicoba:
  Dashboard keuangan, CRUD pesanan, tombol WA tagihan/refund, cetak label resi, dan kurs.
- Ada banner "Mode Lokal" di Dashboard dengan tombol **Reset data contoh**.

> ⚠️ Data Mode Lokal hanya ada di browser itu dan bisa hilang saat cache dibersihkan.
> Untuk penyimpanan permanen, lanjutkan ke langkah 3–4 di bawah.

### 3. Setup database (Supabase)
1. Buka dashboard Supabase → **SQL Editor**.
2. Tempel seluruh isi file **`schema.sql`** lalu klik **Run**.
   - Membuat tabel `trips`, `customers`, `orders`, `operational_costs` + RLS + index.
   - RLS dibuka untuk `anon` karena aplikasi ini single-user (tanpa login).

### 4. Setup environment
Salin `.env.example` menjadi `.env.local`:

```bash
cp .env.example .env.local
```

Isi nilai dari **Supabase → Project Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 5. Jalankan

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

---

## 🔐 Login & Mode Tampilan

### Login (sandi)
- Saat pertama dibuka, aplikasi minta **sandi** sebelum masuk.
- **Sandi bawaan Mode Lokal: `agung123`** — ganti segera di menu **Pengaturan → Ganti Sandi**.
- Sandi disimpan sebagai hash di browser (bukan teks biasa). Saat Supabase terhubung,
  login otomatis bisa dialihkan ke **Supabase Auth** (email + sandi) — pengaturan akun
  dikelola di dashboard Supabase → Authentication.
- Tombol **Keluar** ada di sidebar (desktop) dan header (HP).

### Mode terang / gelap
- Klik ikon 🌙/☀️ di sidebar atau header HP untuk ganti tema.
- Default mengikuti **tema sistem** perangkat.

### Responsif all-device
- **HP/tablet:** navigasi jadi menu drawer (☰), header ringkas, kartu statistik 2 kolom,
  dialog form bisa di-scroll, tabel digulir horizontal.
- **Desktop (≥1024px):** sidebar penuh di kiri.

---

## ☁️ Deploy ke Vercel

1. Push repo ke GitHub/GitLab.
2. Di [vercel.com](https://vercel.com) → **Add New → Project** → pilih repo.
3. Framework otomatis terdeteksi (Next.js). Tambahkan env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Klik **Deploy**. Selesai 🎉

> Tidak perlu `vercel.json` tambahan — konfigurasi Next.js sudah cukup.

---

## 🧠 Cara Kerja Fitur Utama

### Kurs Live + Fallback
1. Aplikasi mengambil kurs dari API route `/api/exchange` (gratis, tanpa key):
   - Provider utama: **open.er-api.com** (160+ mata uang, update harian)
   - Cadangan: **frankfurter.app** (data ECB)
2. Prioritas kurs: **Manual override (browser) → Live → Cadangan statis**.
3. Override manual diatur di halaman **Pengaturan → Kurs** (tersimpan di `localStorage` browser).
4. Setiap pesanan menyimpan `exchange_rate_used`, jadi riwayat harga tetap akurat.

### Perhitungan Keuangan
- **Modal trip** = Σ (harga asing × qty) × `target_kurs` trip
- **Penjualan** = Σ (`calculated_price_idr` × qty) — order non-refund
- **Uang masuk** = Σ `paid_amount_idr` — order non-refund
- **Estimasi keuntungan** = Penjualan − Modal − Biaya Operasional

### Template WhatsApp
Narasi tagihan & refund, nama pemilik, dan data rekening diatur di file
**`lib/whatsapp.ts`** (konstanta `OWNER_NAME`, `BANK_NAME`, `ACCOUNT_NUMBER`, `ACCOUNT_NAME`).
Ubah sesuai data rekening asli lalu commit.

### Label Resi (printer thermal)
1. Menu **Label Resi** → pilih pesanan (per trip) → **Cetak Label**.
2. Halaman cetak menerapkan `@page { size: 80mm auto }` sehingga cocok untuk printer thermal 80mm.
3. Untuk printer biasa, gunakan dialog print browser → ukuran kertas bebas.

---

## 🗂️ Struktur Folder

```
├── app/
│   ├── api/exchange/        # API route kurs live
│   ├── labels/print/        # Halaman cetak label (server component)
│   ├── page.tsx             # Dashboard
│   ├── trips/               # Daftar & detail trip
│   ├── orders/              # Manajemen pesanan
│   ├── customers/           # Manajemen customer
│   ├── costs/               # Biaya operasional
│   └── settings/            # Pengaturan kurs manual
├── components/
│   ├── ui/                  # Komponen shadcn/ui
│   ├── layout/              # App shell + navigasi
│   ├── orders/ trips/ customers/ costs/ labels/ dashboard/
│   └── shared/              # Badge, empty state, confirm, kurs widget
├── hooks/                   # useLoad (data fetching)
├── lib/
│   ├── api.ts               # Lapisan CRUD Supabase bertipe
│   ├── finance.ts           # Kalkulasi keuangan
│   ├── exchange.ts          # Kurs live + override manual
│   ├── whatsapp.ts          # Template pesan WA + link wa.me
│   └── supabase/            # Klien browser & server (@supabase/ssr)
├── schema.sql               # Skema database Supabase
└── .env.example
```

---

## 🛠️ Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build (type-check otomatis) |
| `npm run start` | Menjalankan production build |
| `npm run lint` | ESLint |

---

## 🔒 Catatan Keamanan

- Aplikasi dirancang **single-user**. Login Mode Lokal memakai sandi hash di browser —
  ini **gerbang kemudahan, bukan keamanan produksi**. Untuk keamanan sungguhan:
  aktifkan **Supabase Auth** (email + sandi) dan ganti policy RLS di `schema.sql`
  menjadi berbasis `auth.uid()`.
- Jangan publikasikan **anon key** ke aplikasi pihak lain — anon key memang aman untuk
  frontend, tetapi jangan pernah meng-expose **service_role key**.
