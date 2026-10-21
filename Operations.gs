function ensureOperationalSheets() {
  [
    'cash_transactions',
    'expenses',
    'expense_categories',
    'donations',
    'donors',
    'development_projects'
  ].forEach(sheetName => ensureSheet(sheetName, SHEET_HEADERS[sheetName]));
}

function seedOperationalDefaults() {
  withSetupCache('operational-defaults', 21600, function () {
    ensureOperationalSheets();
    const categorySheet = getSheetOrThrow('expense_categories');
    appendMissingRowsByKey(categorySheet, 0, DEFAULT_EXPENSE_CATEGORIES);
  });
}

function saveOptionalProof(base64, prefix) {
  if (!base64) return '';
  const filename = `${prefix || 'proof'}-${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss')}`;
  const url = uploadFileToDrive(base64, filename);
  return String(url).startsWith('http') ? url : '';
}

function toMonthKey(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM');
}

function currentMonthKey() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM');
}

function getDashboardMonthNames() {
  return ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
}

function getDashboardMonthIndex(monthName) {
  return getDashboardMonthNames().findIndex(name => String(name).toLowerCase() === String(monthName || '').toLowerCase());
}

function resolveDashboardPeriod(mode, month, year) {
  const normalizedMode = String(mode || 'ALL').toUpperCase();
  if (normalizedMode !== 'MONTH') {
    return {
      mode: 'ALL',
      month: '',
      year: '',
      monthKey: '',
      label: 'Seluruh data',
      scopeKey: 'all'
    };
  }

  const monthIndex = getDashboardMonthIndex(month);
  const safeMonthIndex = monthIndex >= 0 ? monthIndex : new Date().getMonth();
  const safeMonth = getDashboardMonthNames()[safeMonthIndex];
  const safeYear = Number(year) || new Date().getFullYear();
  const monthKey = `${safeYear}-${String(safeMonthIndex + 1).padStart(2, '0')}`;

  return {
    mode: 'MONTH',
    month: safeMonth,
    year: safeYear,
    monthKey,
    label: `${safeMonth} ${safeYear}`,
    scopeKey: monthKey
  };
}

function recordCashTransaction(data, skipSeed) {
  if (!skipSeed) seedOperationalDefaults();

  const amount = normalizeNumber(data.amount);
  if (amount <= 0) {
    throw new Error('Nominal kas harus lebih dari nol');
  }

  const direction = normalizeText(data.direction);
  if (['Masuk', 'Keluar'].indexOf(direction) === -1) {
    throw new Error('Arah kas harus Masuk atau Keluar');
  }

  const record = {
    cash_id: data.cash_id || generateId('CASH'),
    date: data.date ? new Date(data.date) : new Date(),
    direction,
    source_type: data.source_type || 'manual',
    source_id: data.source_id || '',
    amount,
    method: data.method || 'Tunai',
    description: data.description || '',
    proof_url: data.proof_url || '',
    project_id: data.project_id || '',
    fund_id: data.fund_id || getDefaultFundId(),
    unit_id: data.unit_id || getDefaultUnitId(),
    program_id: data.program_id || getDefaultProgramId(),
    created_at: new Date(),
    created_by: data.created_by || 'System'
  };

  appendObjectRow('cash_transactions', record);
  return record;
}

function updateCashTransactionBySource(sourceType, sourceId, data) {
  const cash = getSheetData('cash_transactions').find(row => (
    row.source_type === normalizeText(sourceType) &&
    row.source_id === normalizeText(sourceId)
  ));
  if (!cash) return false;

  const amount = normalizeNumber(data.amount, normalizeNumber(cash.amount));
  if (amount <= 0) throw new Error('Nominal kas harus lebih dari nol');

  return updateSheetRowByKey('cash_transactions', 'cash_id', cash.cash_id, {
    date: data.date || cash.date,
    direction: data.direction || cash.direction,
    amount,
    method: data.method || cash.method,
    description: data.description || cash.description,
    proof_url: data.proof_url || cash.proof_url,
    project_id: data.project_id || cash.project_id,
    fund_id: data.fund_id || cash.fund_id || getDefaultFundId(),
    unit_id: data.unit_id || cash.unit_id || getDefaultUnitId(),
    program_id: data.program_id || cash.program_id || getDefaultProgramId()
  });
}

function deleteCashTransactionBySource(sourceType, sourceId) {
  const cash = getSheetData('cash_transactions').find(row => (
    row.source_type === normalizeText(sourceType) &&
    row.source_id === normalizeText(sourceId)
  ));
  if (!cash) return false;
  return deleteSheetRowByKey('cash_transactions', 'cash_id', cash.cash_id);
}

function cashTransactionExists(sourceType, sourceId) {
  seedOperationalDefaults();
  const normalizedType = normalizeText(sourceType);
  const normalizedId = normalizeText(sourceId);
  return getSheetData('cash_transactions').some(row => (
    row.source_type === normalizedType &&
    row.source_id === normalizedId
  ));
}

function getCashTransactions(limit) {
  seedOperationalDefaults();
  const maxRows = normalizeNumber(limit, 100);
  const data = getSheetData('cash_transactions')
    .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
    .slice(0, maxRows);
  return { ok: true, data };
}

function calculateCashSummary(cashRows) {
  return cashRows.reduce((summary, row) => {
    const amount = normalizeNumber(row.amount);
    if (row.direction === 'Masuk') {
      summary.totalIn += amount;
      summary.balance += amount;
    }
    if (row.direction === 'Keluar') {
      summary.totalOut += amount;
      summary.balance -= amount;
    }
    return summary;
  }, { totalIn: 0, totalOut: 0, balance: 0 });
}

function getTopExpenses(expenses, limit) {
  const totals = {};
  expenses.forEach(expense => {
    const category = expense.category || 'Lainnya';
    totals[category] = (totals[category] || 0) + normalizeNumber(expense.amount);
  });

  return Object.keys(totals)
    .map(category => ({ category, amount: totals[category] }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit || 5);
}

function getOperationalDashboardData(mode, month, year, skipSeed) {
  const period = resolveDashboardPeriod(mode, month, year);
  return withBootstrapCache(`dashboard:${period.scopeKey}`, 180, function () {
    if (!skipSeed) seedOperationalDefaults();

    const cashRows = getSheetData('cash_transactions');
    const periodCashRows = period.mode === 'MONTH'
      ? cashRows.filter(row => toMonthKey(row.date) === period.monthKey)
      : cashRows;
    const billings = getSheetData('billings');
    const santri = getSheetData('santri');
    const transactions = getSheetData('transactions');
    const donations = getSheetData('donations');
    const expenses = getSheetData('expenses');
    const periodDonations = period.mode === 'MONTH'
      ? donations.filter(row => row.status === 'Masuk' && toMonthKey(row.date) === period.monthKey)
      : donations.filter(row => row.status === 'Masuk');
    const periodExpenses = period.mode === 'MONTH'
      ? expenses.filter(row => toMonthKey(row.date) === period.monthKey)
      : expenses;
    const cashSummary = calculateCashSummary(cashRows);

    const incomeThisMonth = periodCashRows
      .filter(row => row.direction === 'Masuk')
      .reduce((sum, row) => sum + normalizeNumber(row.amount), 0);
    const expenseThisMonth = periodCashRows
      .filter(row => row.direction === 'Keluar')
      .reduce((sum, row) => sum + normalizeNumber(row.amount), 0);
    const unpaidBills = buildArrearsRecap(santri, billings, transactions);
    const totalArrears = unpaidBills.reduce((sum, billing) => sum + normalizeNumber(billing.remaining_amount), 0);
    const donationThisMonth = periodDonations.reduce((sum, donation) => sum + normalizeNumber(donation.amount), 0);

    return {
      ok: true,
      data: {
        period,
        stats: {
          cashBalance: cashSummary.balance,
          incomeThisMonth,
          expenseThisMonth,
          totalArrears,
          donationThisMonth,
          activeSantriCount: santri.filter(student => student.status === 'Aktif').length,
          totalRevenue: cashSummary.totalIn,
          paidCount: billings.filter(billing => billing.status === 'Lunas').length,
          unpaidCount: billings.filter(billing => billing.status === 'Belum Lunas').length
        },
        incomeVsExpense: [
          { label: 'Pemasukan', amount: incomeThisMonth },
          { label: 'Pengeluaran', amount: expenseThisMonth }
        ],
        topExpenses: getTopExpenses(periodExpenses, 5),
        unpaidBills: unpaidBills.slice(0, 10)
      }
    };
  });
}

function getDashboardData(mode, month, year) {
  return getOperationalDashboardData(mode, month, year);
}

function getBootstrapData() {
  return withBootstrapCache('bootstrap', 180, function () {
    seedOperationalDefaults();

    const dashboard = getOperationalDashboardData(undefined, undefined, undefined, true).data;
    const developmentProjects = getDevelopmentProjects(true).data;
    const expenseCategories = getExpenseCategories(true).data;

    return {
      ok: true,
      data: {
        dashboard,
        developmentProjects,
        expenseCategories
      }
    };
  });
}

function getOperationalReportData() {
  seedOperationalDefaults();

  const billings = getSheetData('billings');
  const transactions = getSheetData('transactions');
  const paidAmountByBillingId = buildPaidAmountByBillingId(transactions);
  const donations = getSheetData('donations');
  const expenses = getSheetData('expenses');
  const cashRows = getSheetData('cash_transactions').sort((a, b) => new Date(a.date) - new Date(b.date));
  const cashSummary = calculateCashSummary(cashRows);
  const paidBills = billings.filter(bill => bill.status === 'Lunas');
  const unpaidBills = billings
    .filter(bill => bill.status === 'Belum Lunas')
    .map(bill => enrichBillWithPaymentStatus(bill, paidAmountByBillingId))
    .filter(bill => bill.remaining_amount > 0);
  const paidSppAmount = transactions
    .filter(transaction => String(transaction.status).toUpperCase() === 'PAID')
    .reduce((sum, transaction) => sum + normalizeNumber(transaction.jumlah_bayar), 0);
  const receivedDonations = donations.filter(donation => donation.status === 'Masuk');

  const expenseByCategory = getTopExpenses(expenses, expenses.length || 1);
  const donorTotals = {};
  receivedDonations.forEach(donation => {
    const donor = donation.donor_name || 'Tanpa Nama';
    donorTotals[donor] = (donorTotals[donor] || 0) + normalizeNumber(donation.amount);
  });

  let runningBalance = 0;
  const cashLedger = cashRows.map(row => {
    const amount = normalizeNumber(row.amount);
    runningBalance += row.direction === 'Masuk' ? amount : -amount;
    return { ...row, balance: runningBalance };
  }).reverse();

  return {
    ok: true,
    data: {
      spp: {
        total: billings.length,
        paid: paidBills.length,
        unpaid: unpaidBills.length,
        paidAmount: paidSppAmount,
        unpaidAmount: unpaidBills.reduce((sum, bill) => sum + normalizeNumber(bill.remaining_amount), 0),
        paidPercentage: billings.length ? Math.round((paidBills.length / billings.length) * 100) : 0
      },
      donations: {
        totalReceived: receivedDonations.reduce((sum, donation) => sum + normalizeNumber(donation.amount), 0),
        pledged: donations.filter(donation => donation.status === 'Janji').reduce((sum, donation) => sum + normalizeNumber(donation.amount), 0),
        topDonors: Object.keys(donorTotals)
          .map(name => ({ name, amount: donorTotals[name] }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
      },
      expenses: {
        total: expenses.reduce((sum, expense) => sum + normalizeNumber(expense.amount), 0),
        byCategory: expenseByCategory
      },
      cash: {
        ...cashSummary,
        ledger: cashLedger.slice(0, 100)
      }
    }
  };
}
