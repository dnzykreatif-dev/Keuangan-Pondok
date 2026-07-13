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

function getDonations(limit) {
  seedOperationalDefaults();
  const maxRows = normalizeNumber(limit, 100);
  const data = getSheetData('donations')
    .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
    .slice(0, maxRows);
  return { ok: true, data };
}
