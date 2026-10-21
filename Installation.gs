/**
 * Read-only installation handoff diagnostics.
 *
 * Script Properties are deliberately not editable from the application. This
 * prevents an Admin from accidentally switching the active database while the
 * installation is running. Configure these values from the Apps Script
 * project that belongs to the pondok:
 *
 * INSTALLATION_MODE=tenant
 * TENANT_ID=kode-unik-pondok
 * SPREADSHEET_ID=ID-spreadsheet-milik-pondok
 * INSTALLATION_OWNER_EMAIL=email-admin-pondok
 * SUPPORT_EMAIL=email-dukungan-penjual
 */
function getInstallationManifest(currentUser) {
  const role = String((currentUser && (currentUser.role || currentUser.Role)) || '').trim().toLowerCase();
  if (role !== 'admin') throw new Error('Akses ditolak. Status instalasi hanya dapat dilihat oleh Admin.');
  return { ok: true, data: PRODUCT_readInstallationManifest_() };
}

function PRODUCT_readInstallationManifest_() {
  const properties = PropertiesService.getScriptProperties().getProperties();
  const mode = getInstallationMode_();
  const spreadsheetId = String(properties.SPREADSHEET_ID || '').trim();
  const tenantId = String(properties.TENANT_ID || '').trim();
  const ownerEmail = String(properties.INSTALLATION_OWNER_EMAIL || '').trim();
  const supportEmail = String(properties.SUPPORT_EMAIL || '').trim();

  const checks = [
    {
      key: 'mode',
      label: 'Mode instalasi tenant',
      ok: mode === 'tenant',
      detail: mode === 'tenant' ? 'tenant' : 'legacy (kompatibilitas lama)'
    },
    {
      key: 'tenantId',
      label: 'TenantID',
      ok: !!tenantId,
      detail: tenantId || 'Belum diisi'
    },
    {
      key: 'spreadsheet',
      label: 'Spreadsheet milik pondok',
      ok: !!spreadsheetId,
      detail: spreadsheetId ? 'Sudah dikonfigurasi' : 'Belum diisi'
    },
    {
      key: 'ownerEmail',
      label: 'Email pemilik instalasi',
      ok: !!ownerEmail,
      detail: ownerEmail || 'Belum diisi'
    },
    {
      key: 'supportEmail',
      label: 'Email dukungan',
      ok: !!supportEmail,
      detail: supportEmail || 'Belum diisi'
    }
  ];

  return {
    mode,
    tenantId,
    hasSpreadsheetId: !!spreadsheetId,
    ownerEmail,
    supportEmail,
    ready: checks.every(check => check.ok),
    checks,
    note: mode === 'tenant'
      ? 'Mode tenant aktif. Aplikasi tidak memakai database fallback lama.'
      : 'Mode legacy aktif untuk kompatibilitas instalasi lama.'
  };
}
