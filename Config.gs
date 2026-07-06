const APP_CONFIG = Object.freeze({
  SPREADSHEET_ID: '1GOpHDvbbd0tsjfGK0aMyrHgp4wjtVXOCkTu9mZx8FE8',
  MIDTRANS_SERVER_KEY: 'YOUR_MIDTRANS_SERVER_KEY',
  MIDTRANS_CLIENT_KEY: 'YOUR_MIDTRANS_CLIENT_KEY',
  MIDTRANS_SNAP_URL: 'https://app.sandbox.midtrans.com/snap/v1/transactions',
  DEFAULT_ADMIN_USERNAME: 'admin',
  DEFAULT_ADMIN_PASSWORD: 'admin123'
});

const SHEET_HEADERS = Object.freeze({
  users: ['username', 'password_hash', 'role'],
  santri: ['id_santri', 'nama', 'kelas', 'status', 'kontak_ortu'],
  billings: ['id_billing', 'id_santri', 'bulan', 'tahun', 'nominal', 'status'],
  transactions: ['id_transaksi', 'id_santri', 'id_billing', 'tanggal', 'jumlah_bayar', 'metode', 'status', 'penerima'],
  settings: ['key', 'value']
});

const MONTHS_ID = Object.freeze([
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]);
