function getExpenseCategories() {
  seedOperationalDefaults();
  return {
    ok: true,
    data: getSheetData('expense_categories').filter(category => isTruthyValue(category.is_active))
  };
}

function getExpenseAccountCode(categoryName) {
  const category = getSheetData('expense_categories')
    .find(item => item.name === categoryName && isTruthyValue(item.is_active));
  return category ? category.account_code : DEFAULT_ACCOUNT_CODES.OPERATIONAL_EXPENSE;
}

function addExpense(expense) {
  try {
    seedOperationalDefaults();

    const amount = normalizeNumber(expense.amount);
    if (amount <= 0) throw new Error('Nominal pengeluaran harus lebih dari nol');
    if (!normalizeText(expense.category)) throw new Error('Kategori pengeluaran wajib diisi');

    const expenseId = generateId('EXP');
    const proofUrl = saveOptionalProof(expense.proofBase64, expenseId);
    const record = {
      expense_id: expenseId,
      date: expense.date ? new Date(expense.date) : new Date(),
      category: normalizeText(expense.category),
      amount,
      supplier: normalizeText(expense.supplier),
      method: normalizeText(expense.method) || 'Tunai',
      description: normalizeText(expense.description),
      proof_url: proofUrl,
      project_id: normalizeText(expense.project_id),
      fund_id: expense.fund_id || getDefaultFundId(),
      unit_id: expense.unit_id || getDefaultUnitId(),
      program_id: expense.program_id || getDefaultProgramId(),
      created_at: new Date(),
      created_by: expense.created_by || 'System'
    };

    appendObjectRow('expenses', record);
    recordCashTransaction({
      date: record.date,
      direction: 'Keluar',
      source_type: 'expense',
      source_id: expenseId,
      amount,
      method: record.method,
      description: `${record.category} - ${record.description || record.supplier || 'Pengeluaran'}`,
      proof_url: proofUrl,
      project_id: record.project_id,
      fund_id: record.fund_id,
      unit_id: record.unit_id,
      program_id: record.program_id,
      created_by: record.created_by
    });

    postCashOutJournal({
      date: record.date,
      amount,
      description: `Pengeluaran ${record.category}`,
      source_type: 'expense',
      source_id: expenseId,
      debit_account_code: getExpenseAccountCode(record.category),
      memo: record.description,
      fund_id: record.fund_id,
      unit_id: record.unit_id,
      program_id: record.program_id,
      created_by: record.created_by
    });

    return { ok: true, message: 'Pengeluaran berhasil disimpan', data: record };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function updateExpense(expenseId, expense) {
  try {
    seedOperationalDefaults();

    const existing = getSheetData('expenses').find(item => item.expense_id === expenseId);
    if (!existing) throw new Error('Pengeluaran tidak ditemukan');

    const amount = normalizeNumber(expense.amount, normalizeNumber(existing.amount));
    const category = normalizeText(expense.category) || existing.category;
    if (amount <= 0) throw new Error('Nominal pengeluaran harus lebih dari nol');
    if (!category) throw new Error('Kategori pengeluaran wajib diisi');

    const record = {
      date: expense.date ? new Date(expense.date) : existing.date,
      category,
      amount,
      supplier: normalizeText(expense.supplier),
      method: normalizeText(expense.method) || existing.method || 'Tunai',
      description: normalizeText(expense.description),
      project_id: normalizeText(expense.project_id),
      fund_id: expense.fund_id || existing.fund_id || getDefaultFundId(),
      unit_id: expense.unit_id || existing.unit_id || getDefaultUnitId(),
      program_id: expense.program_id || existing.program_id || getDefaultProgramId()
    };

    updateSheetRowByKey('expenses', 'expense_id', expenseId, record);
    updateCashTransactionBySource('expense', expenseId, {
      date: record.date,
      direction: 'Keluar',
      amount,
      method: record.method,
      description: `${record.category} - ${record.description || record.supplier || 'Pengeluaran'}`,
      project_id: record.project_id,
      fund_id: record.fund_id,
      unit_id: record.unit_id,
      program_id: record.program_id
    });
    updateJournalBySource('expense', expenseId, {
      date: record.date,
      description: `Pengeluaran ${record.category}`,
      fund_id: record.fund_id,
      unit_id: record.unit_id,
      program_id: record.program_id,
      lines: [
        { account_code: getExpenseAccountCode(record.category), debit: amount, credit: 0, memo: record.description },
        { account_code: DEFAULT_ACCOUNT_CODES.CASH_BANK, debit: 0, credit: amount, memo: record.description }
      ]
    });

    return { ok: true, message: 'Pengeluaran berhasil diperbarui' };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function deleteExpense(expenseId) {
  try {
    const deleted = deleteSheetRowByKey('expenses', 'expense_id', expenseId);
    if (!deleted) throw new Error('Pengeluaran tidak ditemukan');

    deleteCashTransactionBySource('expense', expenseId);
    voidJournalBySource('expense', expenseId, 'System');

    return { ok: true, message: 'Pengeluaran berhasil dihapus' };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function getExpenses(limit) {
  seedOperationalDefaults();
  const maxRows = normalizeNumber(limit, 100);
  const data = getSheetData('expenses')
    .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
    .slice(0, maxRows);
  return { ok: true, data };
}
