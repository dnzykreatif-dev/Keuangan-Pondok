function generateMonthlyBills(month, year, nominal, classFilter, studentFilter, createdBy) {
  const selectedMonth = normalizeText(month);
  const selectedYear = normalizeText(year);
  const billAmount = normalizeNumber(nominal, 0);
  const selectedClass = normalizeText(classFilter);
  const selectedStudent = normalizeText(studentFilter);

  if (!selectedMonth || !selectedYear || billAmount <= 0) {
    return { ok: false, message: 'Bulan, tahun, dan nominal wajib diisi lebih dari nol' };
  }
  if (MONTHS_ID.indexOf(selectedMonth) === -1) {
    return { ok: false, message: 'Bulan tagihan tidak valid' };
  }

  const lock = LockService.getDocumentLock() || LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return { ok: false, message: 'Proses tagihan lain masih berjalan. Coba lagi sebentar.' };
  }

  try {
    const allStudents = getSheetData('santri');
    const targetStudents = allStudents.filter(student => {
      const isActive = normalizeText(student.status).toLowerCase() === 'aktif';
      const matchesStudent = !selectedStudent || student.id_santri === selectedStudent;
      const matchesClass = !selectedClass || selectedClass === 'ALL' || normalizeText(student.kelas) === selectedClass;
      return isActive && matchesStudent && matchesClass;
    });

    if (!targetStudents.length) {
      return { ok: false, message: 'Tidak ada santri aktif sesuai target tagihan' };
    }

    const billingSheet = getSheetOrThrow('billings');
    const existingKeys = new Set(getSheetData('billings').map(billing => [
      billing.id_santri,
      normalizeText(billing.bulan),
      normalizeText(billing.tahun)
    ].join('|')));
    const defaultFundId = getDefaultFundId();
    const defaultUnitId = getDefaultUnitId();
    const defaultProgramId = getDefaultProgramId();
    const rowsToAppend = [];
    const billsToPost = [];
    let skippedCount = 0;

    targetStudents.forEach(student => {
      const billingKey = [student.id_santri, selectedMonth, selectedYear].join('|');
      if (existingKeys.has(billingKey)) {
        skippedCount++;
        return;
      }

      const idBilling = generateId('B');
      const billRecord = {
        id_billing: idBilling,
        id_santri: student.id_santri,
        bulan: selectedMonth,
        tahun: selectedYear,
        nominal: billAmount,
        status: 'Belum Lunas',
        billing_type: 'SPP',
        description: `Tagihan SPP ${selectedMonth} ${selectedYear}`,
        fund_id: defaultFundId,
        unit_id: defaultUnitId,
        program_id: defaultProgramId
      };

      rowsToAppend.push([
        billRecord.id_billing,
        billRecord.id_santri,
        billRecord.bulan,
        billRecord.tahun,
        billRecord.nominal,
        billRecord.status,
        billRecord.billing_type,
        billRecord.description,
        billRecord.fund_id,
        billRecord.unit_id,
        billRecord.program_id
      ]);
      billsToPost.push(billRecord);
      existingKeys.add(billingKey);
    });

    appendRows(billingSheet, rowsToAppend);
    postBillingJournals(billsToPost);
    const notificationPreview = buildBillingWhatsAppPreview(billsToPost, createdBy);

    const targetLabel = selectedStudent
      ? `untuk ${targetStudents[0].nama}`
      : selectedClass && selectedClass !== 'ALL'
        ? `kelas ${selectedClass}`
        : 'semua santri aktif';
    if (!rowsToAppend.length) {
      return {
        ok: true,
        created: 0,
        skipped: skippedCount,
        message: `Tidak ada tagihan baru ${targetLabel}. ${skippedCount} santri sudah punya tagihan periode ini.`
      };
    }

    return {
      ok: true,
      created: rowsToAppend.length,
      skipped: skippedCount,
      message: `Berhasil membuat ${rowsToAppend.length} tagihan ${targetLabel}. ${skippedCount ? skippedCount + ' dilewati karena sudah ada.' : ''}`.trim(),
      notification_preview: notificationPreview.ok ? notificationPreview.data : null
    };
  } catch (error) {
    return { ok: false, message: error.toString() };
  } finally {
    lock.releaseLock();
  }
}

function getArrearsRecap() {
  return {
    ok: true,
    data: buildArrearsRecap(
      getSheetData('santri'),
      getSheetData('billings'),
      getSheetData('transactions')
    )
  };
}

function getArrearsWhatsAppPreview(idSantri) {
  try {
    const arrears = buildArrearsRecap(
      getSheetData('santri'),
      getSheetData('billings'),
      getSheetData('transactions')
    ).filter(item => item.id_santri === normalizeText(idSantri));
    if (!arrears.length) throw new Error('Tidak ada tunggakan aktif untuk santri ini');

    const first = arrears[0];
    const total = arrears.reduce((sum, item) => sum + normalizeNumber(item.remaining_amount || item.nominal), 0);
    const settings = getWhatsAppSettings();
    const sender = settings.ok ? settings.data.wa_sender_name : DEFAULT_APP_SETTINGS.wa_sender_name;
    const periods = arrears.map(item => `- ${item.bulan} ${item.tahun}: ${formatCurrencyIDR(item.remaining_amount || item.nominal)}`).join('\n');
    const message = [
      `Assalamu'alaikum Wali Santri ${first.nama},`,
      '',
      `Berikut rekap tunggakan SPP an. ${first.nama} (${first.kelas || '-'}) :`,
      periods,
      '',
      `Total tunggakan: ${formatCurrencyIDR(total)}`,
      '',
      'Mohon dapat diselesaikan melalui kanal pembayaran yang tersedia. Jika sudah melakukan pembayaran, silakan abaikan pesan ini atau kirimkan konfirmasi kepada admin.',
      '',
      `Terima kasih.\n${sender}`
    ].join('\n');
    const target = getStudentWhatsAppTarget({ kontak_ortu: first.kontak });

    return {
      ok: true,
      data: {
        student_name: first.nama,
        class_name: first.kelas || '-',
        total,
        bill_count: arrears.length,
        items: arrears.map(item => ({
          billing_label: `${item.bulan} ${item.tahun}`,
          amount: normalizeNumber(item.remaining_amount || item.nominal),
          paid_amount: normalizeNumber(item.paid_amount)
        })),
        phone: target.phone,
        raw_phone: target.raw_phone,
        is_valid_phone: target.is_valid,
        message,
        link: target.is_valid ? buildWhatsAppLink(target.phone, message) : '',
        note: target.is_valid ? 'Siap dibuka di WhatsApp' : target.raw_phone ? 'Nomor orang tua perlu diperbaiki' : 'Kontak orang tua belum diisi'
      }
    };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function buildArrearsRecap(santri, billings, transactions) {
  const paidAmountByBillingId = buildPaidAmountByBillingId(transactions);
  const studentById = (santri || []).reduce((map, student) => {
    map[student.id_santri] = student;
    return map;
  }, {});

  return (billings || [])
    .filter(billing => billing.status === 'Belum Lunas')
    .map(billing => enrichBillWithPaymentStatus(billing, paidAmountByBillingId))
    .filter(billing => billing.remaining_amount > 0)
    .map(billing => {
      const student = studentById[billing.id_santri];
      return {
        ...billing,
        nama: student ? student.nama : 'Unknown',
        kelas: student ? student.kelas : '-',
        kontak: student ? student.kontak_ortu : ''
      };
    });
}

function updateBilling(idBilling, billingData) {
  try {
    const bill = getSheetData('billings').find(item => item.id_billing === idBilling);
    if (!bill) throw new Error('Tagihan tidak ditemukan');
    if (getPaidAmountForBilling(idBilling) > 0) {
      throw new Error('Tagihan yang sudah dibayar sebagian/lunas tidak bisa diedit nominal atau periode');
    }

    const month = normalizeText(billingData && billingData.bulan) || bill.bulan;
    const year = normalizeText(billingData && billingData.tahun) || bill.tahun;
    const nominal = normalizeNumber(billingData && billingData.nominal, normalizeNumber(bill.nominal));
    const description = normalizeText(billingData && billingData.description) || `Tagihan SPP ${month} ${year}`;

    if (MONTHS_ID.indexOf(month) === -1) throw new Error('Bulan tagihan tidak valid');
    if (!year || nominal <= 0) throw new Error('Tahun dan nominal wajib diisi lebih dari nol');

    const duplicate = getSheetData('billings').some(item => (
      item.id_billing !== idBilling &&
      item.id_santri === bill.id_santri &&
      normalizeText(item.bulan) === month &&
      normalizeText(item.tahun) === year
    ));
    if (duplicate) throw new Error('Tagihan santri untuk periode ini sudah ada');

    updateSheetRowByKey('billings', 'id_billing', idBilling, {
      bulan: month,
      tahun: year,
      nominal,
      description
    });
    updateBillingJournalAmount(idBilling, nominal);

    return { ok: true, message: 'Tagihan berhasil diperbarui' };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function deleteBilling(idBilling) {
  try {
    const bill = getSheetData('billings').find(item => item.id_billing === idBilling);
    if (!bill) throw new Error('Tagihan tidak ditemukan');
    if (getSheetData('transactions').some(transaction => transaction.id_billing === idBilling)) {
      throw new Error('Tagihan yang sudah punya transaksi pembayaran tidak bisa dihapus');
    }

    const deleted = deleteSheetRowByKey('billings', 'id_billing', idBilling);
    if (!deleted) throw new Error('Tagihan tidak ditemukan');
    voidJournalBySource('billing', idBilling, 'System');

    return { ok: true, message: 'Tagihan berhasil dihapus' };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}
