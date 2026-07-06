# Changelog

## 0.1.0 - Initial Modular Foundation

### Added

- Struktur backend modular untuk Apps Script:
  - `Code.gs`
  - `Config.gs`
  - `Utils.gs`
  - `Setup.gs`
  - `Auth.gs`
  - `Santri.gs`
  - `Billing.gs`
  - `Payment.gs`
  - `Settings.gs`
- Dokumentasi produk:
  - `README.md`
  - `docs/MANUAL_BOOK.md`
  - `docs/TECHNICAL_SPEC.md`
  - `docs/ROADMAP_PAP.md`
  - `docs/DEPLOYMENT_GUIDE.md`
- Konfigurasi Midtrans melalui Script Properties.
- Fungsi kompatibilitas `processPayment()` untuk alur lama.

### Changed

- `Index.html` dirapikan agar hanya memiliki satu fungsi `app()`.
- Flow pembayaran frontend diarahkan ke `createMidtransTransaction()`.
- Struktur sheet `transactions` memakai kolom `status` untuk status pembayaran.
- Perhitungan dashboard hanya menghitung transaksi dengan status sukses sebagai pendapatan.

### Fixed

- Menghapus duplikasi state frontend yang sebelumnya membuat behavior saling menimpa.
- Menambahkan `generatePaymentLink()` agar tombol kirim link WhatsApp punya backend yang sesuai.
- Webhook Midtrans sekarang menerima `settlement` sebagai pembayaran sukses.

### Known Limitations

- Autentikasi belum memakai sesi server-side.
- Belum ada role-based access control.
- Belum ada laporan PAP double-entry.
- Endpoint Midtrans masih sandbox.
