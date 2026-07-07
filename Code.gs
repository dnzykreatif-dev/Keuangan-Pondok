function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');

  return template
    .evaluate()
    .setTitle('Keuangan Pondok')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
