# Deployment Guide

## 1. Persiapan

- Google Spreadsheet untuk database.
- Project Google Apps Script.
- `clasp` sudah login jika deploy dari lokal.
- Akun provider QRIS/PJSP hanya diperlukan jika ingin keluar dari mode `MOCK_QRIS`.

## 2. Spreadsheet

Pastikan `APP_CONFIG.SPREADSHEET_ID` di `Config.gs` berisi ID spreadsheet yang benar.

Jalankan `setupDatabase()` setelah push kode. Fungsi ini aman dijalankan ulang karena hanya membuat sheet, header, dan seed default yang belum ada.

## 3. Script Properties

Minimal untuk mode simulasi:

| Key | Nilai |
| --- | --- |
| `PAYMENT_PROVIDER` | `MOCK_QRIS` |

Opsional untuk QRIS provider:

| Key | Keterangan |
| --- | --- |
| `PAYMENT_PROVIDER` | `DUITKU` atau provider lain |
| `PAYMENT_CALLBACK_URL` | URL Web App Apps Script |
| `PAYMENT_RETURN_URL` | URL aplikasi setelah pembayaran |
| `PAYMENT_EXPIRY_MINUTES` | Masa berlaku invoice |
| `DUITKU_MERCHANT_CODE` | Merchant code |
| `DUITKU_API_KEY` | API key |
| `DUITKU_QRIS_METHOD` | Kode metode QRIS jika diperlukan |
| `DUITKU_CALLBACK_SECRET` | Secret verifikasi callback jika dipakai |

## 4. Deploy Apps Script

Sebelum push, pastikan `.clasp.json` menunjuk ke project yang dimaksud,
periksa `clasp status`, dan cocokkan perubahan lokal dengan editor Apps Script.
Untuk project yang sudah memiliki Web App, gunakan deployment ID yang sama.

Dengan clasp:

```bash
clasp push
clasp version "Deskripsi rilis"
clasp deployments
clasp deploy -i DEPLOYMENT_ID -V NOMOR_VERSI -d "Deskripsi rilis"
```

Jika `clasp push` menampilkan `Skipping push.`, berhenti dan verifikasi kode di
editor. Membuat versi tidak menyalin berkas lokal; versi dibuat dari kode yang
ada di server. Jangan memakai `--force` tanpa pemeriksaan konflik karena bisa
menimpa perubahan editor. Panduan lengkap dan kasus loading terdahulu ada di
`docs/RELEASE_OPERATIONS.md`.

Untuk instalasi baru, setelah push buka Apps Script Editor:

1. Buka project.
2. Jalankan `setupDatabase()`.
3. Pilih `Deploy > New deployment`.
4. Pilih tipe `Web app`.
5. Execute as: akun pemilik script.
6. Who has access: sesuai kebutuhan internal.
7. Deploy dan salin URL Web App.

## 5. Callback QRIS

Gunakan URL Web App sebagai callback provider. Apps Script menerima callback melalui `doPost(e)`.

Mode `MOCK_QRIS` tidak membutuhkan callback eksternal. Untuk pengujian manual, panggil `handlePaymentCallback()` dari Apps Script Editor dengan payload berisi `order_id` dan status sukses.

Contoh payload uji:

```json
{
  "order_id": "PAY-Bxxxx-123",
  "status": "PAID",
  "amount": 500000
}
```

## 6. Checklist Produksi

- Ubah password admin default.
- Isi secret provider di Script Properties.
- Pastikan callback provider memakai HTTPS Web App URL.
- Tes payment order kecil di sandbox/provider.
- Pastikan callback sukses membuat jurnal sekali meski dikirim berulang.
- Backup spreadsheet sebelum migrasi data besar.

## 7. Provisioning Pondok Pembeli

Untuk membuat instalasi terpisah bagi pembeli, siapkan project kontrol penjual
dengan Script Properties berikut:

```text
PROVISIONING_TEMPLATE_SPREADSHEET_ID=ID-Spreadsheet-template-kosong
PROVISIONING_TEMPLATE_SCRIPT_ID=ID-project-template-opsional
PROVISIONING_PARENT_FOLDER_ID=ID-folder-Drive-opsional
```

Dari menu Pengaturan sebagai Admin, isi nama pondok, TenantID, email pemilik,
dan email support, lalu klik `Buat Paket Instalasi`. Sistem akan menyalin
Spreadsheet template dan project Apps Script ke folder baru, kemudian mencoba
membagikan folder kepada email pemilik.

Jangan gunakan Spreadsheet produksi sebagai template. Setelah paket dibuat,
buka project hasil salinan, isi Script Properties tenant, jalankan
`setupDatabase()`, deploy sebagai Web App, uji login, lalu transfer ownership
kepada akun Google milik pondok. Deployment dan transfer ownership sengaja
tetap menjadi langkah verifikasi manual.
