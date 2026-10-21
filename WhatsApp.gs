function ensureWhatsAppSheets() {
  ensureSheet('notification_logs', SHEET_HEADERS.notification_logs);
}

function seedWhatsAppDefaults() {
  ensureWhatsAppSheets();
}

function getDefaultAppSettings() {
  return { ...DEFAULT_APP_SETTINGS };
}

function getWhatsAppSettings() {
  const settings = getAppSettings();
  if (!settings.ok) return { ok: false, message: settings.message || 'Pengaturan tidak tersedia' };

  const data = settings.data || {};
  return {
    ok: true,
    data: {
      wa_enabled: normalizeText(data.wa_enabled || DEFAULT_APP_SETTINGS.wa_enabled),
      wa_mode: normalizeText(data.wa_mode || DEFAULT_APP_SETTINGS.wa_mode),
      wa_sender_name: normalizeText(data.wa_sender_name || DEFAULT_APP_SETTINGS.wa_sender_name),
      wa_gateway_url: normalizeText(data.wa_gateway_url || DEFAULT_APP_SETTINGS.wa_gateway_url),
      wa_gateway_api_key_property: normalizeText(data.wa_gateway_api_key_property || DEFAULT_APP_SETTINGS.wa_gateway_api_key_property),
      wa_gateway_auth_header: normalizeText(data.wa_gateway_auth_header || DEFAULT_APP_SETTINGS.wa_gateway_auth_header),
      wa_gateway_auth_prefix: normalizeText(data.wa_gateway_auth_prefix || DEFAULT_APP_SETTINGS.wa_gateway_auth_prefix),
      wa_gateway_phone_field: normalizeText(data.wa_gateway_phone_field || DEFAULT_APP_SETTINGS.wa_gateway_phone_field),
      wa_gateway_message_field: normalizeText(data.wa_gateway_message_field || DEFAULT_APP_SETTINGS.wa_gateway_message_field),
      wa_gateway_extra_payload: normalizeText(data.wa_gateway_extra_payload || DEFAULT_APP_SETTINGS.wa_gateway_extra_payload),
      wa_admin_phone: normalizeText(data.wa_admin_phone || DEFAULT_APP_SETTINGS.wa_admin_phone),
      wa_admin_payment_template: normalizeText(data.wa_admin_payment_template || DEFAULT_APP_SETTINGS.wa_admin_payment_template),
      wa_tagihan_template: normalizeText(data.wa_tagihan_template || DEFAULT_APP_SETTINGS.wa_tagihan_template),
      wa_lunas_template: normalizeText(data.wa_lunas_template || DEFAULT_APP_SETTINGS.wa_lunas_template)
    }
  };
}

function isWhatsAppEnabled() {
  const settings = getWhatsAppSettings();
  if (!settings.ok) return false;
  return String(settings.data.wa_enabled || '').toUpperCase() !== 'FALSE';
}

function normalizeWhatsAppPhone(phone) {
  const digits = normalizeText(phone).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return digits;
}

function isValidWhatsAppPhone(phone) {
  return /^62\d{8,13}$/.test(normalizeWhatsAppPhone(phone));
}

function formatCurrencyIDR(amount) {
  const value = Math.round(normalizeNumber(amount));
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value);
}

function escapeWhatsAppTemplateValue(value) {
  return normalizeText(value);
}

function renderWhatsAppTemplate(template, values) {
  const source = normalizeText(template);
  return source.replace(/\{([a-zA-Z0-9_]+)\}/g, function (_, key) {
    const value = values && Object.prototype.hasOwnProperty.call(values, key) ? values[key] : '';
    return escapeWhatsAppTemplateValue(value);
  }).replace(/\\n/g, '\n');
}

function buildWhatsAppMessage(template, context) {
  return renderWhatsAppTemplate(template, {
    sender_name: context.sender_name || '',
    school_name: context.school_name || '',
    wali_name: context.wali_name || 'Wali Santri',
    student_name: context.student_name || '',
    class_name: context.class_name || '',
    billing_label: context.billing_label || '',
    amount: context.amount_text || formatCurrencyIDR(context.amount || 0),
    payment_date: context.payment_date || '',
    payment_method: context.payment_method || '',
    payment_id: context.payment_id || '',
    remaining_amount: context.remaining_amount_text || formatCurrencyIDR(context.remaining_amount || 0),
    notes: context.notes || ''
  });
}

function buildWhatsAppLink(phone, message) {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) return '';
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message || '')}`;
}

function isWhatsAppGatewayMode(settings) {
  const data = settings && settings.data ? settings.data : settings;
  return String(data && data.wa_mode || '').toUpperCase() === 'API_GATEWAY';
}

function parseWhatsAppExtraPayload(rawValue) {
  const text = normalizeText(rawValue);
  if (!text) return {};

  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    throw new Error('Format payload tambahan WA harus JSON object yang valid');
  }
}

function sendWhatsAppGatewayMessage(phone, message, settings) {
  const waSettings = settings && settings.data ? settings.data : settings;
  const endpoint = normalizeText(waSettings && waSettings.wa_gateway_url);
  if (!endpoint) throw new Error('URL gateway WhatsApp belum diisi di Pengaturan');

  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!isValidWhatsAppPhone(normalizedPhone)) throw new Error('Nomor WhatsApp tidak valid');

  const phoneField = normalizeText(waSettings.wa_gateway_phone_field) || 'phone';
  const messageField = normalizeText(waSettings.wa_gateway_message_field) || 'message';
  const payload = {
    ...parseWhatsAppExtraPayload(waSettings.wa_gateway_extra_payload),
    [phoneField]: normalizedPhone,
    [messageField]: message
  };

  const headers = {};
  const apiKeyProperty = normalizeText(waSettings.wa_gateway_api_key_property) || 'WA_API_KEY';
  const apiKey = getAppProperty(apiKeyProperty);
  if (apiKey) {
    const headerName = normalizeText(waSettings.wa_gateway_auth_header) || 'Authorization';
    const prefix = normalizeText(waSettings.wa_gateway_auth_prefix);
    headers[headerName] = prefix ? `${prefix} ${apiKey}` : apiKey;
  }

  const response = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const statusCode = response.getResponseCode();
  const responseText = response.getContentText();

  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`Gateway WA gagal (${statusCode}): ${responseText}`);
  }

  return {
    ok: true,
    status_code: statusCode,
    response: responseText
  };
}

function getStudentWhatsAppTarget(student) {
  const phone = normalizeWhatsAppPhone(student && student.kontak_ortu);
  return {
    raw_phone: normalizeText(student && student.kontak_ortu),
    phone,
    is_valid: isValidWhatsAppPhone(phone)
  };
}

function buildWhatsAppStudentContext(student, bill) {
  return {
    student_name: student ? student.nama : '',
    class_name: student ? student.kelas : '',
    wali_name: student ? student.nama : 'Wali Santri',
    billing_label: bill ? `${bill.bulan} ${bill.tahun}` : '',
    amount: bill ? normalizeNumber(bill.remaining_amount || bill.nominal) : 0,
    amount_text: formatCurrencyIDR(bill ? (bill.remaining_amount || bill.nominal) : 0),
    sender_name: getWhatsAppSettings().ok ? getWhatsAppSettings().data.wa_sender_name : DEFAULT_APP_SETTINGS.wa_sender_name
  };
}

function recordNotificationLog(type, student, bill, phone, message, status, createdBy) {
  seedWhatsAppDefaults();
  appendObjectRow('notification_logs', {
    log_id: generateId('WALOG'),
    type: normalizeText(type),
    id_santri: student && student.id_santri ? student.id_santri : '',
    id_billing: bill && bill.id_billing ? bill.id_billing : '',
    phone: normalizeText(phone),
    message: normalizeText(message),
    status: normalizeText(status) || 'PREPARED',
    created_at: new Date(),
    created_by: normalizeText(createdBy) || 'System'
  });
}

function deliverWhatsAppNotification(type, student, bill, phone, message, createdBy, settings) {
  const waSettings = settings || getWhatsAppSettings();
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!isValidWhatsAppPhone(normalizedPhone)) {
    const status = normalizedPhone ? 'INVALID_PHONE' : 'MISSING_PHONE';
    recordNotificationLog(type, student, bill, normalizedPhone, message, status, createdBy);
    return { ok: false, status, message: status === 'INVALID_PHONE' ? 'Nomor tidak valid' : 'Nomor belum diisi' };
  }

  if (!isWhatsAppGatewayMode(waSettings)) {
    recordNotificationLog(type, student, bill, normalizedPhone, message, 'READY', createdBy);
    return { ok: true, status: 'READY', link: buildWhatsAppLink(normalizedPhone, message) };
  }

  try {
    const result = sendWhatsAppGatewayMessage(normalizedPhone, message, waSettings);
    recordNotificationLog(type, student, bill, normalizedPhone, message, 'SENT', createdBy);
    return { ok: true, status: 'SENT', gateway: result };
  } catch (error) {
    recordNotificationLog(type, student, bill, normalizedPhone, message, 'FAILED', createdBy);
    return { ok: false, status: 'FAILED', message: error.toString() };
  }
}

function buildBillingWhatsAppPreview(bills, createdBy) {
  seedWhatsAppDefaults();

  const waSettings = getWhatsAppSettings();
  if (!waSettings.ok || !isWhatsAppEnabled()) {
    return {
      ok: true,
      data: {
        enabled: false,
        items: [],
        summary: {
          total: 0,
          valid: 0,
          invalid: 0,
          missing_phone: 0
        }
      }
    };
  }

  const students = getSheetData('santri');
  const gatewayMode = isWhatsAppGatewayMode(waSettings);
  const items = (bills || []).map(bill => {
    const student = students.find(item => item.id_santri === bill.id_santri);
    const target = getStudentWhatsAppTarget(student || {});
    const context = {
      ...buildWhatsAppStudentContext(student, bill),
      sender_name: waSettings.data.wa_sender_name
    };
    const message = buildWhatsAppMessage(waSettings.data.wa_tagihan_template, context);
    const delivery = deliverWhatsAppNotification('BILLING', student, bill, target.phone, message, createdBy, waSettings);
    const status = delivery.status;

    return {
      id_santri: bill.id_santri,
      id_billing: bill.id_billing,
      student_name: student ? student.nama : '-',
      class_name: student ? student.kelas : '-',
      billing_label: `${bill.bulan} ${bill.tahun}`,
      amount: normalizeNumber(bill.nominal),
      amount_text: formatCurrencyIDR(bill.nominal),
      raw_phone: target.raw_phone,
      phone: target.phone,
      is_valid_phone: target.is_valid,
      status,
      message,
      link: delivery.link || '',
      preview_text: message,
      note: target.is_valid
        ? gatewayMode
          ? (delivery.ok ? 'Terkirim lewat gateway WA' : delivery.message || 'Gagal dikirim lewat gateway WA')
          : 'Siap dibuka di WhatsApp'
        : target.raw_phone
          ? 'Nomor tidak valid atau belum lengkap'
          : 'Kontak orang tua belum diisi'
    };
  });

  const summary = items.reduce((result, item) => {
    result.total += 1;
    if (item.is_valid_phone) {
      result.valid += 1;
      if (item.status === 'SENT') result.sent += 1;
      if (item.status === 'FAILED') result.failed += 1;
    } else if (!item.raw_phone) {
      result.missing_phone += 1;
    } else {
      result.invalid += 1;
    }
    return result;
  }, {
    total: 0,
    valid: 0,
    invalid: 0,
    missing_phone: 0,
    sent: 0,
    failed: 0
  });

  return {
    ok: true,
    data: {
      enabled: true,
      mode: waSettings.data.wa_mode,
      title: gatewayMode ? 'Hasil Kirim Notifikasi WhatsApp Tagihan' : 'Preview Notifikasi WhatsApp Tagihan',
      subtitle: gatewayMode ? 'Pesan dikirim otomatis lewat gateway WA yang dikonfigurasi.' : 'Admin bisa buka link satu per satu sebelum mengirim ke wali santri.',
      sender_name: waSettings.data.wa_sender_name,
      summary,
      items
    }
  };
}

function buildReceiptWhatsAppPreview(student, bill, payment, createdBy) {
  seedWhatsAppDefaults();

  const waSettings = getWhatsAppSettings();
  if (!waSettings.ok || !isWhatsAppEnabled()) {
    return {
      ok: true,
      data: {
        enabled: false
      }
    };
  }

  const target = getStudentWhatsAppTarget(student || {});
  const message = buildWhatsAppMessage(waSettings.data.wa_lunas_template, {
    ...buildWhatsAppStudentContext(student, bill),
    sender_name: waSettings.data.wa_sender_name,
    payment_date: payment ? formatDateForWhatsApp(payment.tanggal || new Date()) : formatDateForWhatsApp(new Date()),
    payment_method: payment ? payment.metode || '' : '',
    payment_id: payment ? payment.id_transaksi || '' : '',
    remaining_amount: 0,
    remaining_amount_text: formatCurrencyIDR(0),
    amount: payment ? normalizeNumber(payment.jumlah_bayar || bill.nominal) : normalizeNumber(bill.nominal),
    amount_text: formatCurrencyIDR(payment ? payment.jumlah_bayar || bill.nominal : bill.nominal)
  });
  const delivery = deliverWhatsAppNotification('RECEIPT', student, bill, target.phone, message, createdBy, waSettings);
  const status = delivery.status;

  return {
    ok: true,
    data: {
      enabled: true,
      title: 'Tanda Terima WhatsApp',
      sender_name: waSettings.data.wa_sender_name,
      student_name: student ? student.nama : '-',
      class_name: student ? student.kelas : '-',
      billing_label: bill ? `${bill.bulan} ${bill.tahun}` : '',
      amount_text: formatCurrencyIDR(payment ? payment.jumlah_bayar || bill.nominal : bill.nominal),
      phone: target.phone,
      raw_phone: target.raw_phone,
      is_valid_phone: target.is_valid,
      status,
      message,
      link: delivery.link || '',
      note: target.is_valid
        ? isWhatsAppGatewayMode(waSettings)
          ? (delivery.ok ? 'Terkirim lewat gateway WA' : delivery.message || 'Gagal dikirim lewat gateway WA')
          : 'Siap dibuka di WhatsApp'
        : target.raw_phone
          ? 'Nomor tidak valid atau belum lengkap'
          : 'Kontak orang tua belum diisi'
    }
  };
}

function sendAdminPaymentWhatsAppNotification(student, bill, payment, createdBy) {
  const waSettings = getWhatsAppSettings();
  if (!waSettings.ok || !isWhatsAppEnabled() || !isWhatsAppGatewayMode(waSettings)) {
    return { ok: true, skipped: true };
  }

  const adminPhone = normalizeWhatsAppPhone(waSettings.data.wa_admin_phone);
  if (!adminPhone) return { ok: true, skipped: true };

  const message = buildWhatsAppMessage(waSettings.data.wa_admin_payment_template, {
    ...buildWhatsAppStudentContext(student, bill),
    sender_name: waSettings.data.wa_sender_name,
    payment_date: payment ? formatDateForWhatsApp(payment.tanggal || new Date()) : formatDateForWhatsApp(new Date()),
    payment_method: payment ? payment.metode || '' : '',
    payment_id: payment ? payment.id_transaksi || '' : '',
    amount: payment ? normalizeNumber(payment.jumlah_bayar || bill.nominal) : normalizeNumber(bill.nominal),
    amount_text: formatCurrencyIDR(payment ? payment.jumlah_bayar || bill.nominal : bill.nominal)
  });

  return deliverWhatsAppNotification('ADMIN_PAYMENT', student, bill, adminPhone, message, createdBy, waSettings);
}

function testWhatsAppGateway(phone, message) {
  try {
    const waSettings = getWhatsAppSettings();
    if (!waSettings.ok) throw new Error(waSettings.message || 'Pengaturan WA tidak tersedia');
    if (!isWhatsAppEnabled()) throw new Error('Notifikasi WhatsApp masih nonaktif');
    if (!isWhatsAppGatewayMode(waSettings)) throw new Error('Mode WA harus API Gateway untuk tes kirim');

    const targetPhone = normalizeWhatsAppPhone(phone);
    const testMessage = normalizeText(message) || 'Tes notifikasi WhatsApp dari aplikasi Keuangan Pondok.';
    const result = deliverWhatsAppNotification(
      'TEST',
      null,
      null,
      targetPhone,
      testMessage,
      'Admin',
      waSettings
    );

    if (!result.ok) {
      return { ok: false, message: result.message || 'Tes kirim WhatsApp gagal', data: result };
    }

    return {
      ok: true,
      message: 'Tes kirim WhatsApp berhasil diproses gateway',
      data: result
    };
  } catch (error) {
    return { ok: false, message: error.toString() };
  }
}

function formatDateForWhatsApp(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(new Date(value));
}
