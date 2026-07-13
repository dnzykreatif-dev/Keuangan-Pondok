function getSantriList() {
  return { ok: true, data: getSheetData('santri') };
}

function addSantri(santriData) {
  const sheet = getSheetOrThrow('santri');
  const nama = normalizeText(santriData && santriData.nama);
  const kelas = normalizeText(santriData && santriData.kelas);
  const kontakOrtu = normalizeText(santriData && santriData.kontak_ortu);

  if (!nama) {
    return { ok: false, message: 'Nama wajib diisi' };
  }

  const id = generateId('S');
  sheet.appendRow([id, nama, kelas, 'Aktif', kontakOrtu]);
  return { ok: true, message: 'Santri added successfully' };
}

function getUnpaidBills(id_santri) {
  const bills = getSheetData('billings').filter(bill => bill.id_santri === id_santri && bill.status === 'Belum Lunas');
  return { ok: true, data: bills };
}

function getStudentFinanceProfile(id_santri) {
  const student = getSheetData('santri').find(item => item.id_santri === id_santri);
  if (!student) {
    return { ok: false, message: 'Data santri tidak ditemukan' };
  }

  const bills = getSheetData('billings')
    .filter(bill => bill.id_santri === id_santri)
    .sort((a, b) => {
      const yearDiff = normalizeNumber(a.tahun) - normalizeNumber(b.tahun);
      if (yearDiff !== 0) return yearDiff;
      return MONTHS_ID.indexOf(a.bulan) - MONTHS_ID.indexOf(b.bulan);
    });
  const transactions = getSheetData('transactions').filter(transaction => transaction.id_santri === id_santri);
  const totalArrears = bills
    .filter(bill => bill.status === 'Belum Lunas')
    .reduce((sum, bill) => sum + normalizeNumber(bill.nominal), 0);

  return {
    ok: true,
    data: {
      student,
      bills,
      transactions,
      totalArrears
    }
  };
}
