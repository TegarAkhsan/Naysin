# Runbook Deployment Netlify & Operasional NaysIn
**Aplikasi:** NaysIn — Sistem Manajemen Stok & Asisten Menu AI Nays Kopi  
**Target Deployment:** Netlify (OpenNext Next.js Runtime)  
**Dokumen:** SOP Rilis, Pemeliharaan, dan Pemulihan Bencana (Disaster Recovery)

---

## 1. Panduan Menghubungkan Repository ke Netlify

1. **Persiapan Repository Git:**
   - Pastikan seluruh perubahan kode telah di-commit ke remote repository (GitHub / GitLab / Bitbucket).
   - Pastikan branch default diatur ke `main` (atau `master`).

2. **Langkah Import di Netlify Dashboard:**
   - Buka [app.netlify.com](https://app.netlify.com) dan login.
   - Klik **"Add new site"** &rarr; **"Import an existing project"**.
   - Pilih penyedia Git Anda dan pilih repository `Naysin`.
   - Konfigurasi Build Settings terdeteksi secara otomatis dari `netlify.toml`:
     - **Base directory:** (biarkan kosong / root)
     - **Build command:** `npm run build`
     - **Publish directory:** (biarkan kosong; Netlify Next.js runtime otomatis mengelola SSR dan asset statis)
     - **Package:** Netlify secara otomatis mendeteksi plugin `@netlify/plugin-nextjs`.

3. **Deploy Previews:**
   - Setiap Pull Request / branch baru otomatis menghasilkan URL unik **Deploy Preview** untuk peninjauan fitur sebelum merge ke production.
   - Data pada Deploy Preview wajib menggunakan database pengujian (staging) terpisah.

---

## 2. Manajemen Environment Variables di Netlify

Buka menu **Site configuration** &rarr; **Environment variables** pada dashboard Netlify. Masukkan variabel berikut:

| Nama Variabel | Deskripsi | Rekomendasi Nilai / Format |
| :--- | :--- | :--- |
| `DATABASE_URL` | Koneksi PostgreSQL terkelola (pooled) | `postgresql://user:pass@pooler.neon.tech/naysin?sslmode=require&pgbouncer=true` |
| `DIRECT_URL` | Koneksi langsung untuk Prisma Migrate | `postgresql://user:pass@ep-xyz.neon.tech/naysin?sslmode=require` |
| `AUTH_SECRET` | Secret key signing JWT session (32+ char) | String acak 32 karakter aman |
| `LLM_API_KEY` | API Key server-side Gemini / OpenAI | Kredensial penyedia AI resmi |
| `LLM_MODEL` | Model AI teruji | `gemini-1.5-flash` |
| `WHATSAPP_PHONE_NUMBER_ID` | ID nomor Meta Business Cloud API | Diisi saat verifikasi WhatsApp selesai |
| `WHATSAPP_ACCESS_TOKEN` | System User Permanent Token | Diisi saat verifikasi WhatsApp selesai |
| `WHATSAPP_VERIFY_TOKEN` | Token verifikasi webhook challenge | String unik untuk webhook callback |
| `WHATSAPP_APP_SECRET` | App Secret Meta untuk verifikasi HMAC | Diisi saat verifikasi WhatsApp selesai |
| `NEXT_PUBLIC_APP_URL` | URL publik resmi aplikasi | `https://naysin.netlify.app` |

> **PERINGATAN KEAMANAN:**
> 1. Jangan pernah menyematkan prefix `NEXT_PUBLIC_` pada token rahasia (`DATABASE_URL`, `AUTH_SECRET`, API keys).
> 2. Perubahan environment variable di Netlify **memerlukan Trigger Deploy baru** agar diterapkan pada fungsi serverless.

---

## 3. Langkah Migrasi Database & Seeding Terkendali

Jalankan perintah migrasi dan seed secara terkendali dari terminal operator/CI release step:

```bash
# 1. Menjalankan migrasi database ke schema production
npx prisma migrate deploy

# 2. Menjalankan seeding data awal (termasuk DEMO dan basis pengetahuan menu)
npx tsx prisma/seed.ts
```

---

## 4. Pengujian Smoke Test Pasca-Deploy (Checklist Rilis)

Setelah build Netlify sukses dan URL produksi aktif, lakukan verifikasi:
- [ ] Akses halaman `/login`, pastikan redirect berjalan mulus.
- [ ] Login menggunakan akun owner dan staf.
- [ ] Masuk ke `/dashboard`, periksa apakah kartu KPI dan peringatan stok tampil tanpa error.
- [ ] Buat mutasi stok baru di `/stock/new` (uji stok IN dan OUT).
- [ ] Verifikasi bahwa stok tidak dapat dikurangi melebihi saldo yang ada (409 Conflict).
- [ ] Buka `/assistant/test`, uji pertanyaan menu ("Berapa harga Kopi Nays?", "Apakah ada pizza?").
- [ ] Unduh laporan CSV di `/reports` dan periksa kelengkapan datanya.

---

## 5. Prosedur Rollback & Pemulihan Cadangan Database

### Rollback Versi Aplikasi (Netlify):
1. Buka dashboard Netlify &rarr; **Deploys**.
2. Cari versi deploy sebelumnya yang berstatus sukses/stabil.
3. Klik tombol **"Publish deploy"**. Netlify akan segera mengarahkan trafik CDN dan serverless functions ke versi tersebut secara instan tanpa downtime.

### Backup & Restore PostgreSQL:
- **Pencadangan Otomatis:** Pastikan fitur *Point-in-Time Recovery (PITR)* atau snapshot harian pada penyedia managed PostgreSQL (Neon/Supabase) aktif.
- **Pencadangan Manual (CLI):**
  ```bash
  pg_dump "$DIRECT_URL" -Fc -f "naysin_backup_$(date +%Y%m%d_%H%M%S).dump"
  ```
- **Pemulihan Cadangan (Restore):**
  ```bash
  pg_restore -d "$DIRECT_URL" --clean --no-owner "naysin_backup_YYYYMMDD_HHMMSS.dump"
  ```

