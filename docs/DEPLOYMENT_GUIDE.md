# Deployment Guide

Panduan ini menjelaskan cara menyiapkan aplikasi dari nol sampai bisa dipakai sebagai Google Apps Script Web App.

## 1. Prasyarat

- Akun Google.
- Google Spreadsheet sebagai database.
- Akses Google Apps Script.
- Akun Midtrans untuk pembayaran sandbox atau production.
- Repository Git untuk backup kode.

## 2. Buat Spreadsheet

1. Buat Google Spreadsheet baru.
2. Salin Spreadsheet ID dari URL.
3. Buka `Config.gs`.
4. Ubah:

```javascript
SPREADSHEET_ID: 'ISI_DENGAN_SPREADSHEET_ID'
```

## 3. Buat Project Apps Script

1. Dari Spreadsheet, buka `Extensions > Apps Script`.
2. Buat file sesuai struktur project:
   - `Code.gs`
   - `Config.gs`
   - `Utils.gs`
   - `Setup.gs`
   - `Auth.gs`
   - `Santri.gs`
   - `Billing.gs`
   - `Payment.gs`
   - `Settings.gs`
   - `Index.html`
3. Salin isi file dari repository ke Apps Script Editor.

## 4. Isi Script Properties

Buka `Project Settings > Script Properties`, lalu tambahkan:

| Property | Isi |
| --- | --- |
| `MIDTRANS_SERVER_KEY` | Server key dari Midtrans |
| `MIDTRANS_CLIENT_KEY` | Client key dari Midtrans |

Gunakan key sandbox untuk pengujian.

## 5. Setup Database

1. Buka Apps Script Editor.
2. Pilih fungsi `setupDatabase`.
3. Klik `Run`.
4. Berikan izin akses jika diminta Google.

Fungsi ini membuat sheet:

- `users`
- `santri`
- `billings`
- `transactions`
- `settings`
- `accounts`
- `funds`
- `fiscal_periods`
- `journal_entries`
- `journal_lines`
- `audit_logs`

Default login:

- Username: `admin`
- Password: `admin123`

## 6. Import Data Santri Awal

Jika ingin memakai data santri bawaan:

1. Jalankan `resetAndImportSantri`.
2. Fungsi ini menghapus data santri lama selain header.
3. Data santri awal akan dimasukkan kembali.

Gunakan fungsi ini dengan hati-hati karena menghapus isi sheet `santri`.

## 7. Deploy Web App

1. Klik `Deploy > New deployment`.
2. Pilih type `Web app`.
3. Isi pengaturan:
   - Execute as: `Me`
   - Who has access: sesuaikan kebutuhan, umumnya `Anyone with the link` untuk tahap awal terbatas.
4. Klik `Deploy`.
5. Salin URL Web App.

## 8. Setup Webhook Midtrans

Di dashboard Midtrans, set notification URL ke URL Web App yang sama. Apps Script akan menerima request POST melalui `doPost(e)`.

Pastikan mode Midtrans sesuai:

- Sandbox URL Apps Script untuk testing.
- Production URL Apps Script untuk operasional.

## 9. Uji Alur Dasar

1. Buka URL Web App.
2. Login sebagai admin.
3. Tambah santri.
4. Generate tagihan.
5. Buka menu `Jurnal` dan pastikan jurnal tagihan terbentuk.
6. Buka pembayaran SPP.
7. Selesaikan pembayaran sandbox.
8. Pastikan webhook mengubah tagihan menjadi `Lunas`.
9. Pastikan jurnal pembayaran terbentuk dan laporan tetap balance.

## 10. Checklist Produksi

- Ganti password admin default.
- Pakai Midtrans production key.
- Ganti endpoint Midtrans jika berpindah dari sandbox ke production.
- Batasi akses Web App sesuai kebutuhan.
- Backup spreadsheet.
- Uji webhook dengan transaksi kecil.
- Tambahkan validasi sesi server-side pada fase pengembangan berikutnya.
