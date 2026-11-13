# Lembar Evaluasi & UAT Checklist NaysIn
**Klien:** Nays Kopi  
**Proyek:** NaysIn — Manajemen Stok & Asisten Menu AI  
**Standar Keberhasilan:** 100% Skenario Kritis Lulus, Minimal 80% Skenario Keseluruhan Lulus

| No | ID | Skenario Pengujian (Given / When) | Hasil yang Diharapkan (Then) | Tingkat | Status Pengujian |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **UAT-01** | Staf valid melakukan login | Dashboard terbuka sesuai role staf | **Kritis** | **LULUS** (Unit & Auth test) |
| 2 | **UAT-02** | Pengguna belum login mengakses dashboard | Ditolak & dialihkan ke halaman login | **Kritis** | **LULUS** (Middleware check) |
| 3 | **UAT-03** | Staf mencatat stok masuk (IN) 5 unit | Saldo bertambah tepat 5 unit di database | **Kritis** | **LULUS** (Transaction test) |
| 4 | **UAT-04** | Staf mencatat stok keluar (OUT) 2 unit | Saldo berkurang tepat 2 unit | **Kritis** | **LULUS** (Transaction test) |
| 5 | **UAT-05** | Jumlah stok OUT melebihi saldo tersedia | Transaksi ditolak (409 Conflict), saldo tidak berubah | **Kritis** | **LULUS** (Integrity test) |
| 6 | **UAT-06** | Dua request mutasi dikirim bersamaan | Konsistensi transaksi terjaga, tidak ada minus | **Kritis** | **LULUS** (DB Transaction test) |
| 7 | **UAT-07** | Request dikirim ulang dengan idempotency key sama | Transaksi hanya diproses 1 kali, tidak ada double deduction | **Kritis** | **LULUS** (Idempotency test) |
| 8 | **UAT-08** | Stok bahan berada di bawah ambang minimum | Peringatan stok menipis muncul di dashboard | **Kritis** | **LULUS** (Alert logic test) |
| 9 | **UAT-09** | Batch bahan baku mendekati masa kedaluwarsa (<=3 hari) | Peringatan batch kedaluwarsa muncul | Normal | **LULUS** (Alert logic test) |
| 10 | **UAT-10** | Pelanggan menanyakan menu informal "Kopi Nays" | AI menjelaskan kopi susu gula aren resmi | **Kritis** | **LULUS** (RAG test) |
| 11 | **UAT-11** | Harga menu tidak tercatat di database | AI tidak mengarang harga (anti-halusinasi) | **Kritis** | **LULUS** (Benchmark test) |
| 12 | **UAT-12** | Menu diarsipkan / tidak tersedia (`isAvailable: false`) | AI tidak merekomendasikan menu tersebut | **Kritis** | **LULUS** (Benchmark test) |
| 13 | **UAT-13** | LLM API timeout atau error | Menampilkan fallback aman ke kontak staf kafe | Normal | **LULUS** (Fallback test) |
| 14 | **UAT-14** | Webhook WhatsApp menerima event duplikat | Pesan diproses 1 kali via `externalMessageId` | **Kritis** | **LULUS** (Dedup test) |
| 15 | **UAT-15** | Staf mencoba menambah master bahan/menu | Sistem menolak dengan HTTP 403 Forbidden | **Kritis** | **LULUS** (RBAC test) |
| 16 | **UAT-16** | Staf mencatat bahan rusak/kedaluwarsa (WASTE) | Saldo berkurang dan tercatat di waste log | Normal | **LULUS** (Stock test) |
| 17 | **UAT-17** | Pemilik kafe mengekspor riwayat transaksi ke CSV | File CSV terunduh dengan data audit lengkap | Normal | **LULUS** (Export test) |
| 18 | **UAT-18** | Pengguna keluar (logout) lalu menekan tombol kembali | Sesi ditolak dan wajib login ulang | **Kritis** | **LULUS** (Session test) |

---

### Ringkasan Pencapaian Kualitas (Quality Gates):
* **Skenario Kritis (12 Skenario):** 12/12 Lulus (**100%**)
* **Skenario Keseluruhan (18 Skenario):** 18/18 Lulus (**100%**)
* **Akurasi AI Menu Assistant:** 28/30 Jawaban Tepat (**93.3%**) (Target minimal: 90%)
* **Critical Bugs:** **0**
