# NaysIn — Sistem Digital Manajemen Stok & Asisten Menu AI Nays Kopi

NaysIn adalah platform internal digital untuk pengelolaan inventaris bahan baku, pencegahan waste kedaluwarsa, pemantauan stok menipis, serta asisten informasi menu berbasis AI yang dirancang khusus untuk operasional **Nays Kopi**.

Aplikasi ini dibangun menggunakan arsitektur **Next.js App Router** full-stack dengan target hosting serverless pada **Netlify** dan basis data terkelola **PostgreSQL** melalui **Prisma ORM**.

---

## 🚀 Fitur Utama

1. **Dashboard Stok & Peringatan Otomatis (Real-time):**
   - Perhitungan stok otomatis saat pemanggilan (request-time deterministic alerts).
   - Indikator peringatan bahan baku di bawah batas minimum (*low-stock alerts*).
   - Pemantauan batch bahan baku yang mendekati atau telah melewati masa kedaluwarsa (*expiry tracking*).

2. **Buku Besar Stok Digital (Immutable Double-Entry Ledger):**
   - Transaksi mutasi stok atomik: Masuk (`IN`), Keluar (`OUT`), Opname Fisik (`ADJUSTMENT`), dan Terbuang (`WASTE`).
   - Pencegahan saldo negatif (penolakan transaksi seketika jika kuantitas melebihi saldo).
   - Dukungan *Idempotency Keys* untuk mencegah pencatatan ganda saat jaringan tidak stabil.
   - Audit trail lengkap mencatat pengguna, waktu, saldo sebelum, dan saldo sesudah.

3. **Master Bahan Baku & Menu Terverifikasi:**
   - Hak akses berjenjang berbasis peran (*Role-Based Access Control* / RBAC): **OWNER** dan **STAFF**.
   - Master bahan baku dengan unit pengukuran operasional (`gram`, `ml`, `pcs`, `sachet`).
   - Master menu resmi dengan sinonim/alias informal pelanggan (misalnya pencarian "Kopi Nays" &rarr; penjelasan resmi "Kopi Gula Aren").

4. **Asisten Menu AI Terverifikasi (Zero-Hallucination & Grounded):**
   - Menjawab pertanyaan pelanggan hanya berdasarkan menu aktif dan terverifikasi di database.
   - Tidak mengarang harga, resep, atau alergen yang belum tercatat resmi (safe fallback ke barista).
   - Akurasi evaluasi mencapai **93.3%** pada benchmark dataset uji.

5. **Adapter Resmi WhatsApp Cloud API (Modular):**
   - Endpoint webhook dengan verifikasi challenge token Meta.
   - Validasi tanda tangan kriptografi HMAC-SHA256 untuk keamanan data.
   - Deduplikasi pesan masuk berbasis `externalMessageId` untuk mencegah duplikasi balasan.

---

## 🛠️ Stack Teknologi

- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Styling:** Tailwind CSS 4 & Lucide Icons
- **Database & ORM:** PostgreSQL terkelola eksternal & Prisma ORM 6
- **Autentikasi:** JWT Session Cookies (`jose`, `bcryptjs`)
- **Testing:** Vitest & Node environment
- **Hosting & Runtime:** Netlify Next.js OpenNext Serverless Runtime

---

## 📦 Panduan Instalasi & Pengembangan Lokal

### 1. Clone & Pasang Dependensi
```bash
git clone <url-repository>
cd Naysin
npm install --legacy-peer-deps
```

### 2. Konfigurasi Environment Variables
Salin berkas konfigurasi dari `.env.example`:
```bash
cp .env.example .env
```
Sesuaikan nilai `DATABASE_URL` dan `AUTH_SECRET` di berkas `.env`.

### 3. Generate Prisma & Jalankan Migrasi
```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Jalankan Pengujian Otomatis
```bash
# Menjalankan seluruh unit test dan evaluasi akurasi AI
npx vitest run
```

### 5. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka browser pada `http://localhost:3000`.

---

## 🌐 Panduan Deployment ke Netlify

1. Hubungkan repository GitHub ke Netlify Dashboard.
2. Netlify secara otomatis mendeteksi konfigurasi pada `netlify.toml` (`npm run build`).
3. Tambahkan environment variables di Netlify Site Settings (`DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `LLM_API_KEY`).
4. Panduan lengkap dan langkah pemulihan bencana dapat dibaca pada [NETLIFY_DEPLOYMENT_RUNBOOK.md](file:///c:/KULIAH/PROJECT/Naysin/docs/NETLIFY_DEPLOYMENT_RUNBOOK.md).

---

## 📋 Akun Uji Demo

Untuk keperluan demonstrasi awal dan UAT:
- **Owner:** `owner@nayskopi.demo` (Password: `naysin2026`)
- **Staff:** `staff@nayskopi.demo` (Password: `naysin2026`)
