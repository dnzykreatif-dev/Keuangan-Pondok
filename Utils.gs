function getSpreadsheet() {
  return SpreadsheetApp.openById(APP_CONFIG.SPREADSHEET_ID);
}

function getAppProperty(name, fallback = '') {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  return value || fallback;
}

function getConfiguredPaymentProviderId() {
  return getAppProperty('PAYMENT_PROVIDER', APP_CONFIG.DEFAULT_PAYMENT_PROVIDER);
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

function appendMissingRowsByKey(sheet, keyColumnIndex, rows) {
  if (!rows.length) return;

  const existingValues = sheet.getDataRange().getValues();
  const existingKeys = new Set(existingValues.slice(1).map(row => String(row[keyColumnIndex])));
  const rowsToAppend = rows.filter(row => !existingKeys.has(String(row[keyColumnIndex])));
  appendRows(sheet, rowsToAppend);
}

function appendObjectRow(sheetName, data) {
  const headers = SHEET_HEADERS[sheetName];
  const sheet = getSheetOrThrow(sheetName);
  sheet.appendRow(headers.map(header => data.hasOwnProperty(header) ? data[header] : ''));
}

function updateSheetRowByKey(sheetName, keyName, keyValue, updates) {
  const sheet = getSheetOrThrow(sheetName);
  const values = sheet.getDataRange().getValues();
  const headers = values[0] || [];
  const keyIndex = headers.indexOf(keyName);

  if (keyIndex === -1) {
    throw new Error(`Kolom kunci tidak ditemukan: ${keyName}`);
  }

  for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
    if (String(values[rowIndex][keyIndex]) === String(keyValue)) {
      Object.keys(updates).forEach(field => {
        const columnIndex = headers.indexOf(field);
        if (columnIndex !== -1) {
          sheet.getRange(rowIndex + 1, columnIndex + 1).setValue(updates[field]);
        }
      });
      return true;
    }
  }

  return false;
}

function bytesToHex(bytes) {
  return bytes.map(byte => {
    const normalized = byte < 0 ? byte + 256 : byte;
    return normalized.toString(16).padStart(2, '0');
  }).join('');
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
