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

Dengan clasp:

```bash
clasp push --force
```

Lalu di Apps Script Editor:

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
