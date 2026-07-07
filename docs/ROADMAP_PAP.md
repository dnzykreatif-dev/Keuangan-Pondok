# Roadmap PAP Keuangan Pondok

Roadmap ini menempatkan PAP sebagai fondasi sistem, QRIS sebagai kanal pembayaran, dan modul pesantren sebagai perluasan bertahap.

## Fase 1: Fondasi Akuntansi

Status: berjalan.

- Chart of accounts pesantren.
- Dana tidak terikat, terikat sementara, dan terikat permanen.
- Unit dan program sebagai dimensi ringan.
- Jurnal double-entry.
- Neraca saldo.
- Audit log.
- Posting otomatis tagihan dan pembayaran.

## Fase 2: Payment Order QRIS

Status: fondasi adapter tersedia.

- Payment order provider-agnostic.
- Mock QRIS untuk simulasi.
- Adapter Duitku sebagai contoh awal.
- Callback idempotent.
- Event log dan reconciliation log.
- WhatsApp link untuk wali santri.

## Fase 3: Laporan PAP

Target:

- Laporan Posisi Keuangan.
- Laporan Perubahan Aset Neto.
- Laporan Arus Kas.
- Catatan atas Laporan Keuangan.

Pendekatan:

- Semua laporan dihitung dari jurnal.
- Fund digunakan untuk memisahkan aset neto.
- Unit/program dipakai untuk analisis internal.
- CaLK dihasilkan dari akun, dana, aset, wakaf, dan transaksi material.

## Fase 4: Modul Pesantren

- Wakaf: objek, nilai, nazhir, status pemanfaatan, dan laporan ringkas.
- Aset: master aset, lokasi, nilai, penyusutan.
- Persediaan: barang, stok masuk/keluar, stock opname, unit usaha.
- Bisaroh: master penerima, komponen, pembayaran, dan posting beban.
- Unit usaha: kantin, koperasi, minimarket, atau usaha lain.
- Kas umum: kas masuk/keluar non-SPP.

## Fase 5: UX dan Operasional

- Role admin, bendahara, operator, viewer.
- Validasi input lebih ketat.
- Export laporan.
- Backup otomatis.
- Dashboard per unit/program.
- Template transaksi harian untuk pengguna non-akuntan.

## Prinsip

- Spreadsheet tetap menjadi database fase awal-menengah.
- Semua transaksi penting harus bisa ditelusuri ke jurnal.
- Fitur baru tidak boleh menghapus data lama.
- Pengurus non-akuntan harus bisa menjalankan alur harian tanpa memahami debit/kredit secara mendalam.
