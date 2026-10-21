# Safe Development Workflow

Project ini harus dipisahkan dari aplikasi produksi yang sedang berjalan.

## Aturan utama

- Jangan menjalankan `clasp push` dari folder produksi tanpa pemeriksaan target.
- Project Apps Script pada `.clasp.json` adalah target yang terdaftar saat ini.
- Perubahan lokal tidak mengubah Web App sampai kode didorong dan deployment
  yang sesuai dipilih.
- Folder `tools/`, `docs/`, dan gateway lokal tidak boleh masuk ke Apps Script.
- Jangan menjalankan test Node.js dari editor Apps Script.

## Alur yang disarankan

1. Duplikat project Apps Script dan Spreadsheet untuk staging.
2. Buat folder kerja terpisah untuk staging.
3. Jalankan `clasp clone <STAGING_SCRIPT_ID>` dari folder staging.
4. Kerjakan perubahan dan jalankan test lokal di folder staging.
5. Push hanya ke project staging.
6. Uji login, pembayaran, QRIS mock, jurnal, laporan, dan provisioning.
7. Buat deployment/version staging.
8. Setelah disetujui, salin perubahan teruji ke branch/folder produksi.
9. Push dan deploy produksi secara sengaja, dengan backup Spreadsheet terlebih
   dahulu.

## Pemulihan file test yang terlanjur ter-upload

Jika file seperti `tools/test_installation_config` muncul di Apps Script,
hapus file tersebut dari editor Apps Script. `.claspignore` mencegah upload
berikutnya, tetapi tidak otomatis menghapus file remote yang sudah ada.

Sebelum push berikutnya, pastikan `clasp status` hanya menampilkan file `.gs`,
`.html`, dan manifest yang memang dibutuhkan aplikasi.
