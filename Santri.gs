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
