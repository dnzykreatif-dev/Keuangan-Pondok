function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');

  return template
    .evaluate()
    .setTitle('Keuangan Pondok')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  const template = HtmlService.createTemplateFromFile(filename);
  if (filename === 'AppState') {
    const appSettings = getAppSettings();
    template.initialSettingsJson = JSON.stringify(appSettings.ok ? appSettings.data : {});
  }
  return template.evaluate().getContent();
}
