# Technical Spec

## Arsitektur

Aplikasi memakai Google Apps Script sebagai backend, Google Spreadsheet sebagai penyimpanan data, dan frontend Alpine.js yang dirakit dari partial HTML Apps Script. Semua data operasional dan akuntansi disimpan di sheet agar bendahara tetap bisa audit manual jika diperlukan.

## Struktur Frontend

- `Index.html`: shell utama yang memanggil partial.
- `AppHead.html`: meta tag, library CDN, style global, dan konfigurasi Tailwind.
- `AppState.html`: state Alpine, action frontend, formatter, dan pemanggilan `google.script.run`.
- `AppOverlays.html`: loading overlay dan toast.
- `LoginView.html`: layar login.
- `MainApp.html`: layout aplikasi dan view utama saat ini.
- `PaymentModal.html`: modal pembuatan payment order.
- `AddSantriModal.html`: modal tambah santri.

Pola ini mengikuti `include(filename)` di `Code.gs`, sehingga partial baru bisa ditambahkan tanpa memperbesar `Index.html`.

## Modul Backend

- `Billing.gs`: membuat tagihan, rekap tunggakan, dan dashboard.
- `Payment.gs`: membuat payment order QRIS, menjalankan adapter provider, menerima callback, mencatat event, dan melakukan rekonsiliasi.
- `Accounting.gs`: memvalidasi jurnal balance, posting double-entry, menyimpan audit log, dan menyediakan neraca saldo.
- `Reports.gs`: menyusun data laporan PAP dasar dari jurnal.

## Sheet Utama

- `users`: akun login.
- `santri`: master santri.
- `billings`: tagihan dengan dimensi `billing_type`, `fund_id`, `unit_id`, dan `program_id`.
- `transactions`: catatan transaksi legacy untuk dashboard.
- `payment_providers`: daftar provider QRIS.
- `payment_orders`: order pembayaran per tagihan.
- `payment_events`: callback dan aktivitas payment order.
- `reconciliation_logs`: log rekonsiliasi payment ke billing dan jurnal.
- `accounts`: chart of accounts pesantren.
- `funds`: dana tidak terikat, terikat sementara, dan terikat permanen.
- `units`: unit pesantren dan unit usaha.
- `programs`: program umum, beasiswa, wakaf, dan program lain.
- `journal_entries`: header jurnal.
- `journal_lines`: baris debit/kredit.
- `audit_logs`: jejak aktivitas penting.

## Payment Adapter

Fungsi publik utama:

- `createPaymentOrder(payment)`: membuat order QRIS dari tagihan.
- `generatePaymentLink(id_santri)`: membuat order untuk tagihan tertua yang belum lunas.
- `handlePaymentCallback(payload)`: memproses callback provider.
- `checkPaymentStatus(orderId)`: melihat status order.
- `getPaymentOrders(limit)`: data riwayat payment order untuk UI.

Adapter wajib menyediakan:

- `createInvoice(order, bill, student)`
- `handleCallback` melalui `normalizeCallback(payload)`
- `checkStatus` jika provider menyediakan endpoint status
- `verifySignature(payload)`

Default provider adalah `MOCK_QRIS`. Adapter `DUITKU` tersedia sebagai fondasi, tetapi membutuhkan Script Properties sebelum dipakai.

## Flow QRIS

1. Bendahara memilih tagihan.
2. Frontend memanggil `createPaymentOrder()`.
3. Backend membuat record `payment_orders` dan `transactions`.
4. Adapter membuat invoice/QRIS atau mock QRIS.
5. Provider mengirim callback ke `doPost(e)`.
6. Callback sukses menandai order `PAID`, billing `Lunas`, transaction `PAID`, dan posting jurnal kas.
7. Callback berulang tetap aman karena jurnal memakai idempotency `source_type` + `source_id`.

## Akuntansi

Semua jurnal wajib balance. Akun yang dipakai harus aktif.

Posting otomatis:

- Tagihan SPP: debit `Piutang SPP`, kredit `Pendapatan SPP`.
- Pembayaran QRIS: debit `Kas/Bank`, kredit `Piutang SPP`.
- Donasi: debit `Kas/Bank`, kredit `Penerimaan Infaq/Donasi`.
- Wakaf: debit aset/kas, kredit `Penerimaan Wakaf`.
- Aset: debit `Aset Tetap`, kredit `Kas/Bank`.
- Penyusutan: debit `Beban Penyusutan`, kredit `Akumulasi Penyusutan`.
- Persediaan: debit `Persediaan`, kredit `Kas/Bank`.
- Bisaroh: debit `Beban Bisaroh/Gaji`, kredit `Kas/Bank`.

## Laporan

`getAccountingReportData()` mengembalikan:

- Neraca saldo.
- Ringkasan posisi keuangan.
- Ringkasan aset neto per dana.
- Arus kas operasi, investasi, dan pendanaan.
- CaLK dasar berupa kebijakan pencatatan, jumlah akun, dana aktif, jurnal posted, dan akun material.

## Batasan Apps Script

- Runtime per eksekusi terbatas, jadi proses batch besar perlu dipotong.
- Callback provider harus ringan dan idempotent.
- Secret provider disimpan di Script Properties.
- Spreadsheet cocok untuk fase awal-menengah, tetapi bukan database transaksi skala besar.
