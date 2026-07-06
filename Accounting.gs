function seedAccountingDefaults() {
  ensureAccountingSheets();

  const accountSheet = getSheetOrThrow('accounts');
  if (accountSheet.getLastRow() === 1) {
    appendRows(accountSheet, DEFAULT_ACCOUNTS);
  }

  const fundSheet = getSheetOrThrow('funds');
  if (fundSheet.getLastRow() === 1) {
    appendRows(fundSheet, DEFAULT_FUNDS);
  }

  const periodSheet = getSheetOrThrow('fiscal_periods');
  if (periodSheet.getLastRow() === 1) {
    const currentYear = new Date().getFullYear();
    periodSheet.appendRow([
      `PERIOD_${currentYear}`,
      `Tahun ${currentYear}`,
      new Date(currentYear, 0, 1),
      new Date(currentYear, 11, 31),
      'Open'
    ]);
  }
}

function ensureAccountingSheets() {
  [
    'accounts',
    'funds',
    'fiscal_periods',
    'journal_entries',
    'journal_lines',
    'audit_logs'
  ].forEach(sheetName => ensureSheet(sheetName, SHEET_HEADERS[sheetName]));
}

function isTruthyValue(value) {
  return value === true || String(value).toUpperCase() === 'TRUE' || String(value).toLowerCase() === 'aktif';
}

function getActiveAccounts() {
  return getSheetData('accounts').filter(account => isTruthyValue(account.is_active));
}

function getAccountByCode(code) {
  const accountCode = normalizeText(code);
  const account = getActiveAccounts().find(item => String(item.code) === accountCode);
  if (!account) {
    throw new Error(`Akun aktif tidak ditemukan: ${accountCode}`);
  }
  return account;
}

function getDefaultFundId() {
  const funds = getSheetData('funds');
  const fund = funds.find(item => item.fund_id === DEFAULT_FUND_ID && isTruthyValue(item.is_active));
  return fund ? fund.fund_id : DEFAULT_FUND_ID;
}

function findJournalEntryBySource(sourceType, sourceId) {
  const normalizedType = normalizeText(sourceType);
  const normalizedId = normalizeText(sourceId);
  return getSheetData('journal_entries').find(entry => (
    entry.source_type === normalizedType &&
    entry.source_id === normalizedId &&
    entry.status !== 'VOID'
  ));
}

function buildJournalLine(journalId, line) {
  const account = getAccountByCode(line.account_code);
  return [
    generateId('JL'),
    journalId,
    account.account_id,
    account.code,
    account.name,
    normalizeNumber(line.debit),
    normalizeNumber(line.credit),
    normalizeText(line.memo)
  ];
}

function validateJournalLines(lines) {
  if (!lines || lines.length < 2) {
    throw new Error('Jurnal minimal memiliki dua baris');
  }

  const totalDebit = lines.reduce((sum, line) => sum + normalizeNumber(line.debit), 0);
  const totalCredit = lines.reduce((sum, line) => sum + normalizeNumber(line.credit), 0);

  if (totalDebit <= 0 || totalCredit <= 0) {
    throw new Error('Total debit dan kredit harus lebih dari nol');
  }

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error('Jurnal tidak balance');
  }

  return { totalDebit, totalCredit };
}

function postJournalEntry(entryData) {
  seedAccountingDefaults();

  const sourceType = normalizeText(entryData.source_type);
  const sourceId = normalizeText(entryData.source_id);
  const existing = findJournalEntryBySource(sourceType, sourceId);
  if (existing) {
    return { ok: true, journal_id: existing.journal_id, skipped: true };
  }

  validateJournalLines(entryData.lines);

  const journalId = generateId('JE');
  const entrySheet = getSheetOrThrow('journal_entries');
  const lineSheet = getSheetOrThrow('journal_lines');
  const date = entryData.date ? new Date(entryData.date) : new Date();
  const fundId = entryData.fund_id || getDefaultFundId();
  const createdBy = normalizeText(entryData.created_by) || 'System';

  entrySheet.appendRow([
    journalId,
    date,
    normalizeText(entryData.description),
    sourceType,
    sourceId,
    fundId,
    'POSTED',
    new Date(),
    createdBy
  ]);

  const rows = entryData.lines.map(line => buildJournalLine(journalId, line));
  appendRows(lineSheet, rows);
  recordAuditLog(createdBy, 'POST_JOURNAL', 'journal_entries', journalId, `${sourceType}:${sourceId}`);

  return { ok: true, journal_id: journalId, skipped: false };
}

function recordAuditLog(actor, action, entityType, entityId, details) {
  const sheet = getSheetOrThrow('audit_logs');
  sheet.appendRow([
    generateId('LOG'),
    new Date(),
    normalizeText(actor) || 'System',
    normalizeText(action),
    normalizeText(entityType),
    normalizeText(entityId),
    normalizeText(details)
  ]);
}

function postBillingJournal(billing) {
  seedAccountingDefaults();

  const amount = normalizeNumber(billing.nominal);
  if (amount <= 0) {
    throw new Error('Nominal tagihan harus lebih dari nol');
  }

  return postJournalEntry({
    date: new Date(),
    description: `Tagihan SPP ${billing.bulan} ${billing.tahun}`,
    source_type: 'billing',
    source_id: billing.id_billing,
    fund_id: getDefaultFundId(),
    created_by: 'System',
    lines: [
      { account_code: DEFAULT_ACCOUNT_CODES.SPP_RECEIVABLE, debit: amount, credit: 0, memo: billing.id_santri },
      { account_code: DEFAULT_ACCOUNT_CODES.SPP_REVENUE, debit: 0, credit: amount, memo: billing.id_santri }
    ]
  });
}

function postPaymentJournal(orderId, idBilling, amount) {
  seedAccountingDefaults();

  const paymentAmount = normalizeNumber(amount);
  if (paymentAmount <= 0) {
    throw new Error('Nominal pembayaran harus lebih dari nol');
  }

  return postJournalEntry({
    date: new Date(),
    description: `Pembayaran SPP ${idBilling}`,
    source_type: 'payment',
    source_id: orderId,
    fund_id: getDefaultFundId(),
    created_by: 'Midtrans',
    lines: [
      { account_code: DEFAULT_ACCOUNT_CODES.CASH_BANK, debit: paymentAmount, credit: 0, memo: orderId },
      { account_code: DEFAULT_ACCOUNT_CODES.SPP_RECEIVABLE, debit: 0, credit: paymentAmount, memo: idBilling }
    ]
  });
}

function getJournalSummaries(limit) {
  seedAccountingDefaults();

  const maxRows = normalizeNumber(limit, 50);
  const entries = getSheetData('journal_entries');
  const lines = getSheetData('journal_lines');
  const lineTotals = {};

  lines.forEach(line => {
    if (!lineTotals[line.journal_id]) {
      lineTotals[line.journal_id] = { debit: 0, credit: 0 };
    }
    lineTotals[line.journal_id].debit += normalizeNumber(line.debit);
    lineTotals[line.journal_id].credit += normalizeNumber(line.credit);
  });

  const data = entries
    .filter(entry => entry.status !== 'VOID')
    .map(entry => {
      const totals = lineTotals[entry.journal_id] || { debit: 0, credit: 0 };
      return {
        ...entry,
        total_debit: totals.debit,
        total_credit: totals.credit,
        is_balance: Math.abs(totals.debit - totals.credit) <= 0.01
      };
    })
    .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));

  return { ok: true, data: data.slice(0, maxRows) };
}

function getTrialBalanceData() {
  seedAccountingDefaults();

  const accounts = getSheetData('accounts');
  const lines = getSheetData('journal_lines');
  const totals = {};

  lines.forEach(line => {
    if (!totals[line.account_id]) {
      totals[line.account_id] = { debit: 0, credit: 0 };
    }
    totals[line.account_id].debit += normalizeNumber(line.debit);
    totals[line.account_id].credit += normalizeNumber(line.credit);
  });

  return accounts.map(account => {
    const accountTotals = totals[account.account_id] || { debit: 0, credit: 0 };
    const debit = accountTotals.debit;
    const credit = accountTotals.credit;
    const normalBalance = String(account.normal_balance || '').toLowerCase();
    const balance = normalBalance === 'kredit' || normalBalance === 'credit'
      ? credit - debit
      : debit - credit;

    return {
      account_id: account.account_id,
      code: account.code,
      name: account.name,
      type: account.type,
      report_category: account.report_category,
      normal_balance: account.normal_balance,
      debit,
      credit,
      balance
    };
  });
}

function getTrialBalance() {
  return { ok: true, data: getTrialBalanceData() };
}
