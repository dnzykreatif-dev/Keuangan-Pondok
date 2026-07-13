function generateMonthlyBills(month, year, nominal, classFilter) {
  const selectedMonth = normalizeText(month);
  const selectedYear = normalizeText(year);
  const billAmount = normalizeNumber(nominal, 0);
  const selectedClass = normalizeText(classFilter);

  if (!selectedMonth || !selectedYear || !billAmount) {
    return { ok: false, message: 'Bulan, tahun, dan nominal wajib diisi' };
  }

  const santri = getSheetData('santri').filter(student => (
    student.status === 'Aktif' &&
    (!selectedClass || selectedClass === 'ALL' || student.kelas === selectedClass)
  ));
  const billingSheet = getSheetOrThrow('billings');
  const existingBills = getSheetData('billings');

  const rowsToAppend = [];
  const billsToPost = [];

  santri.forEach(student => {
    const alreadyExists = existingBills.some(billing => (
      billing.id_santri === student.id_santri &&
      String(billing.bulan) === selectedMonth &&
      String(billing.tahun) === selectedYear
    ));

    if (!alreadyExists) {
      const idBilling = generateId('B');
      rowsToAppend.push([
        idBilling,
        student.id_santri,
        selectedMonth,
        selectedYear,
        billAmount,
        'Belum Lunas',
        'SPP',
        `Tagihan SPP ${selectedMonth} ${selectedYear}`,
        getDefaultFundId(),
        getDefaultUnitId(),
        getDefaultProgramId()
      ]);
      billsToPost.push({
        id_billing: idBilling,
        id_santri: student.id_santri,
        bulan: selectedMonth,
        tahun: selectedYear,
        nominal: billAmount,
        status: 'Belum Lunas',
        billing_type: 'SPP',
        description: `Tagihan SPP ${selectedMonth} ${selectedYear}`,
        fund_id: getDefaultFundId(),
        unit_id: getDefaultUnitId(),
        program_id: getDefaultProgramId()
      });
    }
  });

  appendRows(billingSheet, rowsToAppend);
  billsToPost.forEach(bill => postBillingJournal(bill));
  return { ok: true, message: `Berhasil membuat ${rowsToAppend.length} tagihan.` };
}

function getArrearsRecap() {
  const santri = getSheetData('santri');
  const billings = getSheetData('billings').filter(billing => billing.status === 'Belum Lunas');

  const recap = billings.map(billing => {
    const student = santri.find(item => item.id_santri === billing.id_santri);
    return {
      ...billing,
      nama: student ? student.nama : 'Unknown',
      kelas: student ? student.kelas : '-',
      kontak: student ? student.kontak_ortu : ''
    };
  });

  return { ok: true, data: recap };
}
