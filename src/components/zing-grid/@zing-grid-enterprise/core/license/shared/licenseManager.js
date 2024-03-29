import { MD5 } from './md5';
function missingOrEmpty(value) {
  return value == null || value.length === 0;
}
function exists(value, allowEmptyString = false) {
  return value != null && (value !== '' || allowEmptyString);
}
const LICENSE_TYPES = {
  '01': 'GRID',
  '02': 'CHARTS',
  '0102': 'BOTH'
};
export class LicenseManager {
  constructor(document) {
    this.watermarkMessage = undefined;
    this.document = document;
    this.md5 = new MD5();
    this.md5.init();
  }
  validateLicense() {
    const licenseDetails = this.getLicenseDetails(LicenseManager.licenseKey);
    if (licenseDetails.missing) {
      if (!this.isWebsiteUrl() || this.isForceWatermark()) {
        this.outputMissingLicenseKey();
      }
    } else if (!licenseDetails.valid) {
      this.outputInvalidLicenseKey(licenseDetails.incorrectLicenseType, licenseDetails.licenseType);
    } else if (licenseDetails.isTrial && licenseDetails.trialExpired) {
      this.outputExpiredTrialKey(licenseDetails.expiry);
    } else if (licenseDetails.expired) {
      const gridReleaseDate = LicenseManager.getGridReleaseDate();
      const formattedReleaseDate = LicenseManager.formatDate(gridReleaseDate);
      this.outputIncompatibleVersion(licenseDetails.expiry, formattedReleaseDate);
    }
  }
  static extractExpiry(license) {
    const restrictionHashed = license.substring(license.lastIndexOf('_') + 1, license.length);
    return new Date(parseInt(LicenseManager.decode(restrictionHashed), 10));
  }
  static extractLicenseComponents(licenseKey) {
    let cleanedLicenseKey = licenseKey.replace(/[\u200B-\u200D\uFEFF]/g, '');
    cleanedLicenseKey = cleanedLicenseKey.replace(/\r?\n|\r/g, '');
    if (licenseKey.length <= 32) {
      return {
        md5: null,
        license: licenseKey,
        version: null,
        isTrial: null
      };
    }
    const hashStart = cleanedLicenseKey.length - 32;
    const md5 = cleanedLicenseKey.substring(hashStart);
    const license = cleanedLicenseKey.substring(0, hashStart);
    const [version, isTrial, type] = LicenseManager.extractBracketedInformation(cleanedLicenseKey);
    return {
      md5,
      license,
      version,
      isTrial,
      type
    };
  }
  getLicenseDetails(licenseKey) {
    if (missingOrEmpty(licenseKey)) {
      return {
        licenseKey,
        valid: false,
        missing: true
      };
    }
    const gridReleaseDate = LicenseManager.getGridReleaseDate();
    const {
      md5,
      license,
      version,
      isTrial,
      type
    } = LicenseManager.extractLicenseComponents(licenseKey);
    let valid = md5 === this.md5.md5(license) && licenseKey.indexOf("For_Trialing_ag-Grid_Only") === -1;
    let trialExpired = undefined;
    let expired = undefined;
    let expiry = null;
    let incorrectLicenseType = undefined;
    let licenseType = undefined;
    function handleTrial() {
      const now = new Date();
      trialExpired = expiry < now;
      expired = undefined;
    }
    if (valid) {
      expiry = LicenseManager.extractExpiry(license);
      valid = !isNaN(expiry.getTime());
      if (valid) {
        expired = gridReleaseDate > expiry;
        switch (version) {
          case "legacy":
          case "2":
            {
              if (isTrial) {
                handleTrial();
              }
              break;
            }
          case "3":
            {
              if (missingOrEmpty(type)) {
                valid = false;
              } else {
                if (type !== LICENSE_TYPES['01'] && type !== LICENSE_TYPES['0102']) {
                  valid = false;
                  incorrectLicenseType = true;
                  licenseType = type;
                } else if (isTrial) {
                  handleTrial();
                }
              }
            }
        }
      }
    }
    if (!valid) {
      return {
        licenseKey,
        valid,
        incorrectLicenseType,
        licenseType
      };
    }
    return {
      licenseKey,
      valid,
      expiry: LicenseManager.formatDate(expiry),
      expired,
      version,
      isTrial,
      trialExpired
    };
  }
  isDisplayWatermark() {
    return this.isForceWatermark() || !this.isLocalhost() && !this.isWebsiteUrl() && !missingOrEmpty(this.watermarkMessage);
  }
  getWatermarkMessage() {
    return this.watermarkMessage || '';
  }
  getHostname() {
    const win = this.document.defaultView || window;
    const loc = win.location;
    const {
      hostname = ''
    } = loc;
    return hostname;
  }
  isForceWatermark() {
    const win = this.document.defaultView || window;
    const loc = win.location;
    const {
      pathname
    } = loc;
    return pathname ? pathname.indexOf('forceWatermark') !== -1 : false;
  }
  isWebsiteUrl() {
    const hostname = this.getHostname();
    return hostname.match(/^((?:\w+\.)?zing-grid\.com)$/) !== null;
  }
  isLocalhost() {
    const hostname = this.getHostname();
    return hostname.match(/^(?:127\.0\.0\.1|localhost)$/) !== null;
  }
  static formatDate(date) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const day = date.getDate();
    const monthIndex = date.getMonth();
    const year = date.getFullYear();
    return day + ' ' + monthNames[monthIndex] + ' ' + year;
  }
  static getGridReleaseDate() {
    return new Date(parseInt(LicenseManager.decode(LicenseManager.RELEASE_INFORMATION), 10));
  }
  static decode(input) {
    const keystr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let t = '';
    let n, r, i;
    let s, o, u, a;
    let f = 0;
    const e = input.replace(/[^A-Za-z0-9+/=]/g, '');
    while (f < e.length) {
      s = keystr.indexOf(e.charAt(f++));
      o = keystr.indexOf(e.charAt(f++));
      u = keystr.indexOf(e.charAt(f++));
      a = keystr.indexOf(e.charAt(f++));
      n = s << 2 | o >> 4;
      r = (o & 15) << 4 | u >> 2;
      i = (u & 3) << 6 | a;
      t = t + String.fromCharCode(n);
      if (u != 64) {
        t = t + String.fromCharCode(r);
      }
      if (a != 64) {
        t = t + String.fromCharCode(i);
      }
    }
    t = LicenseManager.utf8_decode(t);
    return t;
  }
  static utf8_decode(input) {
    input = input.replace(/rn/g, 'n');
    let t = '';
    for (let n = 0; n < input.length; n++) {
      const r = input.charCodeAt(n);
      if (r < 128) {
        t += String.fromCharCode(r);
      } else if (r > 127 && r < 2048) {
        t += String.fromCharCode(r >> 6 | 192);
        t += String.fromCharCode(r & 63 | 128);
      } else {
        t += String.fromCharCode(r >> 12 | 224);
        t += String.fromCharCode(r >> 6 & 63 | 128);
        t += String.fromCharCode(r & 63 | 128);
      }
    }
    return t;
  }
  static setLicenseKey(licenseKey) {
    this.licenseKey = licenseKey;
  }
  static extractBracketedInformation(licenseKey) {
    if (!licenseKey.includes("[")) {
      return ["legacy", false, undefined];
    }
    const matches = licenseKey.match(/\[(.*?)\]/g).map(match => match.replace("[", "").replace("]", ""));
    if (!matches || matches.length === 0) {
      return ["legacy", false, undefined];
    }
    const isTrial = matches.filter(match => match === 'TRIAL').length === 1;
    const rawVersion = matches.filter(match => match.indexOf("v") === 0)[0];
    const version = rawVersion ? rawVersion.replace('v', '') : 'legacy';
    const type = LICENSE_TYPES[matches.filter(match => LICENSE_TYPES[match])[0]];
    return [version, isTrial, type];
  }
  outputInvalidLicenseKey(incorrectLicenseType, licenseType) {}
  outputExpiredTrialKey(formattedExpiryDate) {}
  outputMissingLicenseKey() {}
  outputIncompatibleVersion(formattedExpiryDate, formattedReleaseDate) {}
}
LicenseManager.RELEASE_INFORMATION = 'MTcwMjI5MjcxNTE0OQ==';