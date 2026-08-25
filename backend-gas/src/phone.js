var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
var PNF = require('google-libphonenumber').PhoneNumberFormat;

function normalizeIndoPhone(raw) {
  try {
    var num = phoneUtil.parseAndKeepRawInput(String(raw || ''), 'ID');
    if (!phoneUtil.isValidNumberForRegion(num, 'ID')) return '';
    return phoneUtil.format(num, PNF.E164).replace(/^\+/, '');
  } catch (e) {
    return '';
  }
}

module.exports = { normalizeIndoPhone };
