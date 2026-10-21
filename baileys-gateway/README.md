# Baileys Gateway untuk Keuangan Pondok

Gateway lokal ini menerima request dari Apps Script lalu mengirim pesan WhatsApp memakai Baileys.

Baileys adalah library tidak resmi. Gunakan untuk notifikasi wajar, bukan spam/broadcast besar.

## Instalasi

```bash
cd baileys-gateway
npm install
copy .env.example .env
```

Edit `.env`:

```text
PORT=3010
API_KEY=isi-token-sendiri
AUTH_DIR=./.baileys-auth
```

## Menjalankan

```bash
npm start
```

Saat pertama jalan, terminal akan menampilkan QR. Scan dari WhatsApp:

WhatsApp > Perangkat tertaut > Tautkan perangkat

## Endpoint

Status:

```http
GET http://localhost:3010/status
```

Kirim pesan:

```http
POST http://localhost:3010/send
Authorization: Bearer isi-token-sendiri
Content-Type: application/json

{
  "phone": "628xxxxxxxxxx",
  "message": "Tes pesan"
}
```

## Setting di Aplikasi

Di menu Pengaturan aplikasi:

- Mode WA: `API Gateway`
- URL Gateway WA: `http://localhost:3010/send` untuk test lokal dari komputer yang sama.
- Field Nomor: `phone`
- Field Pesan: `message`
- Header Auth: `Authorization`
- Prefix Auth: `Bearer`
- Property API Key: `WA_API_KEY`

Di Apps Script Script Properties, isi:

```text
WA_API_KEY = token_yang_sama_dengan_API_KEY_di_env
```

## Jika Dipakai dari Apps Script

Apps Script berjalan di server Google, jadi Google tidak bisa mengakses `http://localhost:3010/send` di laptop. Untuk aplikasi yang sudah dideploy, gunakan salah satu:

- VPS dengan HTTPS publik.
- Tunnel HTTPS seperti ngrok atau Cloudflare Tunnel.

Contoh URL yang harus dipakai di Pengaturan aplikasi:

```text
https://domain-publik-kamu.example/send
```

## Catatan Deploy

Untuk produksi, biarkan proses gateway menyala terus memakai process manager seperti PM2 atau service bawaan server.
