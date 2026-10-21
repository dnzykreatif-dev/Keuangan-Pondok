# Setup WhatsApp Gateway Tidak Resmi

Panduan ini untuk mode murah/praktis memakai gateway WhatsApp tidak resmi.

## 1. Siapkan data dari provider gateway

Minta atau catat dari provider:

- URL endpoint kirim pesan.
- Nama field nomor tujuan, biasanya `phone`, `number`, atau `to`.
- Nama field isi pesan, biasanya `message` atau `text`.
- Apakah butuh API key/token.
- Apakah butuh payload tambahan, misalnya `session`, `device_id`, atau `sender`.

## 2. Isi Script Properties jika gateway pakai API key

Di Apps Script:

1. Buka project Apps Script.
2. Masuk Project Settings.
3. Buka Script Properties.
4. Tambahkan property:

```text
WA_API_KEY = token_dari_provider
```

Kalau provider tidak memakai token, langkah ini boleh dilewati.

## 3. Isi Pengaturan di aplikasi

Di menu Pengaturan:

1. Set Notifikasi WhatsApp ke Aktif.
2. Set Mode WA ke API Gateway.
3. Isi URL Gateway WA.
4. Isi Field Nomor dan Field Pesan sesuai dokumentasi provider.
5. Isi Property API Key dengan `WA_API_KEY`.
6. Isi Header Auth dan Prefix Auth sesuai provider.
7. Isi Nomor WA Admin untuk notifikasi pembayaran masuk.
8. Tekan Simpan Semua Pengaturan.

Default request yang dikirim aplikasi:

```json
{
  "phone": "628xxxxxxxxxx",
  "message": "Isi pesan"
}
```

Jika provider butuh tambahan:

```json
{
  "session": "default"
}
```

isi di Payload Tambahan JSON.

## 4. Tes kirim

Masih di Pengaturan:

1. Isi Nomor Tes Gateway.
2. Isi Pesan Tes.
3. Tekan Tes Kirim WA.
4. Cek pesan masuk di WhatsApp.

Jika gagal, lihat pesan error dan cek kembali URL, token, nama field, atau payload tambahan.

## 5. Alur notifikasi otomatis

- Saat tagihan dibuat: aplikasi mengirim notifikasi tagihan ke nomor wali santri.
- Saat pembayaran lunas: aplikasi mengirim tanda lunas ke wali santri.
- Saat ada pembayaran masuk: aplikasi mengirim notifikasi ke nomor admin jika Nomor WA Admin diisi.

Semua percobaan kirim dicatat di sheet `notification_logs` dengan status `SENT`, `FAILED`, `INVALID_PHONE`, atau `MISSING_PHONE`.
