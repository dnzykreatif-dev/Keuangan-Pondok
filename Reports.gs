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
      netAssetSummary
    }
  };
}
