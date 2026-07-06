# Roadmap PAP untuk Aplikasi Keuangan Pondok

Roadmap ini menerjemahkan kebutuhan Pedoman Akuntansi Pesantren (PAP) ke implementasi realistis berbasis Google Apps Script dan Google Spreadsheet.

## Prinsip Pengembangan

- Mulai dari fitur yang paling sering dipakai bendahara.
- Tetap memakai spreadsheet sebagai database utama.
- Pakai double-entry untuk transaksi akuntansi.
- Pisahkan dana terikat dan tidak terikat sejak awal.
- Buat input sederhana untuk pengguna non-akuntan.
- Laporan harus bisa ditelusuri kembali ke transaksi sumber.

## Fase 1: Fondasi Akuntansi

Tujuan fase ini adalah mengubah aplikasi dari pencatatan tagihan menjadi sistem akuntansi dasar.

Status: sebagian sudah diimplementasikan sebagai pondasi awal.

Fitur utama:

- Master akun atau chart of accounts pesantren.
- Master dana:
  - `Tidak Terikat`
  - `Terikat Sementara`
  - `Terikat Permanen`
- Periode fiskal.
- Jurnal umum.
- Baris jurnal debit/kredit.
- Buku besar per akun.
- Audit log perubahan penting.
- Posting otomatis pembayaran SPP ke jurnal.
- Menu jurnal dan laporan dasar.

Contoh posting SPP:

| Debit | Kredit |
| --- | --- |
| Kas/Bank | Pendapatan SPP |

Jika SPP dicatat sebagai piutang terlebih dahulu:

| Saat tagihan dibuat | Debit | Kredit |
| --- | --- | --- |
| Pengakuan piutang | Piutang SPP | Pendapatan SPP |

| Saat pembayaran | Debit | Kredit |
| --- | --- | --- |
| Penerimaan kas | Kas/Bank | Piutang SPP |

## Fase 2: Laporan Keuangan Wajib

Target output mengikuti arah PAP:

- Laporan Posisi Keuangan.
- Laporan Perubahan Aset Neto.
- Laporan Arus Kas.
- Catatan atas Laporan Keuangan.

Pendekatan Apps Script:

- Laporan dihitung dari `journal_lines` yang sudah balance.
- Klasifikasi laporan ditentukan oleh master akun.
- Dana terikat/tidak terikat dihitung dari kolom `fund_id`.
- CaLK dibuat sebagai ringkasan data akun, kebijakan, aset, wakaf, dan rincian transaksi penting.

## Fase 3: Modul Pesantren

Setelah fondasi akuntansi stabil, modul operasional bisa ditambahkan bertahap.

### SPP dan Tagihan

- Rekonsiliasi otomatis payment gateway.
- Virtual Account atau kanal pembayaran lain.
- WhatsApp reminder tunggakan.
- Riwayat pembayaran per santri.

### Wakaf

- Pencatatan penerimaan wakaf.
- Pemisahan aset wakaf dari aset operasional.
- Informasi nazhir, objek wakaf, nilai, dan status pemanfaatan.
- Ringkasan untuk CaLK.

### Aset Tetap

- Master aset.
- Tanggal perolehan.
- Nilai perolehan.
- Metode penyusutan sederhana.
- Beban penyusutan otomatis per periode.

### Persediaan

- Master barang.
- Stock opname.
- Mutasi antar unit.
- Penerimaan dan pengeluaran barang.
- Nilai persediaan untuk laporan.

### Bisaroh dan Penggajian

- Master ustaz/pengurus.
- Komponen bisaroh/tunjangan.
- Pembayaran berkala.
- Posting otomatis ke beban operasional dan kas/bank.

## Fase 4: UX dan Operasional

Menu target:

- Dashboard.
- Santri.
- Tagihan.
- Jurnal.
- Laporan.
- Aset.
- Pengaturan.

Peningkatan operasional:

- Validasi input lebih ketat.
- Role admin/bendahara/viewer.
- Audit log.
- Backup/export laporan.
- Template akun pesantren siap pakai.
- Panduan input transaksi harian langsung di dokumentasi.

## Batasan Desain

Aplikasi ini tidak ditujukan menjadi ERP besar pada fase awal. Sasaran utamanya adalah membantu pesantren kecil dan menengah memiliki pencatatan yang rapi, transparan, dan bisa berkembang menuju laporan standar.
