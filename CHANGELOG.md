# Changelog

## 0.4.0 - Operational Finance Level 1

- Menambahkan modul operasional Level 1: Pengeluaran, Donasi, Kas, Dana Pembangunan, dan Laporan Ringkas.
- Mengubah dashboard menjadi dashboard operasional: saldo kas, pemasukan bulan ini, pengeluaran bulan ini, tunggakan SPP, donasi bulan ini, pemasukan vs pengeluaran, 5 pengeluaran terbesar, dan tagihan belum lunas.
- Menambahkan sheet `cash_transactions`, `expenses`, `expense_categories`, `donations`, `donors`, dan `development_projects`.
- Menambahkan backend `Operations.gs`, `Expenses.gs`, `Donations.gs`, dan `DevelopmentFunds.gs`.
- Menambahkan pembayaran langsung `Tunai` dan `Transfer` melalui `recordDirectPayment()` selain QRIS mock/provider adapter.
- Menambahkan detail profil keuangan santri melalui `getStudentFinanceProfile()`.
- Mengubah generate tagihan agar bisa untuk semua kelas atau kelas tertentu.
- Memecah UI utama menjadi partial view per menu: Dashboard, Santri, Tagihan, Pembayaran, Tunggakan, Pengeluaran, Donasi, Kas, Dana Pembangunan, Laporan Ringkas, Akuntansi Lanjutan, dan Pengaturan.
- Menyembunyikan Jurnal dan Laporan Akuntansi dari navigasi utama ke `Mode Akuntansi` khusus Admin.

## 0.3.1 - Frontend Modularization and Operational Product Plan

- Menambahkan `docs/PRODUCT_PLAN_OPERASIONAL.md` sebagai rencana pengembangan aplikasi operasional pondok.
- Memecah `Index.html` menjadi partial Apps Script: `AppHead.html`, `AppState.html`, `AppOverlays.html`, `LoginView.html`, `MainApp.html`, `PaymentModal.html`, dan `AddSantriModal.html`.
- Menjadikan `Index.html` sebagai shell komposisi agar pengembangan menu Pengeluaran, Donasi, Kas, dan Dana Pembangunan lebih mudah.
- Memperbarui dokumentasi teknis dan README sesuai struktur frontend modular.

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
