# Fitur Aplikasi Keuangan Pondok

Dokumen ini menjelaskan fitur yang sudah tersedia pada aplikasi Keuangan Pondok saat ini. Fokusnya adalah membantu pengurus memahami apa saja yang bisa dipakai langsung, apa yang berjalan di belakang layar, dan bagaimana setiap modul saling terhubung.

## Gambaran Umum

Aplikasi ini dibangun sebagai sistem keuangan pesantren berbasis Google Apps Script dan Google Spreadsheet. Saat ini aplikasi sudah mencakup:

- Operasional keuangan harian.
- Pencatatan SPP dan tunggakan.
- Pembayaran Tunai, Transfer, dan QRIS.
- Pengeluaran, donasi, kas, dan dana pembangunan.
- Laporan aktivitas berbasis jurnal.
- Fondasi akuntansi double-entry.
- Laporan PAP dasar di mode admin lanjutan.

## Prinsip Utama Aplikasi

- Data operasional dicatat dulu agar bendahara bisa bekerja cepat.
- Setiap transaksi penting tetap diposting ke jurnal agar akuntansi tetap rapi.
- UI utama dibuat sederhana untuk pengurus non-akuntan.
- Menu jurnal dan laporan akuntansi lengkap tetap tersedia, tetapi disembunyikan di `Mode Akuntansi` untuk Admin.

## Fitur Yang Sudah Ada

### 1. Login dan Akses Dasar

- Login admin memakai sheet `users`.
- Default login awal tersedia saat `setupDatabase()` dijalankan.
- Status login disimpan di browser dengan `localStorage`.
- Menu admin lanjutan hanya muncul untuk role `Admin`.

### 2. Dashboard

Dashboard menampilkan ringkasan operasional harian:

- Saldo kas.
- Pemasukan bulan ini.
- Pengeluaran bulan ini.
- Total tunggakan SPP.
- Donasi bulan ini.
- Perbandingan pemasukan vs pengeluaran.
- 5 pengeluaran terbesar.
- Tagihan SPP yang belum lunas.

Fungsi dashboard adalah memberi gambaran cepat kondisi pondok tanpa perlu membuka sheet mentah.

### 3. Data Santri

Modul ini dipakai untuk mengelola data santri.

Fitur:

- Melihat daftar santri.
- Menambah santri baru.
- Melihat detail dan riwayat keuangan santri.
- Membuka detail pembayaran per santri.
- Membuat pembayaran langsung dari kartu santri.
- Membuat link/QRIS pembayaran.

Data yang ditampilkan:

- ID santri.
- Nama.
- Kelas.
- Status aktif.
- Kontak orang tua.

### 4. Profil Keuangan Santri

Setiap santri memiliki profil keuangan tersendiri.

Profil ini menampilkan:

- Identitas santri.
- Daftar tagihan per periode.
- Status lunas atau belum lunas.
- Total tunggakan santri.

Fitur ini berguna untuk tracking tunggakan dan komunikasi ke wali santri.

### 5. Tagihan SPP

Modul tagihan dipakai untuk membuat tagihan bulanan SPP.

Fitur:

- Generate tagihan untuk semua santri aktif.
- Generate tagihan untuk kelas tertentu.
- Hindari duplikasi tagihan pada periode yang sama.
- Tetap menyimpan dimensi dana, unit, dan program.

Saat tagihan dibuat, sistem juga melakukan posting jurnal otomatis:

- Debit Piutang SPP.
- Kredit Pendapatan SPP.

### 6. Pembayaran

Modul pembayaran menangani beberapa metode:

- Tunai.
- Transfer.
- QRIS.

Alur yang sudah ada:

- Pembayaran langsung untuk Tunai/Transfer.
- Pembuatan payment order untuk QRIS.
- Callback pembayaran agar order menjadi lunas.
- Proteksi idempotent supaya callback berulang tidak membuat jurnal dobel.

Data pembayaran yang tercatat:

- ID transaksi.
- Santri.
- Tagihan.
- Tanggal.
- Nominal.
- Metode pembayaran.
- Status.
- Penerima.

### 7. QRIS Dinamis

QRIS disiapkan sebagai payment order yang bisa memakai provider mock atau provider nyata.

Fitur:

- Mock QRIS untuk simulasi.
- Adapter provider yang bisa diganti.
- Pembuatan invoice/order QRIS.
- Callback dan verifikasi signature.
- Riwayat payment order.

Fitur ini cocok untuk pesantren yang ingin memakai QRIS tanpa mengunci diri ke satu vendor.

### 8. Tunggakan

Modul tunggakan menampilkan semua tagihan yang belum lunas.

Fitur:

- Rekap tunggakan keseluruhan.
- Filter berdasarkan kelas.
- Tampilan ringkas daftar santri menunggak.
- Siap dipakai sebagai dasar pengingat atau follow-up ke wali santri.

### 9. Pengeluaran

Modul pengeluaran dipakai untuk mencatat uang keluar harian.

Fitur:

- Input tanggal.
- Input kategori.
- Input nominal.
- Input supplier/penerima.
- Pilih metode bayar.
- Isi keterangan.
- Upload bukti pembayaran atau nota.
- Hubungkan pengeluaran ke proyek pembangunan bila relevan.

Kategori pengeluaran awal sudah disediakan, misalnya:

- Dapur.
- Pembangunan.
- Gaji.
- Listrik.
- Air.
- Internet.
- Transportasi.
- Konsumsi.
- ATK.
- Lainnya.

Pengeluaran otomatis masuk ke buku kas dan jurnal.

### 10. Donasi

Modul donasi dipakai untuk mencatat pemasukan non-SPP.

Fitur:

- Input nama donatur.
- Input nomor HP.
- Pilih jenis donasi.
- Pilih status `Masuk` atau `Janji`.
- Input nominal.
- Input metode pembayaran.
- Input keterangan.
- Upload bukti transfer atau dokumen.
- Hubungkan ke proyek pembangunan bila relevan.

Jenis donasi yang sudah dikenali:

- Wakaf.
- Donasi.
- Infaq.
- Hibah.
- Bantuan Pemerintah.

Jika statusnya `Janji`, data dicatat tanpa menambah kas.

### 11. Buku Kas Operasional

Modul kas menampilkan transaksi uang masuk dan keluar.

Fitur:

- Riwayat kas masuk.
- Riwayat kas keluar.
- Saldo kas berjalan.
- Sumber transaksi kas.
- Hubungan dengan pembayaran, donasi, atau pengeluaran.

Modul ini menjadi tampilan paling praktis untuk bendahara yang ingin melihat posisi kas aktual.

### 12. Dana Pembangunan

Modul ini dipakai untuk proyek pembangunan pondok.

Fitur:

- Buat proyek pembangunan baru.
- Tetapkan target anggaran.
- Catat deskripsi proyek.
- Lihat dana terkumpul.
- Lihat dana terpakai.
- Lihat sisa target.
- Lihat progress proyek dalam persentase.

Data ini membantu transparansi ke donatur dan pengurus.

### 13. Laporan Ringkas

Laporan ringkas adalah laporan operasional yang paling mudah dibaca oleh pengurus.

Isi laporan:

- Ringkasan SPP.
- Ringkasan donasi.
- Ringkasan pengeluaran.
- Ringkasan kas.

Laporan ini cocok untuk rapat internal dan monitoring rutin.

### 14. Laporan Aktivitas

Laporan aktivitas sudah tersedia sebagai laporan PAP yang lebih formal.

Fitur:

- Filter bulan dan tahun.
- Total penghasilan periode.
- Total beban periode.
- Surplus atau defisit periode.
- Rincian penghasilan per akun.
- Rincian beban per akun.
- Jumlah jurnal pada periode tersebut.

Laporan ini dihitung dari jurnal yang sudah diposting, sehingga lebih dekat ke format akuntansi pesantren yang sesungguhnya.

### 15. Mode Akuntansi

Mode ini ditujukan untuk Admin atau pengelola yang memahami akuntansi dasar.

Fitur:

- Melihat jurnal.
- Melihat laporan akuntansi.
- Melihat neraca saldo.
- Melihat ringkasan posisi keuangan.
- Melihat aset neto per dana.
- Melihat arus kas operasi, investasi, dan pendanaan.
- Melihat CaLK dasar.

Mode ini tidak ditonjolkan di menu utama agar tidak membingungkan pengguna harian.

### 16. Akuntansi Double-Entry

Di belakang layar, aplikasi sudah menyiapkan fondasi akuntansi lengkap.

Fitur:

- Master akun.
- Master dana.
- Master unit.
- Master program.
- Periode fiskal.
- Jurnal header.
- Jurnal lines.
- Audit log.
- Validasi jurnal balance.
- Posting jurnal otomatis dari transaksi operasional.

Ini adalah fondasi untuk naik ke implementasi PAP yang lebih lengkap.

### 17. Laporan PAP Dasar

Backend akuntansi sudah menyiapkan laporan formal berikut:

- Laporan Posisi Keuangan.
- Ringkasan aset neto per dana.
- Arus kas.
- Catatan atas laporan keuangan dasar.

Saat ini laporan tersebut masih lebih cocok sebagai mode lanjutan/admin, sedangkan UI utama tetap fokus pada operasional.

### 18. Pengaturan Aplikasi

Pengaturan yang tersedia saat ini:

- Nama lembaga.
- Logo pondok.

Pengaturan ini memengaruhi tampilan header dan identitas aplikasi.

## Alur Data Utama

### SPP

1. Bendahara membuat tagihan bulanan.
2. Tagihan tersimpan di sheet `billings`.
3. Sistem mem-posting jurnal Piutang SPP vs Pendapatan SPP.
4. Saat pembayaran masuk, tagihan berubah menjadi lunas.
5. Kas bertambah dan jurnal pembayaran dibuat.

### Pengeluaran

1. Bendahara input pengeluaran.
2. Data masuk ke sheet `expenses`.
3. Data kas keluar masuk ke `cash_transactions`.
4. Jurnal beban vs kas dibuat otomatis.

### Donasi

1. Bendahara input donasi atau janji donasi.
2. Jika status `Masuk`, kas bertambah.
3. Jika status `Janji`, kas tidak berubah.
4. Untuk wakaf, sistem memakai fund dan program khusus.

### Pembangunan

1. Pengurus membuat proyek pembangunan.
2. Donasi dan pengeluaran bisa dihubungkan ke proyek.
3. Sistem menghitung dana terkumpul, dana terpakai, dan sisa target.

## Apa Yang Sudah Siap Dipakai Sekarang

- Pencatatan santri.
- Pembuatan tagihan SPP.
- Pembayaran Tunai/Transfer/QRIS.
- Rekap tunggakan.
- Pengeluaran.
- Donasi.
- Kas.
- Dana pembangunan.
- Laporan aktivitas.
- Laporan ringkas.
- Mode akuntansi lanjutan.

## Batasan Saat Ini

- Aplikasi masih berbasis Google Spreadsheet, jadi cocok untuk fase awal dan menengah.
- Validasi sesi dan otorisasi server-side masih perlu diperkuat untuk produksi penuh.
- QRIS provider nyata masih bergantung pada konfigurasi provider yang dipilih.
- Laporan PAP lengkap masih berkembang bertahap.

## Kesimpulan

Aplikasi ini sudah mewakili kebutuhan operasional inti pesantren dan sudah punya fondasi akuntansi yang kuat. Yang paling penting saat ini bukan lagi memulai dari nol, tetapi merapikan alur pemakaian, menajamkan laporan, dan memperluas modul sesuai kebutuhan pesantren yang terus tumbuh.
