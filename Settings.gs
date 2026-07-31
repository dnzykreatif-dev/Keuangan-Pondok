function toDirectImageUrl(url) {
  const text = normalizeText(url);
  if (!text) return '';

  const driveFileMatch = text.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch && driveFileMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveFileMatch[1]}`;
  }

  const driveQueryMatch = text.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (driveQueryMatch && driveQueryMatch[1]) {
    return `https://drive.google.com/uc?export=view&id=${driveQueryMatch[1]}`;
  }

  return text;
}

function getAppSettings() {
  try {
    const settingsRows = getSheetData('settings');
    const settings = {};

    settingsRows.forEach(row => {
      settings[row.key] = row.key === 'logo_url' ? toDirectImageUrl(row.value) : row.value;
    });

    return { ok: true, data: settings };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function getAppSettingValue(key, fallback = '') {
  const settings = getAppSettings();
  if (!settings.ok) return fallback;
  return settings.data && settings.data[key] !== undefined ? settings.data[key] : fallback;
}

function getConfiguredPaymentMethods() {
  const rawValue = getAppSettingValue('payment_methods', '');
  const defaults = ['Tunai', 'Transfer Bank', 'QRIS', 'DANA', 'ShopeePay', 'GoPay'];
  const values = normalizeText(rawValue)
    ? rawValue.split(',').map(item => normalizeText(item)).filter(Boolean)
    : defaults;

  const deduped = [];
  values.forEach(item => {
    if (!deduped.some(existing => existing.toLowerCase() === item.toLowerCase())) {
      deduped.push(item);
    }
  });
  return deduped.length ? deduped : defaults;
}

function isConfiguredPaymentMethod(method) {
  const normalized = normalizeText(method).toLowerCase();
  if (!normalized) return false;
  return getConfiguredPaymentMethods().some(item => normalizeText(item).toLowerCase() === normalized);
}

function updateAppSetting(key, value) {
  const sheet = getSheetOrThrow('settings');
  const rows = sheet.getDataRange().getValues();
  let found = false;

  for (let index = 1; index < rows.length; index++) {
    if (rows[index][0] === key) {
      sheet.getRange(index + 1, 2).setValue(value);
      found = true;
      break;
    }
  }

  if (!found) {
    sheet.appendRow([key, value]);
  }

  invalidateBootstrapCache();
  return { ok: true };
}

function uploadFileToDrive(base64, filename) {
  try {
    const folder = DriveApp.getRootFolder();
    const contentType = base64.substring(5, base64.indexOf(';'));
    const bytes = Utilities.base64Decode(base64.split(',')[1]);
    const blob = Utilities.newBlob(bytes, contentType, filename);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return `https://drive.google.com/uc?export=view&id=${file.getId()}`;
  } catch (error) {
    return 'Error uploading: ' + error.toString();
  }
}

function saveSchoolLogo(base64) {
  const url = uploadFileToDrive(base64, 'school_logo.png');
  if (url.startsWith('http')) {
    const directUrl = toDirectImageUrl(url);
    updateAppSetting('logo_url', directUrl);
    return { ok: true, url: directUrl };
  }
  return { ok: false, message: url };
}
