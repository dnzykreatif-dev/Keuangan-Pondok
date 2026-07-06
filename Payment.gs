function buildMidtransPayload(payment, bill, santri) {
  const orderId = `SPP-${bill.id_billing}-${Date.now()}`;
  return {
    orderId,
    payload: {
      transaction_details: {
        order_id: orderId,
        gross_amount: normalizeNumber(bill.nominal)
      },
      item_details: [{
        id: bill.id_billing,
        price: normalizeNumber(bill.nominal),
        quantity: 1,
        name: `Pembayaran SPP ${bill.bulan} ${bill.tahun} - ${santri.nama}`
      }],
      customer_details: {
        first_name: santri.nama,
        phone: santri.kontak_ortu
      }
    }
  };
}

function storePendingTransaction(orderId, payment, bill) {
  const sheet = getSheetOrThrow('transactions');
  sheet.appendRow([
    orderId,
    payment.id_santri,
    payment.id_billing,
    new Date(),
    normalizeNumber(bill.nominal),
    'Midtrans',
    'PENDING',
    payment.penerima || 'System'
  ]);
}

function createMidtransTransaction(payment) {
  try {
    const billings = getSheetData('billings');
    const bill = billings.find(item => item.id_billing === payment.id_billing);
    const santri = getSheetData('santri').find(item => item.id_santri === payment.id_santri);

    if (!bill) throw new Error('Tagihan tidak ditemukan');
    if (!santri) throw new Error('Data santri tidak ditemukan');

    const { orderId, payload } = buildMidtransPayload(payment, bill, santri);
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        Authorization: 'Basic ' + Utilities.base64Encode(getMidtransServerKey() + ':')
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(APP_CONFIG.MIDTRANS_SNAP_URL, options);
    const statusCode = response.getResponseCode();
    const result = JSON.parse(response.getContentText());

    if (statusCode < 200 || statusCode >= 300) {
      throw new Error(result && result.error_messages ? result.error_messages.join(', ') : response.getContentText());
    }

    storePendingTransaction(orderId, payment, bill);
    return {
      ok: true,
      token: result.token,
      redirect_url: result.redirect_url,
      order_id: orderId
    };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function processPayment(payment) {
  return createMidtransTransaction(payment);
}

function generatePaymentLink(id_santri) {
  const student = getSheetData('santri').find(item => item.id_santri === id_santri);
  if (!student) {
    return { ok: false, message: 'Data santri tidak ditemukan' };
  }

  const bill = getSheetData('billings')
    .filter(item => item.id_santri === id_santri && item.status === 'Belum Lunas')
    .sort((a, b) => {
      const yearDiff = normalizeNumber(a.tahun) - normalizeNumber(b.tahun);
      if (yearDiff !== 0) return yearDiff;
      return MONTHS_ID.indexOf(a.bulan) - MONTHS_ID.indexOf(b.bulan);
    })[0];

  if (!bill) {
    return { ok: false, message: 'Tidak ada tagihan yang belum lunas' };
  }

  return createMidtransTransaction({
    id_santri,
    id_billing: bill.id_billing,
    penerima: 'System'
  });
}

function updateTransactionStatus(orderId, status) {
  const sheet = getSheetOrThrow('transactions');
  const rows = sheet.getDataRange().getValues();

  for (let index = 1; index < rows.length; index++) {
    if (rows[index][0] === orderId) {
      sheet.getRange(index + 1, 7).setValue(status);
      return true;
    }
  }

  return false;
}

function markBillingAsPaid(idBilling) {
  const sheet = getSheetOrThrow('billings');
  const rows = sheet.getDataRange().getValues();

  for (let index = 1; index < rows.length; index++) {
    if (rows[index][0] === idBilling) {
      sheet.getRange(index + 1, 6).setValue('Lunas');
      return true;
    }
  }

  return false;
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents || '{}');
    const orderId = postData.order_id;
    const transactionStatus = postData.transaction_status;
    const fraudStatus = postData.fraud_status;

    if (!orderId) {
      throw new Error('order_id tidak ditemukan');
    }

    const idBilling = orderId.split('-')[1];

    const isSuccessfulPayment = (
      transactionStatus === 'settlement' ||
      (transactionStatus === 'capture' && fraudStatus === 'accept')
    );

    if (isSuccessfulPayment) {
      markBillingAsPaid(idBilling);
      updateTransactionStatus(orderId, 'SUCCESS');
    }

    return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
  } catch (error) {
    return ContentService.createTextOutput('Error: ' + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}
