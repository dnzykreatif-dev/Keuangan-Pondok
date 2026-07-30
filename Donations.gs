function getOrCreateDonor(name, phone, address) {
  const donorName = normalizeText(name) || 'Tanpa Nama';
  const donors = getSheetData('donors');
  const existing = donors.find(donor => donor.name === donorName);
  if (existing) return existing;

  const donor = {
    donor_id: generateId('DNR'),
    name: donorName,
    phone: normalizeText(phone),
    address: normalizeText(address),
    created_at: new Date()
  };
  appendObjectRow('donors', donor);
  return donor;
}

function addDonation(donation) {
  try {
    seedOperationalDefaults();

    const amount = normalizeNumber(donation.amount);
    const status = normalizeText(donation.status) || 'Masuk';
    const type = normalizeText(donation.type) || 'Donasi';
    if (amount <= 0) throw new Error('Nominal donasi harus lebih dari nol');
    if (['Masuk', 'Janji'].indexOf(status) === -1) throw new Error('Status donasi harus Masuk atau Janji');

    const donor = getOrCreateDonor(donation.donor_name, donation.phone, donation.address);
    const donationId = generateId('DON');
    const proofUrl = saveOptionalProof(donation.proofBase64, donationId);
    const fundId = type === 'Wakaf' ? 'FUND_PERM_RESTRICTED' : (donation.fund_id || getDefaultFundId());
    const programId = type === 'Wakaf' ? 'PROGRAM_WAKAF' : (donation.program_id || getDefaultProgramId());
    const record = {
      donation_id: donationId,
      date: donation.date ? new Date(donation.date) : new Date(),
      donor_id: donor.donor_id,
      donor_name: donor.name,
      type,
      status,
      amount,
      method: normalizeText(donation.method) || 'Transfer',
      description: normalizeText(donation.description),
      proof_url: proofUrl,
      project_id: normalizeText(donation.project_id),
      fund_id: fundId,
      unit_id: donation.unit_id || getDefaultUnitId(),
      program_id: programId,
      created_at: new Date(),
      created_by: donation.created_by || 'System'
    };

    appendObjectRow('donations', record);

    if (status === 'Masuk') {
      recordCashTransaction({
        date: record.date,
        direction: 'Masuk',
        source_type: 'donation',
        source_id: donationId,
        amount,
        method: record.method,
        description: `${type} dari ${record.donor_name}`,
        proof_url: proofUrl,
        project_id: record.project_id,
        fund_id: record.fund_id,
        unit_id: record.unit_id,
        program_id: record.program_id,
        created_by: record.created_by
      });

      if (type === 'Wakaf') {
        postWaqfJournal({
          date: record.date,
          amount,
          description: `Penerimaan wakaf dari ${record.donor_name}`,
          source_id: donationId,
          memo: record.description,
          fund_id: record.fund_id,
          unit_id: record.unit_id,
          program_id: record.program_id,
          created_by: record.created_by
        });
      } else {
        postDonationJournal({
          date: record.date,
          amount,
          description: `Penerimaan ${type} dari ${record.donor_name}`,
          source_id: donationId,
          memo: record.description,
          fund_id: record.fund_id,
          unit_id: record.unit_id,
          program_id: record.program_id,
          created_by: record.created_by
        });
      }
    }

    return { ok: true, message: 'Donasi berhasil disimpan', data: record };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function syncDonationFinancialRecords(donationId, record, previousStatus) {
  if (record.status !== 'Masuk') {
    deleteCashTransactionBySource('donation', donationId);
    voidJournalBySource('donation', donationId, record.created_by);
    voidJournalBySource('waqf', donationId, record.created_by);
    return;
  }

  const sourceType = record.type === 'Wakaf' ? 'waqf' : 'donation';
  const oldSourceType = sourceType === 'waqf' ? 'donation' : 'waqf';
  const cashData = {
    date: record.date,
    direction: 'Masuk',
    amount: record.amount,
    method: record.method,
    description: `${record.type} dari ${record.donor_name}`,
    project_id: record.project_id,
    fund_id: record.fund_id,
    unit_id: record.unit_id,
    program_id: record.program_id
  };

  if (cashTransactionExists('donation', donationId)) {
    updateCashTransactionBySource('donation', donationId, cashData);
  } else {
    recordCashTransaction({
      ...cashData,
      source_type: 'donation',
      source_id: donationId,
      created_by: record.created_by
    });
  }

  voidJournalBySource(oldSourceType, donationId, record.created_by);
  if (!findJournalEntryBySource(sourceType, donationId)) {
    if (sourceType === 'waqf') {
      postWaqfJournal({
        date: record.date,
        amount: record.amount,
        description: `Penerimaan wakaf dari ${record.donor_name}`,
        source_id: donationId,
        memo: record.description,
        fund_id: record.fund_id,
        unit_id: record.unit_id,
        program_id: record.program_id,
        created_by: record.created_by
      });
    } else {
      postDonationJournal({
        date: record.date,
        amount: record.amount,
        description: `Penerimaan ${record.type} dari ${record.donor_name}`,
        source_id: donationId,
        memo: record.description,
        fund_id: record.fund_id,
        unit_id: record.unit_id,
        program_id: record.program_id,
        created_by: record.created_by
      });
    }
    return;
  }

  updateJournalBySource(sourceType, donationId, {
    date: record.date,
    description: sourceType === 'waqf'
      ? `Penerimaan wakaf dari ${record.donor_name}`
      : `Penerimaan ${record.type} dari ${record.donor_name}`,
    fund_id: record.fund_id,
    unit_id: record.unit_id,
    program_id: record.program_id,
    lines: [
      { account_code: DEFAULT_ACCOUNT_CODES.CASH_BANK, debit: record.amount, credit: 0, memo: record.description },
      { account_code: sourceType === 'waqf' ? DEFAULT_ACCOUNT_CODES.WAQF_REVENUE : DEFAULT_ACCOUNT_CODES.DONATION_REVENUE, debit: 0, credit: record.amount, memo: record.description }
    ]
  });
}

function updateDonation(donationId, donation) {
  try {
    seedOperationalDefaults();

    const existing = getSheetData('donations').find(item => item.donation_id === donationId);
    if (!existing) throw new Error('Donasi tidak ditemukan');

    const amount = normalizeNumber(donation.amount, normalizeNumber(existing.amount));
    const status = normalizeText(donation.status) || existing.status || 'Masuk';
    const type = normalizeText(donation.type) || existing.type || 'Donasi';
    if (amount <= 0) throw new Error('Nominal donasi harus lebih dari nol');
    if (['Masuk', 'Janji'].indexOf(status) === -1) throw new Error('Status donasi harus Masuk atau Janji');

    const donor = getOrCreateDonor(donation.donor_name || existing.donor_name, donation.phone, donation.address);
    const fundId = type === 'Wakaf' ? 'FUND_PERM_RESTRICTED' : (donation.fund_id || existing.fund_id || getDefaultFundId());
    const programId = type === 'Wakaf' ? 'PROGRAM_WAKAF' : (donation.program_id || existing.program_id || getDefaultProgramId());
    const record = {
      date: donation.date ? new Date(donation.date) : existing.date,
      donor_id: donor.donor_id,
      donor_name: donor.name,
      type,
      status,
      amount,
      method: normalizeText(donation.method) || existing.method || 'Transfer',
      description: normalizeText(donation.description),
      project_id: normalizeText(donation.project_id),
      fund_id: fundId,
      unit_id: donation.unit_id || existing.unit_id || getDefaultUnitId(),
      program_id: programId,
      created_by: existing.created_by || donation.created_by || 'System'
    };

    updateSheetRowByKey('donations', 'donation_id', donationId, record);
    syncDonationFinancialRecords(donationId, record, existing.status);

    return { ok: true, message: 'Donasi berhasil diperbarui' };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function deleteDonation(donationId) {
  try {
    const deleted = deleteSheetRowByKey('donations', 'donation_id', donationId);
    if (!deleted) throw new Error('Donasi tidak ditemukan');

    deleteCashTransactionBySource('donation', donationId);
    voidJournalBySource('donation', donationId, 'System');
    voidJournalBySource('waqf', donationId, 'System');

    return { ok: true, message: 'Donasi berhasil dihapus' };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function getDonations(limit) {
  seedOperationalDefaults();
  const maxRows = normalizeNumber(limit, 100);
  const data = getSheetData('donations')
    .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
    .slice(0, maxRows);
  return { ok: true, data };
}
