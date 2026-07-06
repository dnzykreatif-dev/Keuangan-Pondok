function getDashboardData() {
  const billings = getSheetData('billings');
  const transactions = getSheetData('transactions');
  const santri = getSheetData('santri');

  const paidStatuses = new Set(['SUCCESS', 'SETTLED', 'PAID']);
  const totalRevenue = transactions
    .filter(transaction => paidStatuses.has(String(transaction.status || '').toUpperCase()))
    .reduce((sum, transaction) => sum + normalizeNumber(transaction.jumlah_bayar), 0);

  const totalArrears = billings
    .filter(billing => billing.status === 'Belum Lunas')
    .reduce((sum, billing) => sum + normalizeNumber(billing.nominal), 0);

  const activeSantriCount = santri.filter(student => student.status === 'Aktif').length;

  return {
    ok: true,
    data: {
      stats: {
        totalRevenue,
        totalArrears,
        activeSantriCount,
        paidCount: billings.filter(billing => billing.status === 'Lunas').length,
        unpaidCount: billings.filter(billing => billing.status === 'Belum Lunas').length
      }
    }
  };
}

function generateMonthlyBills(month, year, nominal) {
  const selectedMonth = normalizeText(month);
  const selectedYear = normalizeText(year);
  const billAmount = normalizeNumber(nominal, 0);

  if (!selectedMonth || !selectedYear || !billAmount) {
    return { ok: false, message: 'Bulan, tahun, dan nominal wajib diisi' };
  }

  const santri = getSheetData('santri').filter(student => student.status === 'Aktif');
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
        'Belum Lunas'
      ]);
      billsToPost.push({
        id_billing: idBilling,
        id_santri: student.id_santri,
        bulan: selectedMonth,
        tahun: selectedYear,
        nominal: billAmount,
        status: 'Belum Lunas'
      });
    }
  });

  appendRows(billingSheet, rowsToAppend);
  billsToPost.forEach(bill => postBillingJournal(bill));
  return { ok: true, message: `Generated ${rowsToAppend.length} new bills.` };
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
