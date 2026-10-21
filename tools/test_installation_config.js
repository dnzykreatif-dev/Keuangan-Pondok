const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const scriptProperties = {};
const context = {
  PropertiesService: {
    getScriptProperties() {
      return {
        getProperty(name) { return scriptProperties[name] || null; },
        getProperties() { return { ...scriptProperties }; }
      };
    }
  }
};

vm.createContext(context);
vm.runInContext(fs.readFileSync('Config.gs', 'utf8'), context);
vm.runInContext(fs.readFileSync('Installation.gs', 'utf8'), context);

assert.strictEqual(context.getInstallationMode_(), 'legacy');
assert.strictEqual(
  context.getConfiguredSpreadsheetId_(),
  '12Mmvz6VehTFlXulxAH5GRGAksheB3u4JSqO2Ltx7iYA'
);

scriptProperties.INSTALLATION_MODE = 'tenant';
scriptProperties.TENANT_ID = 'pondok-uji';
scriptProperties.INSTALLATION_OWNER_EMAIL = 'admin@pondok.test';
scriptProperties.SUPPORT_EMAIL = 'support@penjual.test';

assert.throws(
  () => context.getConfiguredSpreadsheetId_(),
  /SPREADSHEET_ID terlebih dahulu/
);

scriptProperties.SPREADSHEET_ID = 'spreadsheet-uji';
const manifest = context.PRODUCT_readInstallationManifest_();
assert.strictEqual(context.getConfiguredSpreadsheetId_(), 'spreadsheet-uji');
assert.strictEqual(manifest.mode, 'tenant');
assert.strictEqual(manifest.tenantId, 'pondok-uji');
assert.strictEqual(manifest.ready, true);

console.log('Installation config guard OK.');
