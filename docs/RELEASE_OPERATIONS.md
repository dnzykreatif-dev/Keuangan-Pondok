# Dokumentasi Operasional, Rilis, dan Pemulihan

Dokumen ini adalah panduan kerja untuk aplikasi **Keuangan Pondok** per 21 Oktober 2026. Baca bersama [README](../README.md), [panduan pengguna](MANUAL_BOOK.md), dan [spesifikasi teknis](TECHNICAL_SPEC.md). Jika contoh deploy lama menyarankan `clasp push --force` tanpa pemeriksaan, gunakan prosedur aman di bawah ini.

## 1. Sistem dan batasan

- Backend: Google Apps Script; data: Google Spreadsheet; frontend: partial HTML, Alpine.js, dan Tailwind CSS.
- `Code.gs` menyediakan `doGet()` dan `include()`. `Index.html` merakit partial; `AppHead.html` memuat library dan CSS; `AppState.html` berisi fungsi `app()`, state, dan panggilan `google.script.run`.
- `Billing.gs`, `Payment.gs`, `Santri.gs`, `Operations.gs`, dan modul terkait menangani tagihan, pembayaran, data santri, serta laporan.
- `docs/`, `tools/`, `staging/`, dan gateway lokal bukan bagian dari Web App; periksa `.claspignore` dan `clasp status` sebelum push.
- Login frontend masih memakai `localStorage`; otorisasi operasi sensitif di server perlu diaudit sebelum memperluas akses pengguna. Jangan taruh token, data wali, atau salinan spreadsheet dalam Git.

## 2. Alur kerja bendahara dan wali santri

1. Tambahkan atau periksa santri dan kontak wali di **Data Santri**.
2. Buat tagihan SPP per bulan, untuk seluruh santri aktif atau kelas tertentu.
3. Lihat **Tunggakan** untuk total, filter kelas, dan rekap per santri. Setiap kartu santri merangkum bulan yang belum lunas dan total sisanya.
4. Pada kartu santri, **Cetak PDF** membuka dialog cetak browser untuk satu santri; pilih *Save as PDF* untuk berkas yang dapat dibagikan. Tombol cetak di bagian atas halaman mencetak rekap sesuai filter, bukan hanya satu santri.
5. **Bagikan WA** menampilkan pratinjau pesan tunggakan per santri. Periksa nama, periode, jumlah, dan nomor wali sebelum membuka WhatsApp. Tindakan ini menyiapkan pesan; pengiriman tetap harus dilakukan pengguna.
6. Catat pembayaran Tunai/Transfer atau buat order QRIS dari tagihan. Pastikan status transaksi sesuai sebelum memberi bukti lunas.
7. Buka **Invoice** dari hasil pembayaran atau riwayat transaksi santri. Invoice dapat dicetak/disimpan PDF. Opsi WhatsApp, berbagi perangkat, email, dan salin ringkasan berbagi **teks ringkasan**; PDF harus disimpan dan dilampirkan secara terpisah bila dibutuhkan.
8. Setelah transaksi, periksa ulang sisa tagihan dan rekap tunggakan santri. Jangan kirim tangkapan layar yang memuat data santri lain.

Mode QRIS default adalah `MOCK_QRIS`; order mock bukan bukti dana nyata telah diterima. Integrasi provider dan gateway WhatsApp memerlukan konfigurasi serta pengujian tersendiri. Lihat [panduan deployment](DEPLOYMENT_GUIDE.md).

## 3. Siklus perubahan yang aman

Pekerjaan rutin dilakukan di project Apps Script dan Spreadsheet **staging** yang terpisah. Sebelum produksi, catat ID script target, URL Web App, deployment ID, versi aktif, dan hasil uji staging. Backup Spreadsheet sebelum migrasi data atau perubahan struktur sheet. Jangan gunakan `clasp push --force` sebagai langkah default: perintah itu bisa menimpa perubahan yang baru dibuat di editor Apps Script.

Di folder project yang tepat:

```powershell
git status --short --branch
Get-Content .clasp.json
clasp status
clasp deployments
```

Pastikan `scriptId` adalah target yang dimaksud. `git status` memperlihatkan perubahan lokal, sedangkan `clasp status` memperlihatkan berkas yang akan diproses clasp; keduanya **tidak** membuktikan remote sudah sama dengan lokal. Jika ada perubahan di editor Apps Script, bandingkan dengan lokal dan gabungkan secara sengaja sebelum push. Jangan mengandalkan `clasp push --force` untuk menyelesaikan konflik tersebut.

Setelah lolos pemeriksaan dan uji di staging:

```powershell
clasp push
clasp version "Deskripsi rilis yang spesifik"
clasp deployments
clasp deploy -i DEPLOYMENT_ID_YANG_SUDAH_ADA -V NOMOR_VERSI -d "Deskripsi rilis"
```

Periksa keluaran setiap perintah. Bila `clasp push` menampilkan **`Skipping push.`**, hentikan proses: jangan buat versi/deploy dengan asumsi kode lokal sudah masuk. Bandingkan isi file penting di editor dengan lokal, tentukan sumber kebenaran, dan sinkronkan dengan cara yang tidak menimpa perubahan lain. `clasp version` memotret **kode di server**, bukan berkas lokal. `clasp deploy -i` memperbarui deployment yang sama sehingga URL `/exec` tetap; membuat *New deployment* menghasilkan ID/URL lain. URL `/dev` menggunakan kode editor terbaru dan tidak menggantikan pengujian URL `/exec`.

Pengaturan *Execute as* dan akses Web App harus sesuai kebutuhan lembaga. Jangan menaruh password atau nilai Script Properties di dokumentasi atau riwayat Git.

## 4. Pemeriksaan setelah deploy

1. Buka URL `/dev` dengan akun penguji, lalu buka URL `/exec` dari deployment yang benar. Lakukan refresh penuh; pratinjau dalam editor/ekstensi mungkin perlu tombol *Refresh Preview* tersendiri.
2. Pastikan layar **Memuat aplikasi** hilang, login atau dashboard muncul, dan angka dashboard terisi. Bila ada data tersimpan, bandingkan beberapa nilai dengan Spreadsheet.
3. Buka DevTools Console. Tidak boleh ada `app is not defined`, `loading is not defined`, `tailwind is not defined`, atau error parser JavaScript.
4. Uji navigasi Data Santri, Tagihan, Tunggakan, Pembayaran, dan laporan. Buka satu rekap per santri, coba dialog cetak/PDF dan pratinjau berbagi tanpa mengirim ke wali selama pengujian.
5. Bila pembayaran diuji, gunakan data uji dan `MOCK_QRIS`; periksa pencatatan transaksi dan jurnal agar tidak ganda. Jangan menjalankan pembayaran nyata sekadar untuk *smoke test*.
6. Catat versi, deployment ID, waktu rilis, perubahan, hasil uji, dan cara rollback dalam catatan rilis.

Pemeriksaan lokal yang tersedia:

```powershell
node tools/test_installation_config.js
git diff --check
```

Jika tes Node tersedia di folder kerja, tes itu memeriksa sebagian konfigurasi; **bukan** pengganti uji render Apps Script di `/dev` dan `/exec`. Berkas `tools/` belum tentu ada pada setiap clone atau masuk ke deployment.

## 5. Insiden loading 21 Oktober 2026

**Gejala.** Halaman berhenti pada `Memuat aplikasi...`; Console menampilkan banyak `ReferenceError`, termasuk `app is not defined` dan `loading is not defined`.

**Akar masalah yang teramati.** `include('AppState')` di `Code.gs` memakai `HtmlService.createTemplateFromFile(filename).evaluate().getContent()`. Pada hasil render yang diperiksa, teks `//` di literal URL JavaScript terpotong oleh pemrosesan template, sehingga pernyataan `const target = phone ? \`https://wa.me/...\`` tidak lengkap. Akibatnya seluruh script `AppState.html` gagal diparse, `app()` tidak terdaftar, Alpine tidak dapat memulai, dan splash tidak disembunyikan. Ada masalah kedua: `AppHead.html` memuat Tailwind dengan `defer` tetapi mengakses `tailwind.config` melalui script inline sebelum library tersedia.

**Perbaikan.** Literal URL WhatsApp di `AppState.html` dibentuk tanpa token `//` utuh di source yang diproses template, dan tag CDN Tailwind di `AppHead.html` tidak lagi memakai `defer` sebelum konfigurasi inline. Perubahan yang diperlukan juga diperbaiki secara terarah di editor Apps Script ketika `clasp push` justru mengeluarkan `Skipping push.`; tidak dilakukan push paksa seluruh proyek.

**Rilis dan verifikasi.** Deployment Web App produksi yang sama diperbarui ke **versi 54**. URL `/exec` dan pratinjau editor diuji ulang: splash hilang dan dashboard menampilkan data. Console pada pemuatan baru tidak menampilkan error startup tersebut. Hasil ini membuktikan startup yang diuji berhasil, bukan seluruh fungsi bisnis telah diuji end-to-end.

## 6. Jika loading muncul lagi

| Gejala | Pemeriksaan | Tindakan |
| --- | --- | --- |
| `app is not defined` disertai banyak error Alpine | Lihat **script hasil render**, bukan hanya source lokal; periksa apakah script `AppState` terpotong atau tidak valid. | Perbaiki token yang terpotong, evaluasi template, lalu uji `/dev` sebelum version/deploy. |
| `tailwind is not defined` | Periksa urutan tag CDN dan `tailwind.config` inline. | Pastikan library selesai dimuat sebelum konfigurasi dijalankan. |
| `/dev` benar, `/exec` lama | Bandingkan versi pada `clasp deployments` dan deployment ID dari URL yang dibuka. | Buat versi dari server yang benar dan update deployment ID lama. |
| `clasp push` menulis `Skipping push.` | Bandingkan file editor vs lokal; jangan anggap push berhasil. | Sinkronkan secara terarah, verifikasi hasil render, baru lanjut rilis. |
| UI tampil tetapi angka tak terisi | Periksa kegagalan `google.script.run`, Script Properties, akses Spreadsheet, dan log eksekusi Apps Script. | Benahi backend/izin/data sesuai error spesifik; jangan mengubah splash untuk menutupi kegagalan data. |

Jika rilis baru rusak, hentikan penggunaan URL itu dan arahkan **deployment ID yang sama** ke versi terakhir yang diketahui sehat dengan `clasp deploy -i DEPLOYMENT_ID -V VERSI_SEHAT`, setelah mengonfirmasi nomor versi dan dampaknya. Ini me-rollback **kode Web App**, bukan perubahan data Spreadsheet; pulihkan data hanya dari backup yang tepat setelah pemeriksaan terpisah.

## 7. Git dan privasi

- `git status --short` sebelum staging; pilih hanya file yang memang termasuk rilis/commit. Berkas APK, gambar, konfigurasi lokal, data santri, dan token jangan ikut hanya karena ada di working tree.
- Periksa `git diff --cached --stat` dan `git diff --cached` sebelum commit. `git diff --check` tidak menguji perilaku aplikasi.
- Gunakan commit dengan pesan yang menerangkan cakupan; push branch yang benar secara sengaja. Commit/push Git **tidak** mengubah Web App Apps Script; deployment dilakukan terpisah.
- Jangan mengirim PDF atau pesan WhatsApp berisi data keuangan santri lain kepada satu wali. Verifikasi penerima dan nominal sebelum mengirim.
