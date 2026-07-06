function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Index');
  template.midtransClientKey = getMidtransClientKey();

  return template
    .evaluate()
    .setTitle('Pesantren SPP Dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
