# Manual Book Pengguna

Dokumen ini ditujukan untuk bendahara, admin, atau pengurus pondok yang menjalankan aplikasi sehari-hari.

## 1. Login

1. Buka URL Web App yang sudah diterbitkan dari Google Apps Script.
2. Masukkan username dan password.
3. Klik `Masuk ke Dashboard`.

Default awal setelah setup:

- Username: `admin`
- Password: `admin123`

Segera ubah password default pada pengembangan berikutnya atau melalui data sheet `users` dengan password hash yang sesuai.

## 2. Dashboard

Dashboard menampilkan ringkasan:

- Total pendapatan dari transaksi sukses.
- Total tunggakan dari tagihan berstatus `Belum Lunas`.
- Jumlah santri aktif.

Gunakan dashboard sebagai pemeriksaan cepat kondisi pembayaran SPP.

## 3. Data Santri

Menu `Data Santri` digunakan untuk melihat dan menambah data santri.

### Menambah Santri

1. Buka menu `Data Santri`.
2. Klik `Tambah Santri`.
3. Isi:
   - Nama lengkap.
   - Kelas.
   - Nomor WhatsApp orang tua/wali.
4. Klik `Simpan`.

Nomor WhatsApp sebaiknya memakai format internasional Indonesia, contoh `6281234567890`.

## 4. Membuat Tagihan Bulanan

Menu `Tagihan` digunakan untuk membuat tagihan SPP massal.

1. Buka menu `Tagihan`.
2. Pilih bulan.
3. Isi tahun.
4. Isi nominal SPP.
5. Klik `Generate for All Active Santri`.
6. Konfirmasi pembuatan tagihan.

Sistem hanya membuat tagihan baru untuk santri aktif yang belum memiliki tagihan pada bulan dan tahun yang sama.

## 5. Pembayaran SPP

Pembayaran bisa dimulai dari menu `Data Santri`.

1. Buka menu `Data Santri`.
2. Pilih santri.
3. Klik `Bayar SPP`.
4. Pilih tagihan yang belum lunas.
5. Klik `Confirm`.
6. Selesaikan pembayaran melalui popup Midtrans Snap.

Jika pembayaran berhasil dan webhook Midtrans berjalan, status tagihan akan berubah menjadi `Lunas`.

## 6. Kirim Link Pembayaran

Fitur `Kirim Link` membuat transaksi Midtrans untuk tagihan belum lunas paling awal, lalu membuka WhatsApp Web atau aplikasi WhatsApp.

1. Buka menu `Data Santri`.
2. Klik `Kirim Link` pada santri terkait.
3. Periksa pesan WhatsApp.
4. Kirim pesan ke wali santri.

Jika tidak ada tagihan belum lunas, sistem akan menampilkan pesan error.

## 7. Rekap Tunggakan

Menu `Rekap Tunggakan` menampilkan daftar tagihan yang belum lunas.

Fitur yang tersedia:

- Filter berdasarkan kelas.
- Nominal tunggakan per tagihan.
- Tombol pengingat WhatsApp.

Gunakan menu ini untuk penagihan rutin mingguan atau bulanan.

## 8. Jurnal

Menu `Jurnal` menampilkan posting otomatis dari aktivitas SPP.

Jurnal yang muncul saat ini:

- Tagihan SPP: debit `Piutang SPP`, kredit `Pendapatan SPP`.
- Pembayaran sukses: debit `Kas/Bank`, kredit `Piutang SPP`.

Kolom `Status` harus menunjukkan `Balance`. Jika ada jurnal tidak balance, jangan jadikan laporan sebagai acuan sebelum data diperiksa.

## 9. Laporan

Menu `Laporan` menampilkan ringkasan awal dari jurnal double-entry.

Isi laporan:

- Kas/Bank.
- Piutang SPP.
- Total debit.
- Total kredit.
- Status balance.
- Neraca saldo.
- Ringkasan aset neto berdasarkan dana.

Fitur ini adalah pondasi awal menuju laporan PAP lengkap.

## 10. Pengaturan Profil

Menu `Pengaturan` digunakan untuk mengubah identitas lembaga.

### Mengubah Nama Pesantren

1. Buka `Pengaturan`.
2. Isi nama pesantren.
3. Klik `Simpan`.

### Mengubah Logo

1. Buka `Pengaturan`.
2. Pilih file logo.
3. Tunggu proses upload selesai.

Logo disimpan di Google Drive dan link-nya dicatat ke sheet `settings`.

## 11. Kebiasaan Operasional Yang Disarankan

- Generate tagihan pada awal bulan.
- Cek rekap tunggakan minimal sekali seminggu.
- Pastikan nomor WhatsApp wali santri benar.
- Rekonsiliasi transaksi Midtrans dengan dashboard Midtrans.
- Cek menu `Jurnal` setelah generate tagihan dan pembayaran.
- Cek menu `Laporan` sebelum membuat rekap keuangan internal.
- Backup spreadsheet secara berkala.

## 12. Batasan Versi Saat Ini

- Belum ada laporan akuntansi PAP lengkap.
- Belum ada validasi sesi server-side.
- Belum ada input jurnal manual, buku besar detail, aset, wakaf, persediaan, atau bisaroh.
- Midtrans masih diarahkan ke endpoint sandbox.
