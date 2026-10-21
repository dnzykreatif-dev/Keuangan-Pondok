const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync('Provisioning.gs', 'utf8'), context);

assert.strictEqual(context.isValidProvisioningEmail_('admin@pondok.test'), true);
assert.strictEqual(context.isValidProvisioningEmail_('not-an-email'), false);

console.log('Provisioning validation OK.');
