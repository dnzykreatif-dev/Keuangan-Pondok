function seedPaymentDefaults() {
  ensurePaymentSheets();

  const providerSheet = getSheetOrThrow('payment_providers');
  appendMissingRowsByKey(providerSheet, 0, DEFAULT_PAYMENT_PROVIDERS);
}

function ensurePaymentSheets() {
  [
    'payment_providers',
    'payment_orders',
    'payment_events',
    'reconciliation_logs'
  ].forEach(sheetName => ensureSheet(sheetName, SHEET_HEADERS[sheetName]));
}

function getActivePaymentProviders() {
  seedPaymentDefaults();
  return getSheetData('payment_providers').filter(provider => isTruthyValue(provider.is_active));
}

function getPaymentProvider(providerId) {
  const selectedProviderId = normalizeText(providerId || getConfiguredPaymentProviderId());
  const provider = getActivePaymentProviders().find(item => item.provider_id === selectedProviderId);
  if (!provider) {
    throw new Error(`Payment provider aktif tidak ditemukan: ${selectedProviderId}`);
  }
  return provider;
}

function createMockQrisInvoice(order, bill, student) {
  const qrPayload = [
    'QRIS-MOCK',
    order.order_id,
    order.amount,
    student ? student.nama : '',
    bill ? `${bill.bulan} ${bill.tahun}` : ''
  ].join('|');

  return {
    provider_reference: order.order_id,
    payment_url: `https://qris.local/mock/${encodeURIComponent(order.order_id)}`,
    qr_string: qrPayload,
    status: 'PENDING',
    expires_at: new Date(Date.now() + 60 * 60 * 1000)
  };
}

function createDuitkuInvoice(order, bill, student) {
  const merchantCode = getAppProperty('DUITKU_MERCHANT_CODE');
  const apiKey = getAppProperty('DUITKU_API_KEY');
  const endpoint = getAppProperty('DUITKU_CREATE_INVOICE_URL', 'https://api-sandbox.duitku.com/api/merchant/createInvoice');
  const qrisMethod = getAppProperty('DUITKU_QRIS_METHOD', '');

  if (!merchantCode || !apiKey) {
    throw new Error('DUITKU_MERCHANT_CODE dan DUITKU_API_KEY belum diisi di Script Properties');
  }

  const timestamp = String(Date.now());
  const signature = bytesToHex(Utilities.computeHmacSha256Signature(merchantCode + timestamp, apiKey));
  const productDetails = bill
    ? `Tagihan ${bill.billing_type || 'SPP'} ${bill.bulan || ''} ${bill.tahun || ''}`.trim()
    : `Pembayaran ${order.source_type}`;

  const payload = {
    paymentAmount: normalizeNumber(order.amount),
    merchantOrderId: order.order_id,
    productDetails,
    paymentMethod: qrisMethod,
    customerVaName: student ? student.nama : 'Wali Santri',
    email: `${order.id_santri || 'wali'}@keuangan-pondok.local`,
    phoneNumber: student ? student.kontak_ortu : '',
    itemDetails: [{
      name: productDetails,
      price: normalizeNumber(order.amount),
      quantity: 1
    }],
    customerDetail: {
      firstName: student ? student.nama : 'Wali Santri',
      phoneNumber: student ? student.kontak_ortu : ''
    },
    callbackUrl: getAppProperty('PAYMENT_CALLBACK_URL', ''),
    returnUrl: getAppProperty('PAYMENT_RETURN_URL', ''),
    expiryPeriod: normalizeNumber(getAppProperty('PAYMENT_EXPIRY_MINUTES', '60'), 60)
  };

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-duitku-timestamp': timestamp,
      'x-duitku-signature': signature,
      'x-duitku-merchantcode': merchantCode
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const statusCode = response.getResponseCode();
  const result = JSON.parse(response.getContentText() || '{}');

  if (statusCode < 200 || statusCode >= 300 || result.statusCode !== '00') {
    throw new Error(result.statusMessage || response.getContentText());
  }

  return {
    provider_reference: result.reference || order.order_id,
    payment_url: result.paymentUrl || '',
    qr_string: result.qrString || '',
    status: 'PENDING',
    expires_at: new Date(Date.now() + normalizeNumber(payload.expiryPeriod, 60) * 60 * 1000)
  };
}

function getPaymentAdapter(providerId) {
  const provider = getPaymentProvider(providerId);

  if (provider.provider_id === 'DUITKU') {
    return {
      provider,
      createInvoice: createDuitkuInvoice,
      checkStatus: checkLocalPaymentStatus,
      verifySignature: verifyDuitkuCallback,
      normalizeCallback: normalizeDuitkuCallback
    };
  }

  return {
    provider,
    createInvoice: createMockQrisInvoice,
    checkStatus: checkLocalPaymentStatus,
    verifySignature: () => true,
    normalizeCallback: normalizeGenericCallback
  };
}

function checkLocalPaymentStatus(orderId) {
  return getPaymentOrderByAnyReference(orderId);
}

function buildPaymentOrder(payment, bill) {
  const now = new Date();
  return {
    order_id: `PAY-${bill.id_billing}-${now.getTime()}`,
    provider_id: normalizeText(payment.provider_id || getConfiguredPaymentProviderId()),
    source_type: payment.source_type || 'billing',
    source_id: payment.source_id || bill.id_billing,
    id_santri: payment.id_santri || bill.id_santri,
    id_billing: bill.id_billing,
    amount: normalizeNumber(payment.amount || bill.nominal),
    currency: APP_CONFIG.DEFAULT_CURRENCY,
    status: 'PENDING',
    created_at: now,
    created_by: payment.penerima || payment.created_by || 'System'
  };
}

function createPaymentOrder(payment) {
  try {
    seedPaymentDefaults();

    const billings = getSheetData('billings');
    const bill = billings.find(item => item.id_billing === payment.id_billing);
    if (!bill) throw new Error('Tagihan tidak ditemukan');
    if (bill.status === 'Lunas') throw new Error('Tagihan sudah lunas');

    const student = getSheetData('santri').find(item => item.id_santri === (payment.id_santri || bill.id_santri));
    if (!student) throw new Error('Data santri tidak ditemukan');

    const order = buildPaymentOrder(payment, bill);
    const adapter = getPaymentAdapter(order.provider_id);
    const invoice = adapter.createInvoice(order, bill, student);
    const orderRecord = {
      ...order,
      status: invoice.status || 'PENDING',
      payment_url: invoice.payment_url || '',
      qr_string: invoice.qr_string || '',
      provider_reference: invoice.provider_reference || order.order_id,
      expires_at: invoice.expires_at || '',
      paid_at: ''
    };

    appendObjectRow('payment_orders', orderRecord);
    storePendingTransaction(order.order_id, orderRecord, bill);
    recordPaymentEvent(order.order_id, order.provider_id, 'CREATE_ORDER', orderRecord.status, orderRecord);

    return {
      ok: true,
      order_id: order.order_id,
      provider_id: order.provider_id,
      status: orderRecord.status,
      payment_url: orderRecord.payment_url,
      qr_string: orderRecord.qr_string,
      link: orderRecord.payment_url
    };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function storePendingTransaction(orderId, order, bill) {
  const sheet = getSheetOrThrow('transactions');
  sheet.appendRow([
    orderId,
    order.id_santri,
    bill.id_billing,
    new Date(),
    normalizeNumber(order.amount),
    'QRIS',
    'PENDING',
    order.created_by || 'System'
  ]);
}

function processPayment(payment) {
  return createPaymentOrder(payment);
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

  return createPaymentOrder({
    id_santri,
    id_billing: bill.id_billing,
    penerima: 'System'
  });
}

function getPaymentOrders(limit) {
  seedPaymentDefaults();
  const maxRows = normalizeNumber(limit, 50);
  const data = getSheetData('payment_orders')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, maxRows);
  return { ok: true, data };
}

function updateTransactionStatus(orderId, status) {
  return updateSheetRowByKey('transactions', 'id_transaksi', orderId, { status });
}

function getTransactionByOrderId(orderId) {
  return getSheetData('transactions').find(transaction => transaction.id_transaksi === orderId);
}

function getPaymentOrderByAnyReference(reference) {
  const ref = normalizeText(reference);
  return getSheetData('payment_orders').find(order => (
    order.order_id === ref ||
    order.provider_reference === ref ||
    order.source_id === ref
  ));
}

function markBillingAsPaid(idBilling) {
  return updateSheetRowByKey('billings', 'id_billing', idBilling, { status: 'Lunas' });
}

function recordPaymentEvent(orderId, providerId, eventType, status, payload) {
  appendObjectRow('payment_events', {
    event_id: generateId('PE'),
    order_id: orderId,
    provider_id: providerId,
    event_type: eventType,
    status,
    payload: JSON.stringify(payload || {}),
    created_at: new Date()
  });
}

function recordReconciliationLog(order, status, details) {
  appendObjectRow('reconciliation_logs', {
    log_id: generateId('REC'),
    order_id: order.order_id,
    source_type: order.source_type,
    source_id: order.source_id,
    status,
    details,
    created_at: new Date()
  });
}

function normalizeGenericCallback(payload) {
  const orderId = payload.order_id || payload.orderId || payload.merchantOrderId || payload.reference;
  const status = String(payload.status || payload.transaction_status || payload.resultCode || '').toUpperCase();
  const amount = payload.amount || payload.gross_amount || payload.paymentAmount;

  return {
    order_id: orderId,
    provider_reference: payload.reference || orderId,
    status,
    amount,
    is_paid: ['00', 'PAID', 'SUCCESS', 'SETTLEMENT', 'CAPTURE'].indexOf(status) !== -1
  };
}

function normalizeDuitkuCallback(payload) {
  return normalizeGenericCallback(payload);
}

function verifyDuitkuCallback(payload) {
  const callbackSecret = getAppProperty('DUITKU_CALLBACK_SECRET');
  if (!callbackSecret) return true;

  const signature = payload.signature || payload.callbackSignature;
  if (!signature) return false;

  const base = [
    payload.merchantCode || '',
    payload.amount || payload.paymentAmount || '',
    payload.merchantOrderId || '',
    callbackSecret
  ].join('');
  const expected = bytesToHex(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, base));
  return String(signature).toLowerCase() === expected.toLowerCase();
}

function completePaidOrder(order, normalized, providerName) {
  const amount = normalizeNumber(normalized.amount || order.amount);
  const billing = getSheetData('billings').find(item => item.id_billing === order.id_billing) || {};
  markBillingAsPaid(order.id_billing);
  updateTransactionStatus(order.order_id, 'PAID');
  updateSheetRowByKey('payment_orders', 'order_id', order.order_id, {
    status: 'PAID',
    provider_reference: normalized.provider_reference || order.provider_reference,
    paid_at: new Date()
  });
  if (!cashTransactionExists('payment', order.order_id)) {
    recordCashTransaction({
      direction: 'Masuk',
      source_type: 'payment',
      source_id: order.order_id,
      amount,
      method: providerName || 'QRIS',
      description: `Pembayaran SPP ${order.id_billing}`,
      fund_id: billing.fund_id || getDefaultFundId(),
      unit_id: billing.unit_id || getDefaultUnitId(),
      program_id: billing.program_id || getDefaultProgramId(),
      created_by: providerName || 'QRIS'
    });
  }
  const journalResult = postPaymentJournal(order.order_id, order.id_billing, amount, providerName || 'QRIS');
  recordReconciliationLog(order, 'PAID', journalResult.skipped ? 'Jurnal pembayaran sudah pernah dibuat' : 'Jurnal pembayaran dibuat');
}

function recordDirectPayment(payment) {
  try {
    seedOperationalDefaults();

    const method = normalizeText(payment.method);
    if (['Tunai', 'Transfer'].indexOf(method) === -1) {
      throw new Error('Pembayaran langsung hanya mendukung Tunai atau Transfer');
    }

    const bill = getSheetData('billings').find(item => item.id_billing === payment.id_billing);
    if (!bill) throw new Error('Tagihan tidak ditemukan');
    if (bill.status === 'Lunas') throw new Error('Tagihan sudah lunas');

    const amount = normalizeNumber(payment.amount || bill.nominal);
    if (amount <= 0) throw new Error('Nominal pembayaran harus lebih dari nol');

    const paymentId = generateId('PAYCASH');
    const proofUrl = saveOptionalProof(payment.proofBase64, paymentId);
    const actor = payment.penerima || payment.created_by || 'System';

    markBillingAsPaid(bill.id_billing);
    appendObjectRow('transactions', {
      id_transaksi: paymentId,
      id_santri: bill.id_santri,
      id_billing: bill.id_billing,
      tanggal: new Date(),
      jumlah_bayar: amount,
      metode: method,
      status: 'PAID',
      penerima: actor
    });
    recordCashTransaction({
      direction: 'Masuk',
      source_type: 'payment',
      source_id: paymentId,
      amount,
      method,
      description: `Pembayaran SPP ${bill.bulan} ${bill.tahun}`,
      proof_url: proofUrl,
      fund_id: bill.fund_id || getDefaultFundId(),
      unit_id: bill.unit_id || getDefaultUnitId(),
      program_id: bill.program_id || getDefaultProgramId(),
      created_by: actor
    });
    postPaymentJournal(paymentId, bill.id_billing, amount, method);

    return { ok: true, message: 'Pembayaran berhasil dicatat', data: { payment_id: paymentId } };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function handlePaymentCallback(payload) {
  seedPaymentDefaults();

  const candidateOrder = getPaymentOrderByAnyReference(
    payload.order_id || payload.orderId || payload.merchantOrderId || payload.reference
  );
  if (!candidateOrder) {
    recordPaymentEvent('', '', 'CALLBACK_UNKNOWN_ORDER', 'IGNORED', payload);
    return { ok: false, message: 'Payment order tidak ditemukan' };
  }

  const adapter = getPaymentAdapter(candidateOrder.provider_id);
  if (!adapter.verifySignature(payload)) {
    recordPaymentEvent(candidateOrder.order_id, candidateOrder.provider_id, 'CALLBACK_REJECTED', 'INVALID_SIGNATURE', payload);
    return { ok: false, message: 'Signature callback tidak valid' };
  }

  const normalized = adapter.normalizeCallback(payload);
  recordPaymentEvent(candidateOrder.order_id, candidateOrder.provider_id, 'CALLBACK', normalized.status, payload);

  if (normalized.is_paid) {
    completePaidOrder(candidateOrder, normalized, adapter.provider.name);
    return { ok: true, status: 'PAID' };
  }

  updateSheetRowByKey('payment_orders', 'order_id', candidateOrder.order_id, { status: normalized.status || 'PENDING' });
  updateTransactionStatus(candidateOrder.order_id, normalized.status || 'PENDING');
  recordReconciliationLog(candidateOrder, normalized.status || 'PENDING', 'Callback belum berstatus lunas');
  return { ok: true, status: normalized.status || 'PENDING' };
}

function checkPaymentStatus(orderId) {
  const order = getPaymentOrderByAnyReference(orderId);
  if (!order) return { ok: false, message: 'Payment order tidak ditemukan' };
  return { ok: true, data: order };
}

function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents || '{}');
    const result = handlePaymentCallback(postData);
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
