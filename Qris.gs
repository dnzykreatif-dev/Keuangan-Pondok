function parseEmvTlvPayload(payload) {
  const text = normalizeText(payload);
  if (!text) throw new Error('Payload QRIS belum diisi');

  const items = [];
  let index = 0;

  while (index + 4 <= text.length) {
    const tag = text.slice(index, index + 2);
    const lengthText = text.slice(index + 2, index + 4);
    const length = Number(lengthText);

    if (!/^\d{2}$/.test(tag) || !/^\d{2}$/.test(lengthText) || !Number.isFinite(length)) {
      throw new Error('Format payload QRIS tidak valid');
    }

    const value = text.slice(index + 4, index + 4 + length);
    if (value.length !== length) {
      throw new Error('Payload QRIS terpotong atau tidak valid');
    }

    items.push({ tag, value });
    index += 4 + length;

    if (tag === '63') {
      break;
    }
  }

  return items;
}

function serializeEmvTlvPayload(items) {
  return items.map(item => {
    const value = String(item.value || '');
    const length = value.length.toString().padStart(2, '0');
    return `${item.tag}${length}${value}`;
  }).join('');
}

function crc16Emv(text) {
  let crc = 0xFFFF;
  for (let index = 0; index < text.length; index++) {
    crc ^= text.charCodeAt(index) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function formatQrisAmount(amount) {
  const value = Math.round(normalizeNumber(amount));
  if (value <= 0) throw new Error('Nominal QRIS harus lebih dari nol');
  return String(value);
}

function buildDynamicQrisPayload(staticPayload, amount) {
  const items = parseEmvTlvPayload(staticPayload);
  const amountText = formatQrisAmount(amount);
  const filteredItems = items.filter(item => item.tag !== '54' && item.tag !== '63');
  filteredItems.push({ tag: '54', value: amountText });

  const payloadWithoutCrc = serializeEmvTlvPayload(filteredItems);
  const crcInput = `${payloadWithoutCrc}6304`;
  const crc = crc16Emv(crcInput);
  return `${crcInput}${crc}`;
}

function getOldestUnpaidBillingForSantri(idSantri) {
  return getSheetData('billings')
    .filter(item => item.id_santri === idSantri)
    .map(enrichBillWithPaymentStatus)
    .filter(item => item.remaining_amount > 0)
    .sort((a, b) => {
      const yearDiff = normalizeNumber(a.tahun) - normalizeNumber(b.tahun);
      if (yearDiff !== 0) return yearDiff;
      return MONTHS_ID.indexOf(a.bulan) - MONTHS_ID.indexOf(b.bulan);
    })[0] || null;
}

function buildDynamicQrisResponse(student, bill) {
  if (!bill) throw new Error('Tidak ada tagihan yang belum lunas');

  const basePayload = getAppSettingValue('qris_id');
  if (!normalizeText(basePayload)) throw new Error('QRIS payload belum diisi di Pengaturan');

  const amount = normalizeNumber(bill.remaining_amount || bill.nominal);
  if (amount <= 0) throw new Error('Nominal tagihan tidak valid');

  const qrPayload = buildDynamicQrisPayload(basePayload, amount);

  return {
    ok: true,
    data: {
      student_name: student.nama,
      billing_label: `${bill.bulan} ${bill.tahun}`,
      amount,
      qr_text: qrPayload,
      note: 'Scan dengan aplikasi bank/e-wallet'
    }
  };
}

function generateDynamicQrisForSantri(id_santri) {
  try {
    const student = getSheetData('santri').find(item => item.id_santri === id_santri);
    if (!student) throw new Error('Data santri tidak ditemukan');

    const bill = getOldestUnpaidBillingForSantri(id_santri);
    return buildDynamicQrisResponse(student, bill);
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function generateDynamicQrisForBilling(idBilling) {
  try {
    const bill = getSheetData('billings')
      .map(enrichBillWithPaymentStatus)
      .find(item => item.id_billing === idBilling);
    if (!bill) throw new Error('Tagihan tidak ditemukan');
    if (bill.remaining_amount <= 0) throw new Error('Tagihan sudah lunas');

    const student = getSheetData('santri').find(item => item.id_santri === bill.id_santri);
    if (!student) throw new Error('Data santri tidak ditemukan');

    return buildDynamicQrisResponse(student, bill);
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}
