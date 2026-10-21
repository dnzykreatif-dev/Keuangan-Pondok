/**
 * Provisioning helper for one-pondok-one-installation sales.
 *
 * Configure the seller/control project with:
 * - PROVISIONING_TEMPLATE_SPREADSHEET_ID: clean database template
 * - PROVISIONING_TEMPLATE_SCRIPT_ID: optional Apps Script template project;
 *   defaults to the current project
 * - PROVISIONING_PARENT_FOLDER_ID: optional Drive folder for new installations
 *
 * The function copies assets and prepares the handoff. Script Properties,
 * deployment, and ownership transfer are intentionally completed in the
 * buyer-owned project.
 */
function createTenantInstallation(request, currentUser) {
  const role = String((currentUser && (currentUser.role || currentUser.Role)) || '').trim().toLowerCase();
  if (role !== 'admin') throw new Error('Akses ditolak. Provisioning hanya dapat dijalankan oleh Admin.');

  request = request || {};
  const pondokName = normalizeText(request.pondokName);
  const tenantId = normalizeText(request.tenantId);
  const ownerEmail = normalizeText(request.ownerEmail);
  const supportEmail = normalizeText(request.supportEmail);

  if (!pondokName) throw new Error('Nama pondok wajib diisi.');
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(tenantId)) {
    throw new Error('TenantID hanya boleh berisi huruf, angka, garis bawah, dan tanda hubung (3-64 karakter).');
  }
  if (!isValidProvisioningEmail_(ownerEmail)) throw new Error('Email pemilik instalasi tidak valid.');
  if (supportEmail && !isValidProvisioningEmail_(supportEmail)) throw new Error('Email dukungan tidak valid.');

  const properties = PropertiesService.getScriptProperties();
  const spreadsheetTemplateId = normalizeText(properties.getProperty('PROVISIONING_TEMPLATE_SPREADSHEET_ID'));
  if (!spreadsheetTemplateId) throw new Error('Isi Script Property PROVISIONING_TEMPLATE_SPREADSHEET_ID terlebih dahulu.');

  const scriptTemplateId = normalizeText(properties.getProperty('PROVISIONING_TEMPLATE_SCRIPT_ID') || ScriptApp.getScriptId());
  const parentFolderId = normalizeText(properties.getProperty('PROVISIONING_PARENT_FOLDER_ID'));
  const folderName = `Keuangan Pondok - ${pondokName} - ${tenantId}`;
  const parentFolder = parentFolderId
    ? DriveApp.getFolderById(parentFolderId)
    : DriveApp.getRootFolder();
  if (parentFolder.getFoldersByName(folderName).hasNext()) {
    throw new Error(`Folder instalasi untuk TenantID ${tenantId} sudah ada.`);
  }
  const folder = parentFolder.createFolder(folderName);

  const scriptFile = DriveApp.getFileById(scriptTemplateId).makeCopy(`${folderName} - Apps Script`, folder);
  const spreadsheetFile = DriveApp.getFileById(spreadsheetTemplateId).makeCopy(`${folderName} - Database`, folder);

  let sharingNote = 'Transfer ownership dan deployment tetap perlu diselesaikan manual.';
  try {
    folder.addEditor(ownerEmail);
    sharingNote = `Folder sudah dibagikan sebagai Editor kepada ${ownerEmail}. Transfer ownership tetap perlu dikonfirmasi manual.`;
  } catch (error) {
    sharingNote = `Folder belum dapat dibagikan otomatis: ${error.message || error}`;
  }

  return {
    ok: true,
    data: {
      tenantId,
      pondokName,
      ownerEmail,
      supportEmail,
      folderId: folder.getId(),
      folderUrl: folder.getUrl(),
      scriptId: scriptFile.getId(),
      scriptUrl: `https://script.google.com/d/${scriptFile.getId()}/edit`,
      spreadsheetId: spreadsheetFile.getId(),
      spreadsheetUrl: spreadsheetFile.getUrl(),
      appScriptProperties: [
        'INSTALLATION_MODE=tenant',
        `TENANT_ID=${tenantId}`,
        `SPREADSHEET_ID=${spreadsheetFile.getId()}`,
        `INSTALLATION_OWNER_EMAIL=${ownerEmail}`,
        `SUPPORT_EMAIL=${supportEmail}`
      ],
      nextSteps: [
        'Buka project Apps Script hasil duplikasi.',
        'Isi Script Properties sesuai daftar konfigurasi.',
        'Jalankan setupDatabase().',
        'Deploy sebagai Web App dan uji login Admin.',
        'Transfer ownership kepada akun pondok setelah verifikasi.'
      ],
      sharingNote
    },
    message: 'Paket instalasi pondok berhasil dibuat.'
  };
}

function isValidProvisioningEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}
