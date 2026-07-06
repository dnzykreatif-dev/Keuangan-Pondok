# Technical Specification

## 1. Arsitektur

Aplikasi menggunakan Google Apps Script sebagai backend dan Google Spreadsheet sebagai database sederhana. Frontend berada di `Index.html` dengan Alpine.js untuk state UI, Tailwind CSS untuk styling, Lucide untuk ikon, dan Midtrans Snap untuk pembayaran.

Alur umum:

1. User membuka Web App melalui `doGet()`.
2. Frontend memanggil backend memakai `google.script.run`.
3. Backend membaca/menulis data ke spreadsheet.
4. Midtrans mengirim webhook ke `doPost()` setelah status pembayaran berubah.

## 2. Modul Backend

- `Code.gs`: entrypoint Web App.
- `Config.gs`: konfigurasi global dan definisi header sheet.
- `Utils.gs`: utilitas spreadsheet, normalisasi input, ID generator, dan Script Properties.
- `Setup.gs`: inisialisasi sheet dan data awal.
- `Auth.gs`: autentikasi user.
- `Santri.gs`: CRUD ringan santri dan tagihan belum lunas.
- `Billing.gs`: dashboard, tagihan bulanan, dan rekap tunggakan.
- `Payment.gs`: Midtrans Snap, transaksi pending, link pembayaran, dan webhook.
- `Accounting.gs`: master akun, dana, posting jurnal double-entry, audit log, dan neraca saldo.
- `Reports.gs`: laporan dasar dari data jurnal.
- `Settings.gs`: profil lembaga dan upload logo.

## 3. Struktur Sheet Saat Ini

### `users`

| Kolom | Fungsi |
| --- | --- |
| `username` | Username login |
| `password_hash` | Hash SHA-256 password |
| `role` | Role user |

### `santri`

| Kolom | Fungsi |
| --- | --- |
| `id_santri` | ID unik santri |
| `nama` | Nama santri |
| `kelas` | Kelas |
| `status` | Status, contoh `Aktif` |
| `kontak_ortu` | Nomor WhatsApp wali |

### `billings`

| Kolom | Fungsi |
| --- | --- |
| `id_billing` | ID tagihan |
| `id_santri` | Relasi ke santri |
| `bulan` | Bulan tagihan |
| `tahun` | Tahun tagihan |
| `nominal` | Nilai tagihan |
| `status` | `Belum Lunas` atau `Lunas` |

### `transactions`

| Kolom | Fungsi |
| --- | --- |
| `id_transaksi` | ID transaksi, untuk Midtrans berisi `order_id` |
| `id_santri` | Relasi ke santri |
| `id_billing` | Relasi ke tagihan |
| `tanggal` | Tanggal transaksi dibuat |
| `jumlah_bayar` | Nominal pembayaran |
| `metode` | Metode pembayaran |
| `status` | `PENDING`, `SUCCESS`, atau status lain |
| `penerima` | User/system pembuat transaksi |

### `settings`

| Kolom | Fungsi |
| --- | --- |
| `key` | Nama pengaturan |
| `value` | Nilai pengaturan |

### `accounts`

| Kolom | Fungsi |
| --- | --- |
| `account_id` | ID akun |
| `code` | Kode akun |
| `name` | Nama akun |
| `type` | Tipe akun |
| `report_category` | Kategori laporan |
| `normal_balance` | Saldo normal |
| `is_active` | Status aktif |

### `funds`

| Kolom | Fungsi |
| --- | --- |
| `fund_id` | ID dana |
| `name` | Nama dana |
| `restriction_type` | Tidak terikat, terikat sementara, atau terikat permanen |
| `is_active` | Status aktif |

### `journal_entries`

| Kolom | Fungsi |
| --- | --- |
| `journal_id` | ID jurnal |
| `date` | Tanggal jurnal |
| `description` | Deskripsi |
| `source_type` | Sumber, contoh `billing` atau `payment` |
| `source_id` | ID sumber |
| `fund_id` | Dana terkait |
| `status` | Status jurnal |
| `created_at` | Waktu dibuat |
| `created_by` | Pembuat |

### `journal_lines`

| Kolom | Fungsi |
| --- | --- |
| `line_id` | ID baris jurnal |
| `journal_id` | Relasi ke jurnal |
| `account_id` | Relasi ke akun |
| `account_code` | Kode akun saat posting |
| `account_name` | Nama akun saat posting |
| `debit` | Nilai debit |
| `credit` | Nilai kredit |
| `memo` | Catatan baris |

## 4. Konfigurasi

Konfigurasi utama berada di `Config.gs`.

Untuk data sensitif, gunakan Script Properties:

- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`

Jika Script Properties kosong, aplikasi memakai fallback dari `APP_CONFIG`. Fallback masih berupa placeholder dan tidak boleh dipakai untuk produksi.

## 5. Integrasi Midtrans

Endpoint saat ini:

```text
https://app.sandbox.midtrans.com/snap/v1/transactions
```

Alur pembayaran:

1. Frontend memanggil `createMidtransTransaction(payment)`.
2. Backend mengambil tagihan dan santri.
3. Backend membuat payload Snap.
4. Midtrans mengembalikan `token` dan `redirect_url`.
5. Backend menyimpan transaksi `PENDING`.
6. Frontend membuka popup Snap.
7. Midtrans memanggil `doPost(e)`.
8. Jika status `settlement`, atau `capture` dengan `fraud_status=accept`, sistem menandai tagihan `Lunas` dan transaksi `SUCCESS`.

## 6. Batasan Teknis Spreadsheet

- Spreadsheet cocok untuk skala kecil sampai menengah.
- Hindari operasi baris satu per satu dalam jumlah besar.
- Untuk data besar, gunakan batch read/write seperti `getValues()` dan `setValues()`.
- Tidak ada constraint database native, sehingga validasi wajib dilakukan di Apps Script.
- Audit log perlu ditambahkan sebelum aplikasi dipakai multi-user secara serius.

## 7. Risiko Teknis

- Login belum memakai sesi server-side.
- Role belum dipakai untuk membatasi akses fungsi backend.
- Belum ada locking untuk mencegah race condition saat transaksi bersamaan.
- Belum ada migrasi schema formal.
- Belum ada test otomatis karena Apps Script berjalan di runtime Google.

## 8. Arah Teknis PAP

Pengembangan PAP menambah lapisan akuntansi double-entry tanpa membuang modul SPP yang sudah ada. Modul SPP menjadi salah satu sumber transaksi yang melakukan posting otomatis ke jurnal.

Posting otomatis saat ini:

- Saat tagihan SPP dibuat: debit `Piutang SPP`, kredit `Pendapatan SPP`.
- Saat pembayaran Midtrans sukses: debit `Kas/Bank`, kredit `Piutang SPP`.
- Setiap posting menyimpan `source_type` dan `source_id` untuk mencegah jurnal dobel.
