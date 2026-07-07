function getAccountingReportData() {
  const trialBalance = getTrialBalanceData();
  const journalEntries = getJournalSummaries(10).data;
  const entries = getSheetData('journal_entries');
  const lines = getSheetData('journal_lines');
  const entryFunds = {};

  entries.forEach(entry => {
    entryFunds[entry.journal_id] = entry.fund_id || DEFAULT_FUND_ID;
  });

  const totalDebit = trialBalance.reduce((sum, row) => sum + normalizeNumber(row.debit), 0);
  const totalCredit = trialBalance.reduce((sum, row) => sum + normalizeNumber(row.credit), 0);
  const cashBank = trialBalance
    .filter(row => String(row.code) === DEFAULT_ACCOUNT_CODES.CASH_BANK)
    .reduce((sum, row) => sum + normalizeNumber(row.balance), 0);
  const sppReceivable = trialBalance
    .filter(row => String(row.code) === DEFAULT_ACCOUNT_CODES.SPP_RECEIVABLE)
    .reduce((sum, row) => sum + normalizeNumber(row.balance), 0);

  const funds = getSheetData('funds');
  const fundBalances = {};
  funds.forEach(fund => {
    fundBalances[fund.fund_id] = 0;
  });

  lines.forEach(line => {
    const fundId = entryFunds[line.journal_id] || DEFAULT_FUND_ID;
    const account = trialBalance.find(item => item.account_id === line.account_id);
    if (!account || !fundBalances.hasOwnProperty(fundId)) return;

    if (account.type === 'Pendapatan') {
      fundBalances[fundId] += normalizeNumber(line.credit) - normalizeNumber(line.debit);
    }
    if (account.type === 'Beban') {
      fundBalances[fundId] -= normalizeNumber(line.debit) - normalizeNumber(line.credit);
    }
    if (account.type === 'Aset Neto') {
      fundBalances[fundId] += normalizeNumber(line.credit) - normalizeNumber(line.debit);
    }
  });

  const netAssetSummary = funds.map(fund => ({
    fund_id: fund.fund_id,
    name: fund.name,
    restriction_type: fund.restriction_type,
    balance: fundBalances[fund.fund_id] || 0
  }));

  const financialPosition = buildFinancialPosition(trialBalance);
  const cashFlow = buildCashFlowReport(entries, lines, trialBalance);
  const notes = buildBasicNotes(trialBalance, funds, entries);

  return {
    ok: true,
    data: {
      trialBalance,
      journalEntries,
      summary: {
        totalDebit,
        totalCredit,
        isBalanced: Math.abs(totalDebit - totalCredit) <= 0.01,
        cashBank,
        sppReceivable
      },
      netAssetSummary,
      financialPosition,
      cashFlow,
      notes
    }
  };
}

function buildFinancialPosition(trialBalance) {
  const groups = {
    assets: [],
    liabilities: [],
    netAssets: []
  };

  trialBalance.forEach(account => {
    const row = {
      code: account.code,
      name: account.name,
      balance: normalizeNumber(account.balance)
    };

    if (account.type === 'Aset') groups.assets.push(row);
    if (account.type === 'Liabilitas') groups.liabilities.push(row);
    if (account.type === 'Aset Neto') groups.netAssets.push(row);
  });

  return {
    assets: groups.assets,
    liabilities: groups.liabilities,
    netAssets: groups.netAssets,
    totalAssets: groups.assets.reduce((sum, row) => sum + row.balance, 0),
    totalLiabilities: groups.liabilities.reduce((sum, row) => sum + row.balance, 0),
    totalNetAssets: groups.netAssets.reduce((sum, row) => sum + row.balance, 0)
  };
}

function getCashFlowActivity(sourceType) {
  const type = normalizeText(sourceType);
  if (['asset_purchase', 'depreciation', 'inventory_purchase'].indexOf(type) !== -1) return 'investasi';
  if (['waqf', 'donation'].indexOf(type) !== -1) return 'pendanaan';
  return 'operasi';
}

function buildCashFlowReport(entries, lines, trialBalance) {
  const entryById = {};
  entries.forEach(entry => {
    entryById[entry.journal_id] = entry;
  });

  const cashAccount = trialBalance.find(account => String(account.code) === DEFAULT_ACCOUNT_CODES.CASH_BANK);
  const result = {
    operasi: 0,
    investasi: 0,
    pendanaan: 0,
    total: 0
  };

  if (!cashAccount) return result;

  lines
    .filter(line => line.account_id === cashAccount.account_id || String(line.account_code) === DEFAULT_ACCOUNT_CODES.CASH_BANK)
    .forEach(line => {
      const entry = entryById[line.journal_id] || {};
      const activity = getCashFlowActivity(entry.source_type);
      const amount = normalizeNumber(line.debit) - normalizeNumber(line.credit);
      result[activity] += amount;
      result.total += amount;
    });

  return result;
}

function buildBasicNotes(trialBalance, funds, entries) {
  return {
    accountingPolicy: 'Basis pencatatan menggunakan double-entry berbasis jurnal. Laporan dihitung dari journal_lines yang sudah balance.',
    accountCount: trialBalance.length,
    activeFundCount: funds.filter(fund => isTruthyValue(fund.is_active)).length,
    postedJournalCount: entries.filter(entry => entry.status !== 'VOID').length,
    materialAccounts: trialBalance
      .filter(account => Math.abs(normalizeNumber(account.balance)) > 0)
      .map(account => ({
        code: account.code,
        name: account.name,
        type: account.type,
        balance: account.balance
      }))
  };
}
