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
  settings: ['key', 'value'],
  accounts: ['account_id', 'code', 'name', 'type', 'report_category', 'normal_balance', 'is_active'],
  funds: ['fund_id', 'name', 'restriction_type', 'is_active'],
  fiscal_periods: ['period_id', 'name', 'start_date', 'end_date', 'status'],
  journal_entries: ['journal_id', 'date', 'description', 'source_type', 'source_id', 'fund_id', 'status', 'created_at', 'created_by'],
  journal_lines: ['line_id', 'journal_id', 'account_id', 'account_code', 'account_name', 'debit', 'credit', 'memo'],
  audit_logs: ['log_id', 'timestamp', 'actor', 'action', 'entity_type', 'entity_id', 'details']
});

const MONTHS_ID = Object.freeze([
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]);

const DEFAULT_FUND_ID = 'FUND_UNRESTRICTED';

const DEFAULT_ACCOUNT_CODES = Object.freeze({
  CASH_BANK: '1110',
  SPP_RECEIVABLE: '1120',
  SPP_REVENUE: '4110',
  OPERATIONAL_EXPENSE: '5110',
  NET_ASSET_UNRESTRICTED: '3110',
  NET_ASSET_TEMP_RESTRICTED: '3120',
  NET_ASSET_PERM_RESTRICTED: '3130'
});

const DEFAULT_ACCOUNTS = Object.freeze([
  ['ACC_CASH_BANK', DEFAULT_ACCOUNT_CODES.CASH_BANK, 'Kas/Bank', 'Aset', 'Laporan Posisi Keuangan', 'Debit', true],
  ['ACC_SPP_RECEIVABLE', DEFAULT_ACCOUNT_CODES.SPP_RECEIVABLE, 'Piutang SPP', 'Aset', 'Laporan Posisi Keuangan', 'Debit', true],
  ['ACC_SPP_REVENUE', DEFAULT_ACCOUNT_CODES.SPP_REVENUE, 'Pendapatan SPP', 'Pendapatan', 'Laporan Perubahan Aset Neto', 'Kredit', true],
  ['ACC_OPERATIONAL_EXPENSE', DEFAULT_ACCOUNT_CODES.OPERATIONAL_EXPENSE, 'Beban Operasional', 'Beban', 'Laporan Perubahan Aset Neto', 'Debit', true],
  ['ACC_NET_ASSET_UNRESTRICTED', DEFAULT_ACCOUNT_CODES.NET_ASSET_UNRESTRICTED, 'Aset Neto Tidak Terikat', 'Aset Neto', 'Laporan Posisi Keuangan', 'Kredit', true],
  ['ACC_NET_ASSET_TEMP_RESTRICTED', DEFAULT_ACCOUNT_CODES.NET_ASSET_TEMP_RESTRICTED, 'Aset Neto Terikat Sementara', 'Aset Neto', 'Laporan Posisi Keuangan', 'Kredit', true],
  ['ACC_NET_ASSET_PERM_RESTRICTED', DEFAULT_ACCOUNT_CODES.NET_ASSET_PERM_RESTRICTED, 'Aset Neto Terikat Permanen', 'Aset Neto', 'Laporan Posisi Keuangan', 'Kredit', true]
]);

const DEFAULT_FUNDS = Object.freeze([
  [DEFAULT_FUND_ID, 'Tidak Terikat', 'Tidak Terikat', true],
  ['FUND_TEMP_RESTRICTED', 'Terikat Sementara', 'Terikat Sementara', true],
  ['FUND_PERM_RESTRICTED', 'Terikat Permanen', 'Terikat Permanen', true]
]);
