const APP_CONFIG = Object.freeze({
  SPREADSHEET_ID: '12Mmvz6VehTFlXulxAH5GRGAksheB3u4JSqO2Ltx7iYA',
  INSTALLATION_MODE_DEFAULT: 'legacy',
  DEFAULT_PAYMENT_PROVIDER: 'MOCK_QRIS',
  DEFAULT_CURRENCY: 'IDR',
  DEFAULT_ADMIN_USERNAME: 'admin',
  DEFAULT_ADMIN_PASSWORD: 'admin123'
});

/**
 * Resolves the database for the current installation.
 *
 * Legacy mode keeps the original hard-coded spreadsheet for compatibility.
 * Tenant mode is intentionally strict: a buyer installation must provide its
 * own Spreadsheet ID through Script Properties and must never silently fall
 * back to the seller's database.
 */
function getInstallationMode_() {
  const mode = String(
    PropertiesService.getScriptProperties().getProperty('INSTALLATION_MODE') ||
      APP_CONFIG.INSTALLATION_MODE_DEFAULT
  ).trim().toLowerCase();
  return ['legacy', 'tenant'].includes(mode) ? mode : 'legacy';
}

function getConfiguredSpreadsheetId_() {
  const configured = String(
    PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') || ''
  ).trim();
  if (configured) return configured;
  if (getInstallationMode_() === 'tenant') {
    throw new Error(
      'Instalasi pondok belum dikonfigurasi. Isi Script Property SPREADSHEET_ID terlebih dahulu.'
    );
  }
  return APP_CONFIG.SPREADSHEET_ID;
}

const SHEET_HEADERS = Object.freeze({
  users: ['username', 'password_hash', 'role'],
  santri: ['id_santri', 'nama', 'kelas', 'status', 'kontak_ortu'],
  billings: ['id_billing', 'id_santri', 'bulan', 'tahun', 'nominal', 'status', 'billing_type', 'description', 'fund_id', 'unit_id', 'program_id'],
  transactions: ['id_transaksi', 'id_santri', 'id_billing', 'tanggal', 'jumlah_bayar', 'metode', 'status', 'penerima'],
  settings: ['key', 'value'],
  notification_logs: ['log_id', 'type', 'id_santri', 'id_billing', 'phone', 'message', 'status', 'created_at', 'created_by'],
  accounts: ['account_id', 'code', 'name', 'type', 'report_category', 'normal_balance', 'is_active'],
  funds: ['fund_id', 'name', 'restriction_type', 'is_active'],
  units: ['unit_id', 'name', 'description', 'is_active'],
  programs: ['program_id', 'name', 'description', 'is_active'],
  fiscal_periods: ['period_id', 'name', 'start_date', 'end_date', 'status'],
  journal_entries: ['journal_id', 'date', 'description', 'source_type', 'source_id', 'fund_id', 'status', 'created_at', 'created_by', 'unit_id', 'program_id'],
  journal_lines: ['line_id', 'journal_id', 'account_id', 'account_code', 'account_name', 'debit', 'credit', 'memo'],
  audit_logs: ['log_id', 'timestamp', 'actor', 'action', 'entity_type', 'entity_id', 'details'],
  payment_providers: ['provider_id', 'name', 'type', 'status', 'mode', 'base_url', 'secret_property', 'is_active'],
  payment_orders: ['order_id', 'provider_id', 'source_type', 'source_id', 'id_santri', 'id_billing', 'amount', 'currency', 'status', 'payment_url', 'qr_string', 'provider_reference', 'expires_at', 'created_at', 'created_by', 'paid_at'],
  payment_events: ['event_id', 'order_id', 'provider_id', 'event_type', 'status', 'payload', 'created_at'],
  reconciliation_logs: ['log_id', 'order_id', 'source_type', 'source_id', 'status', 'details', 'created_at'],
  cash_transactions: ['cash_id', 'date', 'direction', 'source_type', 'source_id', 'amount', 'method', 'description', 'proof_url', 'project_id', 'fund_id', 'unit_id', 'program_id', 'created_at', 'created_by'],
  expenses: ['expense_id', 'date', 'category', 'amount', 'supplier', 'method', 'description', 'proof_url', 'project_id', 'fund_id', 'unit_id', 'program_id', 'created_at', 'created_by'],
  expense_categories: ['category_id', 'name', 'account_code', 'is_active'],
  donations: ['donation_id', 'date', 'donor_id', 'donor_name', 'type', 'status', 'amount', 'method', 'description', 'proof_url', 'project_id', 'fund_id', 'unit_id', 'program_id', 'created_at', 'created_by'],
  donors: ['donor_id', 'name', 'phone', 'address', 'created_at'],
  development_projects: ['project_id', 'name', 'target_budget', 'description', 'status', 'start_date', 'end_date', 'created_at', 'created_by']
});

const MONTHS_ID = Object.freeze([
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]);

const DEFAULT_FUND_ID = 'FUND_UNRESTRICTED';
const DEFAULT_UNIT_ID = 'UNIT_PESANTREN';
const DEFAULT_PROGRAM_ID = 'PROGRAM_UMUM';

const DEFAULT_ACCOUNT_CODES = Object.freeze({
  CASH_BANK: '1110',
  SPP_RECEIVABLE: '1120',
  GENERAL_RECEIVABLE: '1130',
  INVENTORY: '1210',
  FIXED_ASSET: '1310',
  WAQF_ASSET: '1320',
  ACCUMULATED_DEPRECIATION: '1390',
  ACCOUNT_PAYABLE: '2110',
  SPP_REVENUE: '4110',
  DONATION_REVENUE: '4120',
  WAQF_REVENUE: '4130',
  BUSINESS_REVENUE: '4210',
  OPERATIONAL_EXPENSE: '5110',
  BISAROH_EXPENSE: '5120',
  DEPRECIATION_EXPENSE: '5130',
  INVENTORY_EXPENSE: '5140',
  NET_ASSET_UNRESTRICTED: '3110',
  NET_ASSET_TEMP_RESTRICTED: '3120',
  NET_ASSET_PERM_RESTRICTED: '3130'
});

const DEFAULT_ACCOUNTS = Object.freeze([
  ['ACC_CASH_BANK', DEFAULT_ACCOUNT_CODES.CASH_BANK, 'Kas/Bank', 'Aset', 'Laporan Posisi Keuangan', 'Debit', true],
  ['ACC_SPP_RECEIVABLE', DEFAULT_ACCOUNT_CODES.SPP_RECEIVABLE, 'Piutang SPP', 'Aset', 'Laporan Posisi Keuangan', 'Debit', true],
  ['ACC_GENERAL_RECEIVABLE', DEFAULT_ACCOUNT_CODES.GENERAL_RECEIVABLE, 'Piutang Umum', 'Aset', 'Laporan Posisi Keuangan', 'Debit', true],
  ['ACC_INVENTORY', DEFAULT_ACCOUNT_CODES.INVENTORY, 'Persediaan', 'Aset', 'Laporan Posisi Keuangan', 'Debit', true],
  ['ACC_FIXED_ASSET', DEFAULT_ACCOUNT_CODES.FIXED_ASSET, 'Aset Tetap', 'Aset', 'Laporan Posisi Keuangan', 'Debit', true],
  ['ACC_WAQF_ASSET', DEFAULT_ACCOUNT_CODES.WAQF_ASSET, 'Aset Wakaf', 'Aset', 'Laporan Posisi Keuangan', 'Debit', true],
  ['ACC_ACCUMULATED_DEPRECIATION', DEFAULT_ACCOUNT_CODES.ACCUMULATED_DEPRECIATION, 'Akumulasi Penyusutan', 'Aset', 'Laporan Posisi Keuangan', 'Kredit', true],
  ['ACC_ACCOUNT_PAYABLE', DEFAULT_ACCOUNT_CODES.ACCOUNT_PAYABLE, 'Utang Usaha', 'Liabilitas', 'Laporan Posisi Keuangan', 'Kredit', true],
  ['ACC_SPP_REVENUE', DEFAULT_ACCOUNT_CODES.SPP_REVENUE, 'Pendapatan SPP', 'Pendapatan', 'Laporan Perubahan Aset Neto', 'Kredit', true],
  ['ACC_DONATION_REVENUE', DEFAULT_ACCOUNT_CODES.DONATION_REVENUE, 'Penerimaan Infaq/Donasi', 'Pendapatan', 'Laporan Perubahan Aset Neto', 'Kredit', true],
  ['ACC_WAQF_REVENUE', DEFAULT_ACCOUNT_CODES.WAQF_REVENUE, 'Penerimaan Wakaf', 'Pendapatan', 'Laporan Perubahan Aset Neto', 'Kredit', true],
  ['ACC_BUSINESS_REVENUE', DEFAULT_ACCOUNT_CODES.BUSINESS_REVENUE, 'Pendapatan Unit Usaha', 'Pendapatan', 'Laporan Perubahan Aset Neto', 'Kredit', true],
  ['ACC_OPERATIONAL_EXPENSE', DEFAULT_ACCOUNT_CODES.OPERATIONAL_EXPENSE, 'Beban Operasional', 'Beban', 'Laporan Perubahan Aset Neto', 'Debit', true],
  ['ACC_BISAROH_EXPENSE', DEFAULT_ACCOUNT_CODES.BISAROH_EXPENSE, 'Beban Bisaroh/Gaji', 'Beban', 'Laporan Perubahan Aset Neto', 'Debit', true],
  ['ACC_DEPRECIATION_EXPENSE', DEFAULT_ACCOUNT_CODES.DEPRECIATION_EXPENSE, 'Beban Penyusutan', 'Beban', 'Laporan Perubahan Aset Neto', 'Debit', true],
  ['ACC_INVENTORY_EXPENSE', DEFAULT_ACCOUNT_CODES.INVENTORY_EXPENSE, 'Beban Pemakaian Persediaan', 'Beban', 'Laporan Perubahan Aset Neto', 'Debit', true],
  ['ACC_NET_ASSET_UNRESTRICTED', DEFAULT_ACCOUNT_CODES.NET_ASSET_UNRESTRICTED, 'Aset Neto Tidak Terikat', 'Aset Neto', 'Laporan Posisi Keuangan', 'Kredit', true],
  ['ACC_NET_ASSET_TEMP_RESTRICTED', DEFAULT_ACCOUNT_CODES.NET_ASSET_TEMP_RESTRICTED, 'Aset Neto Terikat Sementara', 'Aset Neto', 'Laporan Posisi Keuangan', 'Kredit', true],
  ['ACC_NET_ASSET_PERM_RESTRICTED', DEFAULT_ACCOUNT_CODES.NET_ASSET_PERM_RESTRICTED, 'Aset Neto Terikat Permanen', 'Aset Neto', 'Laporan Posisi Keuangan', 'Kredit', true]
]);

const DEFAULT_FUNDS = Object.freeze([
  [DEFAULT_FUND_ID, 'Tidak Terikat', 'Tidak Terikat', true],
  ['FUND_TEMP_RESTRICTED', 'Terikat Sementara', 'Terikat Sementara', true],
  ['FUND_PERM_RESTRICTED', 'Terikat Permanen', 'Terikat Permanen', true]
]);

const DEFAULT_UNITS = Object.freeze([
  [DEFAULT_UNIT_ID, 'Pesantren', 'Unit utama operasional pesantren', true],
  ['UNIT_KANTIN', 'Kantin', 'Unit usaha kantin pesantren', true],
  ['UNIT_KOPERASI', 'Koperasi', 'Unit usaha koperasi pesantren', true]
]);

const DEFAULT_PROGRAMS = Object.freeze([
  [DEFAULT_PROGRAM_ID, 'Umum', 'Program operasional umum', true],
  ['PROGRAM_BEASISWA', 'Beasiswa', 'Program bantuan pendidikan santri', true],
  ['PROGRAM_WAKAF', 'Wakaf', 'Program penghimpunan dan pengelolaan wakaf', true]
]);

const DEFAULT_APP_SETTINGS = Object.freeze({
  wa_enabled: 'TRUE',
  wa_mode: 'MANUAL_LINK',
  wa_sender_name: 'Admin Pesantren',
  wa_gateway_url: '',
  wa_gateway_api_key_property: 'WA_API_KEY',
  wa_gateway_auth_header: 'Authorization',
  wa_gateway_auth_prefix: 'Bearer',
  wa_gateway_phone_field: 'phone',
  wa_gateway_message_field: 'message',
  wa_gateway_extra_payload: '',
  wa_admin_phone: '',
  wa_admin_payment_template: "Pembayaran masuk:\\nNama: {student_name}\\nKelas: {class_name}\\nPeriode: {billing_label}\\nNominal: {amount}\\nMetode: {payment_method}\\nTanggal: {payment_date}\\nID: {payment_id}",
  wa_tagihan_template: "Assalamu'alaikum {wali_name},\\n\\nTagihan SPP an. {student_name} periode {billing_label} sebesar {amount} belum dibayar.\\n\\nSilakan lakukan pembayaran melalui kanal yang tersedia.\\n\\nTerima kasih.\\n{sender_name}",
  wa_lunas_template: "Assalamu'alaikum {wali_name},\\n\\nPembayaran SPP an. {student_name} periode {billing_label} sebesar {amount} sudah diterima dan dinyatakan lunas.\\n\\nTerima kasih atas kerja samanya.\\n{sender_name}"
});

const DEFAULT_PAYMENT_PROVIDERS = Object.freeze([
  ['MOCK_QRIS', 'Mock QRIS Dinamis', 'QRIS_MPM_DINAMIS', 'ACTIVE', 'sandbox', '', 'QRIS_CALLBACK_SECRET', true],
  ['DUITKU', 'Duitku QRIS', 'QRIS_MPM_DINAMIS', 'READY', 'sandbox', 'https://api-sandbox.duitku.com/api/merchant/createInvoice', 'DUITKU_CALLBACK_SECRET', true]
]);

const DEFAULT_EXPENSE_CATEGORIES = Object.freeze([
  ['EXP_DAPUR', 'Dapur', DEFAULT_ACCOUNT_CODES.OPERATIONAL_EXPENSE, true],
  ['EXP_PEMBANGUNAN', 'Pembangunan', DEFAULT_ACCOUNT_CODES.OPERATIONAL_EXPENSE, true],
  ['EXP_GAJI', 'Gaji', DEFAULT_ACCOUNT_CODES.BISAROH_EXPENSE, true],
  ['EXP_LISTRIK', 'Listrik', DEFAULT_ACCOUNT_CODES.OPERATIONAL_EXPENSE, true],
  ['EXP_AIR', 'Air', DEFAULT_ACCOUNT_CODES.OPERATIONAL_EXPENSE, true],
  ['EXP_INTERNET', 'Internet', DEFAULT_ACCOUNT_CODES.OPERATIONAL_EXPENSE, true],
  ['EXP_TRANSPORTASI', 'Transportasi', DEFAULT_ACCOUNT_CODES.OPERATIONAL_EXPENSE, true],
  ['EXP_KONSUMSI', 'Konsumsi', DEFAULT_ACCOUNT_CODES.OPERATIONAL_EXPENSE, true],
  ['EXP_ATK', 'ATK', DEFAULT_ACCOUNT_CODES.OPERATIONAL_EXPENSE, true],
  ['EXP_LAINNYA', 'Lainnya', DEFAULT_ACCOUNT_CODES.OPERATIONAL_EXPENSE, true],
  ['EXP_DAN_LAIN_LAIN', 'Dan Lain-lain', DEFAULT_ACCOUNT_CODES.OPERATIONAL_EXPENSE, true]
]);
