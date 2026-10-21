# Keuangan Pondok

Aplikasi keuangan pondok pesantren berbasis Google Apps Script dan Google Spreadsheet. Arah produk saat ini adalah sistem keuangan pesantren yang ringan, bertahap, dan mengikuti arah Pedoman Akuntansi Pesantren (PAP), bukan hanya aplikasi pembayaran SPP.

## Status Produk

Versi ini sudah memiliki modul operasional Level 1 untuk:

- Master santri dan tagihan.
- Generate tagihan SPP untuk semua kelas atau kelas tertentu.
- Pembayaran SPP via Tunai, Transfer, atau QRIS mock/provider adapter.
- Rekap tunggakan.
- Pengeluaran harian dengan kategori.
- Donasi, infaq, wakaf, hibah, dan bantuan.
- Kas masuk/keluar berbasis transaksi operasional.
- Dana pembangunan per proyek.
- Laporan ringkas untuk SPP, donasi, pengeluaran, dan arus kas.
- Payment order QRIS dinamis berbasis adapter provider.
- Mock QRIS untuk simulasi tanpa akun payment provider.
- Notifikasi WhatsApp semi-otomatis via link `wa.me` untuk tagihan baru dan bukti lunas.
- Fondasi jurnal double-entry.
- Master akun, dana, unit, program, periode fiskal, dan audit log.
- Laporan dasar menuju PAP: neraca saldo, posisi keuangan, perubahan aset neto, arus kas, dan CaLK dasar.

Akuntansi double-entry berjalan sebagai mesin backend. Menu jurnal dan laporan akuntansi disimpan di `Mode Akuntansi` khusus Admin agar UI harian tetap sederhana untuk bendahara.

Provider QRIS nyata belum dipaksa aktif. Struktur adapter sudah disiapkan agar provider seperti Duitku, bank, atau PJSP lain bisa ditambahkan tanpa mengubah alur aplikasi.

## Fitur Saat Ini

- Login admin berbasis sheet `users`.
- Master data santri.
- Generate tagihan bulanan untuk santri aktif, semua kelas, atau per kelas.
- Catat pembayaran SPP Tunai/Transfer dan buat payment order QRIS dari tagihan.
- Invoice bukti pembayaran SPP untuk pembayaran PAID, dengan logo lembaga dan opsi cetak/simpan PDF.
- Rekap tunggakan per santri, cetak/PDF per santri, dan pratinjau pesan untuk wali.
- Riwayat payment order dan callback event.
- Callback pembayaran idempotent untuk mencegah jurnal ganda.
- Input pengeluaran dan posting jurnal kas keluar otomatis.
- Input donasi masuk/janji dan posting jurnal kas masuk otomatis.
- Proyek dana pembangunan dengan target, dana terkumpul, dana terpakai, dan sisa target.
- Buku kas operasional dari `cash_transactions`.
- Laporan ringkas operasional.
- Laporan aktivitas berbasis jurnal untuk penghasilan, beban, dan surplus/defisit per periode.
- Posting otomatis:
  - tagihan: debit Piutang SPP, kredit Pendapatan SPP;
  - pembayaran: debit Kas/Bank, kredit Piutang SPP;
  - pengeluaran: debit Beban, kredit Kas/Bank;
  - donasi/wakaf masuk: debit Kas/Bank, kredit Pendapatan Donasi/Wakaf.
- Fungsi backend untuk kas masuk, kas keluar, donasi, wakaf, aset, penyusutan, persediaan, dan bisaroh.
- Menu jurnal dan laporan dasar dalam Mode Akuntansi.
- Pengaturan nama lembaga dan logo.

## Struktur File

- `Code.gs`: entrypoint web app.
- `Config.gs`: konfigurasi, header sheet, akun default, dana, unit, program, dan provider pembayaran.
- `Utils.gs`: helper spreadsheet, Script Properties, ID, hash, normalisasi, dan update row.
- `Setup.gs`: setup database idempotent dan import santri awal.
- `Auth.gs`: login.
- `Santri.gs`: data santri dan tagihan per santri.
- `Billing.gs`: generate tagihan dan rekap tunggakan.
- `Payment.gs`: pembayaran Tunai/Transfer, payment order QRIS, adapter provider, callback, event, dan rekonsiliasi.
- `Operations.gs`: dashboard operasional, buku kas, dan laporan ringkas.
- `Expenses.gs`: pengeluaran dan posting kas keluar.
- `Donations.gs`: donasi/infaq/wakaf/hibah/bantuan dan posting kas masuk.
- `DevelopmentFunds.gs`: proyek dana pembangunan.
- `Accounting.gs`: master akuntansi, posting jurnal, audit log, dan neraca saldo.
- `Reports.gs`: data laporan PAP dasar.
- `Settings.gs`: pengaturan aplikasi dan upload logo.
- `WhatsApp.gs`: normalisasi nomor wali, template pesan WA, link manual `wa.me`, dan log notifikasi.
- `Index.html`: shell frontend yang merakit partial HTML.
- `AppHead.html`, `AppState.html`, `MainApp.html`, dan partial modal/view pendukung: modul frontend Alpine.js + Tailwind CSS.

## Setup Singkat

1. Siapkan Google Spreadsheet.
2. Isi `APP_CONFIG.SPREADSHEET_ID` di `Config.gs`.
3. Push project ke Apps Script dengan clasp atau upload manual.
4. Jalankan `setupDatabase()` dari Apps Script Editor.
5. Deploy sebagai Web App.
6. Login default:
   - Username: `admin`
   - Password: `admin123`

Ganti password admin setelah setup awal.

## Instalasi untuk Pembeli

Untuk penjualan, gunakan satu project dan satu Spreadsheet per pondok. Data
pembeli tidak boleh memakai Spreadsheet fallback milik penjual.

Sebelum serah-terima, isi Script Properties pada project instalasi pondok:

```text
INSTALLATION_MODE=tenant
TENANT_ID=kode-unik-pondok
SPREADSHEET_ID=ID-Spreadsheet-milik-pondok
INSTALLATION_OWNER_EMAIL=email-admin-pondok
SUPPORT_EMAIL=email-dukungan-penjual
```

Dalam mode `tenant`, aplikasi akan menolak berjalan jika `SPREADSHEET_ID`
belum dikonfigurasi. Menu Pengaturan menampilkan status kesiapan instalasi,
tetapi Script Properties sengaja tidak dapat diubah dari dalam aplikasi.

Gunakan akun Google milik lembaga/pondok sebagai pemilik project dan
Spreadsheet. Email penjual cukup diberi akses support yang dapat dicabut.

### Provisioning satu klik

Admin penjual dapat menyiapkan paket instalasi dari menu Pengaturan setelah
mengisi Script Property berikut pada project kontrol:

```text
PROVISIONING_TEMPLATE_SPREADSHEET_ID=ID-Spreadsheet-template-kosong
PROVISIONING_TEMPLATE_SCRIPT_ID=ID-project-template-opsional
PROVISIONING_PARENT_FOLDER_ID=ID-folder-Drive-opsional
```

Tombol `Buat Paket Instalasi` oleh Admin menyalin Spreadsheet template, menyalin project
Apps Script, membuat folder khusus pondok, dan membagikan folder kepada email
pemilik. Deployment, pengisian Script Properties pada project hasil salinan,
dan transfer ownership tetap harus diverifikasi secara manual.

## Konfigurasi QRIS

Default aplikasi memakai `MOCK_QRIS`, sehingga alur tagihan dan payment order bisa dites tanpa provider nyata.

Script Properties yang tersedia:

- `PAYMENT_PROVIDER`: isi `MOCK_QRIS` atau `DUITKU`.
- `PAYMENT_CALLBACK_URL`: URL Web App untuk callback provider.
- `PAYMENT_RETURN_URL`: URL kembali setelah pembayaran.
- `PAYMENT_EXPIRY_MINUTES`: masa berlaku invoice.
- `DUITKU_MERCHANT_CODE`: kode merchant Duitku.
- `DUITKU_API_KEY`: API key Duitku.
- `DUITKU_QRIS_METHOD`: kode metode QRIS jika provider mewajibkan directional payment.
- `DUITKU_CALLBACK_SECRET`: secret verifikasi callback jika dipakai.

## Konfigurasi WhatsApp

Mode default notifikasi WhatsApp adalah `MANUAL_LINK`, sehingga admin menyiapkan pesan lalu membuka link `wa.me` satu per satu dari preview.

Script Properties tidak dipakai untuk mode ini. Pengaturan disimpan di sheet `settings`:

- `wa_enabled`
- `wa_mode`
- `wa_sender_name`
- `wa_tagihan_template`
- `wa_lunas_template`

Log preview dan tanda terima disimpan di sheet `notification_logs`.

## Dokumentasi

- Dokumentasi fitur aplikasi: `docs/FEATURES.md`
- Panduan pengguna: `docs/MANUAL_BOOK.md`
- Spesifikasi teknis: `docs/TECHNICAL_SPEC.md`
- Deployment: `docs/DEPLOYMENT_GUIDE.md`
- Operasional rilis, pemeriksaan, dan pemulihan loading: `docs/RELEASE_OPERATIONS.md`
- Roadmap PAP: `docs/ROADMAP_PAP.md`
- Plan operasional pondok: `docs/PRODUCT_PLAN_OPERASIONAL.md`
- Riwayat perubahan: `CHANGELOG.md`

Untuk menjaga aplikasi yang sedang berjalan tetap aman, ikuti alur staging di
`docs/SAFE_DEVELOPMENT_WORKFLOW.md`. Jangan push langsung ke project produksi
tanpa memeriksa `scriptId` pada `.clasp.json`.

Uji guard instalasi dengan:

```powershell
node tools/test_installation_config.js
```

## Catatan Keamanan

Aplikasi masih memakai localStorage untuk status login di frontend. Untuk produksi, fungsi sensitif perlu validasi sesi dan otorisasi server-side. Provider pembayaran nyata harus memakai secret di Script Properties, bukan di kode.
