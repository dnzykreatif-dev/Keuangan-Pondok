function getSpreadsheet() {
  return SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
}

function getAppProperty(name, fallback = '') {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  return value || fallback;
}

function getMidtransServerKey() {
  return getAppProperty('MIDTRANS_SERVER_KEY', APP_CONFIG.MIDTRANS_SERVER_KEY);
}

function getMidtransClientKey() {
  return getAppProperty('MIDTRANS_CLIENT_KEY', APP_CONFIG.MIDTRANS_CLIENT_KEY);
}

function getSheetOrThrow(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet tidak ditemukan: ${sheetName}`);
  }
  return sheet;
}

function ensureSheet(sheetName, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (headers && headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function hashPassword(password) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  let hash = '';
  for (let i = 0; i < digest.length; i++) {
    let byte = digest[i];
    if (byte < 0) byte += 256;
    let hex = byte.toString(16);
    if (hex.length === 1) hex = '0' + hex;
    hash += hex;
  }
  return hash;
}

function generateId(prefix) {
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss');
  const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}${stamp}${suffix}`;
}

function toIsoValue(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function getSheetData(sheetName) {
  const sheet = getSheetOrThrow(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values.shift();
  return values.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = toIsoValue(row[index]);
    });
    return obj;
  });
}

function appendRows(sheet, rows) {
  if (!rows.length) return;
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rows.length, rows[0].length).setValues(rows);
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
