# Keuangan Pondok

Aplikasi administrasi keuangan pondok pesantren berbasis Google Apps Script dan Google Spreadsheet. Versi saat ini berfokus pada pengelolaan santri, tagihan SPP, rekap tunggakan, pembayaran Midtrans, pengaturan profil, dan pondasi kode modular agar aplikasi mudah dikembangkan menjadi sistem akuntansi pesantren yang mengikuti arah Pedoman Akuntansi Pesantren (PAP).

## Status Produk

Versi ini adalah fondasi teknis awal. Aplikasi sudah dapat dipakai untuk alur operasional SPP sederhana, tetapi belum menjadi sistem akuntansi double-entry penuh. Roadmap pengembangan berikutnya memprioritaskan chart of accounts, jurnal umum, buku besar, dana terikat/tidak terikat, dan laporan keuangan wajib pesantren.

## Fitur Saat Ini

- Login admin berbasis data sheet `users`.
- Master data santri.
- Generate tagihan bulanan untuk semua santri aktif.
- Rekap tunggakan berdasarkan tagihan belum lunas.
- Pembayaran melalui Midtrans Snap sandbox.
- Webhook Midtrans untuk mengubah tagihan menjadi `Lunas`.
- Fondasi akuntansi double-entry untuk posting tagihan dan pembayaran SPP.
- Menu jurnal dan laporan dasar dari data jurnal.
- Pengaturan nama lembaga dan logo.
- Struktur backend modular per domain.

## Struktur File

- `Code.gs`: entrypoint web app dan helper include HTML.
- `Config.gs`: konfigurasi aplikasi, header sheet, dan konstanta bulan.
- `Utils.gs`: helper spreadsheet, sheet, ID, normalisasi data, dan Script Properties.
- `Setup.gs`: setup database dan import awal santri.
- `Auth.gs`: login.
- `Santri.gs`: data santri dan tagihan santri.
- `Billing.gs`: dashboard, generate tagihan, dan rekap tunggakan.
- `Payment.gs`: Midtrans, link pembayaran, transaksi pending, dan webhook.
- `Accounting.gs`: master akun/dana, posting jurnal, audit log, dan neraca saldo.
- `Reports.gs`: data laporan akuntansi dasar.
- `Settings.gs`: pengaturan aplikasi dan upload logo.
- `Index.html`: frontend Alpine.js + Tailwind CSS.
- `docs/`: dokumentasi pengguna, teknis, deployment, dan roadmap PAP.

## Setup Singkat

1. Buat atau siapkan Google Spreadsheet.
2. Salin ID spreadsheet ke `APP_CONFIG.SPREADSHEET_ID` di `Config.gs`.
3. Buat project Google Apps Script dari spreadsheet tersebut.
4. Upload semua file `.gs` dan `Index.html`.
5. Isi Script Properties:
   - `MIDTRANS_SERVER_KEY`
   - `MIDTRANS_CLIENT_KEY`
6. Jalankan `setupDatabase()` dari Apps Script Editor.
7. Deploy sebagai Web App.
8. Login default:
   - Username: `admin`
   - Password: `admin123`

Ganti password admin setelah setup awal.

## Dokumentasi Lanjutan

- Panduan pengguna: `docs/MANUAL_BOOK.md`
- Spesifikasi teknis: `docs/TECHNICAL_SPEC.md`
- Deployment: `docs/DEPLOYMENT_GUIDE.md`
- Roadmap PAP: `docs/ROADMAP_PAP.md`
- Riwayat perubahan: `CHANGELOG.md`

## Catatan Keamanan

Aplikasi ini masih memakai localStorage untuk status login di frontend. Untuk penggunaan produksi, tahap berikutnya perlu menambahkan validasi sesi dan otorisasi di sisi server untuk semua fungsi sensitif.

## Roadmap Ringkas

- Fase 1: fondasi akuntansi double-entry.
- Fase 2: empat laporan wajib PAP.
- Fase 3: modul pesantren seperti wakaf, aset, persediaan, dan bisaroh.
- Fase 4: UX operasional, audit log, dan template akun siap pakai.
