# Changelog

## 0.3.0 - QRIS Adapter and PAP Expansion

- Menghapus integrasi pembayaran lama dan menggantinya dengan payment order QRIS berbasis adapter provider.
- Menambahkan provider default `MOCK_QRIS` untuk simulasi tanpa akun PJSP.
- Menambahkan fondasi adapter `DUITKU` yang bisa diaktifkan lewat Script Properties.
- Menambahkan sheet `payment_providers`, `payment_orders`, `payment_events`, dan `reconciliation_logs`.
- Menambahkan dimensi `units` dan `programs`.
- Memperluas chart of accounts pesantren untuk kas, piutang, persediaan, aset tetap, wakaf, utang, pendapatan, beban, dan aset neto.
- Menambahkan fungsi posting jurnal untuk kas masuk/keluar, donasi, wakaf, aset, penyusutan, persediaan, dan bisaroh.
- Menambahkan data laporan posisi keuangan, arus kas, dan CaLK dasar.
- Menambahkan menu `Pembayaran QRIS` di frontend.
- Memperbarui README dan dokumentasi agar selaras dengan arah QRIS dan sistem keuangan pesantren.

## 0.2.0 - PAP Accounting Foundation

- Menambahkan sheet akuntansi: `accounts`, `funds`, `fiscal_periods`, `journal_entries`, `journal_lines`, dan `audit_logs`.
- Menambahkan posting jurnal double-entry untuk tagihan dan pembayaran SPP.
- Menambahkan menu jurnal dan laporan dasar.
- Menambahkan seed akun dan dana default.

## 0.1.0 - Modular App Foundation

- Memecah kode Apps Script menjadi modul backend.
- Menambahkan login, data santri, tagihan, rekap tunggakan, pengaturan profil, dan dashboard awal.
- Menambahkan dokumentasi awal dan setup clasp.
