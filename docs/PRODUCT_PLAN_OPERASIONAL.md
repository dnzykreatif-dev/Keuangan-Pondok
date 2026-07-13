# Plan Produk Operasional Pondok

Dokumen ini menerjemahkan rencana perubahan aplikasi menjadi arah pengembangan bertahap. Fokus utama: pondok baru membutuhkan alat operasional harian yang sederhana, bukan tampilan software akuntansi penuh sejak awal.

## Prinsip Utama

- UI utama menjawab kebutuhan mudir dan bendahara: saldo kas, uang masuk, uang keluar, tunggakan, dan donasi.
- Akuntansi double-entry tetap berjalan di belakang layar, tetapi menu jurnal dan laporan akuntansi lengkap tidak menjadi pusat versi awal.
- Semua transaksi operasional tetap diposting ke jurnal agar aplikasi bisa naik kelas ke laporan PAP penuh saat pondok siap.
- Input harian harus memakai istilah bendahara: pembayaran, pengeluaran, donasi, kas, tagihan.

## Level 1: Dipakai Sekarang

Menu utama:

- Dashboard
- Data Santri
- Tagihan SPP
- Pembayaran
- Tunggakan
- Pengeluaran
- Donasi
- Kas
- Laporan Ringkas
- Pengaturan

Dashboard target:

- Saldo kas.
- Pemasukan bulan ini.
- Pengeluaran bulan ini.
- Tunggakan SPP.
- Donasi bulan ini.
- Grafik pemasukan vs pengeluaran.
- 5 pengeluaran terbesar.
- Tagihan SPP belum lunas.

## Modul Operasional

Santri:

- Data santri tetap dipertahankan.
- Tambahkan detail riwayat pembayaran per santri.
- Tampilkan total tunggakan per santri.

Tagihan:

- Generate tagihan semua santri.
- Generate tagihan per kelas.
- Status lunas/belum lunas tetap terhubung ke pembayaran.

Pembayaran:

- Pisahkan dari QRIS saja.
- Metode pembayaran: Tunai, Transfer, QRIS.
- Semua metode masuk ke jurnal kas dan piutang.

Pengeluaran:

- Form tambah pengeluaran: tanggal, kategori, nominal, supplier, metode bayar, keterangan, upload nota.
- Kategori awal: Dapur, Pembangunan, Gaji, Listrik, Air, Internet, Transportasi, Konsumsi, ATK, Lainnya.

Donasi:

- Donatur, nominal, jenis, status, bukti transfer.
- Jenis: Wakaf, Donasi, Infaq, Hibah, Bantuan Pemerintah.
- Status: Masuk atau Janji.

Kas:

- Tampilan sederhana: tanggal, masuk, keluar, saldo.
- Data dihitung dari transaksi operasional yang sudah diposting.

Dana Pembangunan:

- Proyek pembangunan: target anggaran, dana terkumpul, dana digunakan, sisa anggaran.
- Riwayat donasi dan pengeluaran per proyek.
- Tujuan utama: transparansi ke donatur.

## Level 2: Saat Operasional Stabil

- Anggaran.
- Persetujuan pengeluaran.
- Inventaris.
- Hutang piutang sederhana.
- Dashboard per proyek/unit.

## Level 3: Saat Data Sudah Matang

- Jurnal tampil sebagai menu admin lanjutan.
- Buku besar.
- Neraca.
- Laporan perubahan aset neto.
- Closing bulanan.
- Audit trail lanjutan.
- Penyusutan aset.

## Struktur Menu Target

```text
Dashboard

SANTRI
- Data Santri
- Tagihan SPP
- Pembayaran
- Tunggakan

KEUANGAN
- Pengeluaran
- Donasi
- Kas
- Dana Pembangunan

LAPORAN
- Ringkasan
- SPP
- Pengeluaran
- Donasi
- Arus Kas

PENGATURAN
```

## Tahap Implementasi Berikutnya

1. Sempurnakan validasi dan pengalaman input pada modul Pengeluaran, Donasi, dan Dana Pembangunan.
2. Tambahkan filter tanggal/bulan pada Laporan Ringkas.
3. Tambahkan edit/hapus terbatas dengan audit log untuk transaksi operasional.
4. Tambahkan hak akses Bendahara dan Viewer.
5. Siapkan integrasi QRIS provider nyata setelah akun PJSP/merchant tersedia.

## Status Implementasi 0.4.0

- Modularisasi frontend per view sudah dilakukan.
- Schema dan backend Pengeluaran, Donasi, Kas, dan Dana Pembangunan sudah tersedia.
- Dashboard sudah memakai data operasional.
- Jurnal dan Laporan Akuntansi disembunyikan di Mode Akuntansi Admin.
- Laporan ringkas SPP, Donasi, Pengeluaran, dan Kas sudah tersedia.
