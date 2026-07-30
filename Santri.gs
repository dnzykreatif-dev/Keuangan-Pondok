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
  appendObjectRow('santri', {
    id_santri: id,
    nama,
    kelas,
    status: 'Aktif',
    kontak_ortu: kontakOrtu
  });
  return { ok: true, message: 'Santri added successfully' };
}

function updateSantri(idSantri, santriData) {
  try {
    const nama = normalizeText(santriData && santriData.nama);
    const kelas = normalizeText(santriData && santriData.kelas);
    const status = normalizeText(santriData && santriData.status) || 'Aktif';
    const kontakOrtu = normalizeText(santriData && santriData.kontak_ortu);

    if (!nama) throw new Error('Nama wajib diisi');
    if (['Aktif', 'Nonaktif'].indexOf(status) === -1) throw new Error('Status harus Aktif atau Nonaktif');

    const updated = updateSheetRowByKey('santri', 'id_santri', idSantri, {
      nama,
      kelas,
      status,
      kontak_ortu: kontakOrtu
    });
    if (!updated) throw new Error('Data santri tidak ditemukan');

    return { ok: true, message: 'Data santri berhasil diperbarui' };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function deleteSantri(idSantri) {
  try {
    const hasBilling = getSheetData('billings').some(bill => bill.id_santri === idSantri);
    const hasTransaction = getSheetData('transactions').some(transaction => transaction.id_santri === idSantri);

    if (hasBilling || hasTransaction) {
      const updated = updateSheetRowByKey('santri', 'id_santri', idSantri, { status: 'Nonaktif' });
      if (!updated) throw new Error('Data santri tidak ditemukan');
      return { ok: true, message: 'Santri punya riwayat transaksi, jadi status diubah menjadi Nonaktif' };
    }

    const deleted = deleteSheetRowByKey('santri', 'id_santri', idSantri);
    if (!deleted) throw new Error('Data santri tidak ditemukan');
    return { ok: true, message: 'Data santri berhasil dihapus' };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function getUnpaidBills(id_santri) {
  const bills = getSheetData('billings')
    .filter(bill => bill.id_santri === id_santri && bill.status === 'Belum Lunas')
    .map(enrichBillWithPaymentStatus)
    .filter(bill => bill.remaining_amount > 0);
  return { ok: true, data: bills };
}

function getStudentFinanceProfile(id_santri) {
  const student = getSheetData('santri').find(item => item.id_santri === id_santri);
  if (!student) {
    return { ok: false, message: 'Data santri tidak ditemukan' };
  }

  const bills = getSheetData('billings')
    .filter(bill => bill.id_santri === id_santri)
    .map(enrichBillWithPaymentStatus)
    .sort((a, b) => {
      const yearDiff = normalizeNumber(a.tahun) - normalizeNumber(b.tahun);
      if (yearDiff !== 0) return yearDiff;
      return MONTHS_ID.indexOf(a.bulan) - MONTHS_ID.indexOf(b.bulan);
    });
  const transactions = getSheetData('transactions').filter(transaction => transaction.id_santri === id_santri);
  const totalArrears = bills
    .filter(bill => bill.status === 'Belum Lunas')
    .reduce((sum, bill) => sum + normalizeNumber(bill.remaining_amount), 0);

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
