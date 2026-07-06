function getAppSettings() {
  try {
    const settingsRows = getSheetData('settings');
    const settings = {};

    settingsRows.forEach(row => {
      settings[row.key] = row.value;
    });

    return { ok: true, data: settings };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
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
    return file.getUrl();
  } catch (error) {
    return 'Error uploading: ' + error.toString();
  }
}

function saveSchoolLogo(base64) {
  const url = uploadFileToDrive(base64, 'school_logo.png');
  if (url.startsWith('http')) {
    updateAppSetting('logo_url', url);
    return { ok: true, url };
  }
  return { ok: false, message: url };
}
