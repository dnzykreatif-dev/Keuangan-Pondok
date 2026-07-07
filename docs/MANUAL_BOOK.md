# Manual Book Bendahara

## Login

1. Buka URL Web App.
2. Masuk dengan akun admin.
3. Default awal:
   - Username: `admin`
   - Password: `admin123`
4. Ganti password setelah setup.

## Data Santri

Menu `Data Santri` dipakai untuk:

- Melihat daftar santri.
- Menambah santri.
- Membuat payment order QRIS dari tagihan santri.
- Mengirim link pembayaran ke WhatsApp wali santri.

Pastikan nomor WhatsApp memakai format internasional, contoh `62812xxxx`.

## Tagihan

Menu `Tagihan` dipakai untuk membuat tagihan bulanan bagi semua santri aktif.

Langkah:

1. Pilih bulan.
2. Isi tahun.
3. Isi nominal.
4. Klik generate.

Sistem akan membuat tagihan yang belum ada dan otomatis membuat jurnal:

- Debit: Piutang SPP.
- Kredit: Pendapatan SPP.

## Pembayaran QRIS

Menu `Pembayaran QRIS` menampilkan semua payment order.

Status umum:

- `PENDING`: order dibuat, belum ada callback lunas.
- `PAID`: pembayaran sudah dikonfirmasi provider/callback.

Mode default adalah `MOCK_QRIS`. Mode ini berguna untuk uji alur tanpa akun provider. Saat provider QRIS nyata aktif, link/QR dari provider akan muncul pada order.

## Bayar Tagihan Santri

1. Buka `Data Santri`.
2. Klik `Bayar QRIS`.
3. Pilih tagihan.
4. Klik `Buat QRIS`.
5. Jika ada link, sistem membuka link pembayaran.
6. Jika masih mock, cek menu `Pembayaran QRIS`.

Pembayaran baru dianggap lunas setelah callback sukses atau status order diproses sebagai `PAID`.

## Kirim Link WhatsApp

Tombol `Kirim Link` membuat order untuk tagihan tertua yang belum lunas, lalu membuka WhatsApp dengan pesan siap kirim.

Jika masih mode mock, pesan akan berisi payload QRIS mock. Setelah provider nyata aktif, pesan akan berisi link pembayaran provider.

## Jurnal

Menu `Jurnal` menampilkan posting otomatis dari tagihan dan pembayaran. Setiap jurnal harus balance.

Jika ada jurnal tidak balance, hentikan input lanjutan dan cek:

- Nominal tagihan.
- Akun aktif.
- Callback pembayaran.
- Duplikasi order.

## Laporan

Menu `Laporan` menampilkan:

- Kas/Bank.
- Piutang SPP.
- Neraca saldo.
- Laporan posisi keuangan dasar.
- Ringkasan aset neto per dana.
- Arus kas operasi, investasi, dan pendanaan.
- CaLK dasar.

Laporan ini adalah fondasi awal menuju laporan PAP lengkap.

## Catatan Operasional

- Jalankan `setupDatabase()` setelah update besar.
- Jangan menghapus kolom sheet secara manual.
- Boleh menambah data melalui aplikasi agar jurnal dan audit log tetap rapi.
- Backup spreadsheet berkala, terutama sebelum import besar.
