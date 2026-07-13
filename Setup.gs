function setupDatabase() {
  for (const [sheetName, headers] of Object.entries(SHEET_HEADERS)) {
    ensureSheet(sheetName, headers);
  }

  seedAccountingDefaults();
  seedPaymentDefaults();
  seedOperationalDefaults();

  const userSheet = getSheetOrThrow('users');
  if (userSheet.getLastRow() === 1) {
    userSheet.appendRow([
      APP_CONFIG.DEFAULT_ADMIN_USERNAME,
      hashPassword(APP_CONFIG.DEFAULT_ADMIN_PASSWORD),
      'Admin'
    ]);
  }

  return 'Database setup complete. Default: admin / admin123';
}

function resetAndImportSantri() {
  const sheet = ensureSheet('santri', SHEET_HEADERS.santri);

  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }

  return importInitialSantri();
}

function importInitialSantri() {
  const sheet = ensureSheet('santri', SHEET_HEADERS.santri);
  const rawData = [
    ['ABDUR ROUF', 'KELAS 10', '083139869447'],
    ['Abdurrahman jabar ali', 'KELAS 8', '62895406851398'],
    ['AGIL IDRUS', 'KELAS 11', '6289521245134'],
    ['AHMAD MUJAHID', 'KELAS 7', '083153435744'],
    ['AHMAD SAPUTRA', 'KELAS 8', '6282152417518'],
    ['Aidil Huda', 'KELAS 10', '081241798600'],
    ['AL HAFIZ', 'KELAS 11', '6281251949792'],
    ['AL RAFIF', 'KELAS 7', '6283128268861'],
    ['ALIF WAHYUDIN', 'KELAS 10', '6285754722113'],
    ['ALIP NUR RAHMAN', 'KELAS 8', '6283899614129'],
    ['AMELIA', 'KELAS 10', '0895388040503'],
    ['AMELIA', 'KELAS 11', '6282152166331'],
    ['ARKA NANDA FERDIAN', 'KELAS -', '0895614901908'],
    ['Atiqotul Fadhilah', 'KELAS 10', '6285247037743'],
    ['DINIE HANIFA', 'KELAS 8', '6283820736533'],
    ["DIO AHMAD AL'ARIFQIY", 'KELAS 8', '6281347007071'],
    ['Dzikry Fadhillah', 'KELAS 7', '6282254680698'],
    ['ELNI', 'KELAS 11', '6285939450322'],
    ['FAJAR AHMED MUTI', 'KELAS 8', '6285386362410'],
    ['FARHAN', 'KELAS 8', '6285828733970'],
    ['FATIMAH AZZAHRA', 'KELAS 10', '6285250035099'],
    ['GHIBRAN ASSYABIL ZAIDHAN', 'KELAS 8', '6285787612122'],
    ['Hengky', 'KELAS 10', '82154677374'],
    ['Hifza Alkhifary', 'KELAS 10', '85772280533'],
    ['HILYATUL HUSNA', 'KELAS 7', '6281528253545'],
    ['HIMMATUL ULYA', 'KELAS 11', '6283159249109'],
    ['HUSNA', 'KELAS 7', '085387087752'],
    ['INDRIATI PUTRI', 'KELAS 10', '6285215635719'],
    ['KEYSHA NABILA', 'KELAS 11', '6281351428088'],
    ['KIRANA MARSELA', 'KELAS 11', '6283853395595'],
    ['MARSENI', 'KELAS 7', '6285849847953'],
    ['MIRZAN ALFIKRI', 'KELAS 7', '083847308761'],
    ['MUHAMMAD ADAM', 'KELAS 11', '6281345494639'],
    ['MUHAMMAD AL QURTHUBI', 'KELAS -', '085251339921'],
    ['MUHAMMAD ARSHAD MULIA', 'KELAS 7', '6285775230274'],
    ['MUHAMMAD FAZLI', 'KELAS 7', '6283857748070'],
    ['MUHAMMAD IBRA', 'KELAS 8', '6285656261584'],
    ['Muhammad Naufal Pratama', 'KELAS 7', '08983334448'],
    ['MUHAMMAD SOLEHAN', 'KELAS 7', '6281240463341'],
    ['Nabil Ijlal Kamil', 'KELAS 7', '6285878378722'],
    ['NABILA NUR SAKINA', 'KELAS 7', '081241222284'],
    ['NUR ANNISA', 'KELAS 7', '628311820565'],
    ['Olyvia Zifara', 'KELAS 7', '081391600552'],
    ['RADIT JULIANSAH', 'KELAS 8', '6283815701918'],
    ['RADITYA RAMADHAN', 'KELAS 11', '62831222685280'],
    ['RAFA', 'KELAS -', '081337599954'],
    ['RINALDI RIFKY', 'KELAS 7', '085787547145'],
    ['Restu', 'KELAS 9', '082353745828'],
    ['Ghafar', 'KELAS 9', '081257251556'],
    ['ROSITA', 'KELAS 7', '081241209232'],
    ['SALMAN ALFARISI', 'KELAS 11', '6283125937568'],
    ['SAZIA KENZHIE', 'KELAS 7', '6285252509646'],
    ['Shifa Syahira', 'KELAS 10', '6283125760892'],
    ['SHIREN', 'KELAS 11', '6285849126965'],
    ['SINDI WULAN NDARI', 'KELAS 11', '6282254680698'],
    ['SYERIN', 'KELAS 11', '6287747546714']
  ];

  const rows = rawData.map((row, index) => [
    `S${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd')}${String(index + 1).padStart(3, '0')}`,
    row[0],
    row[1],
    'Aktif',
    row[2]
  ]);

  appendRows(sheet, rows);
  return `Berhasil mengimpor ${rawData.length} data santri.`;
}
