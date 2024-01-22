/* eslint-disable sonarjs/no-duplicate-string */
/* eslint-disable no-console */
import { MD5 } from './md5';
// move to general utils
function missingOrEmpty(value) {
    return value == null || value.length === 0;
}
function exists(value, allowEmptyString = false) {
    return value != null && (value !== '' || allowEmptyString);
}
const LICENSE_TYPES = {
    '01': 'GRID',
    '02': 'CHARTS',
    '0102': 'BOTH',
};
export class LicenseManager {
    constructor(document) {
        this.watermarkMessage = undefined;
        this.document = document;
        this.md5 = new MD5();
        this.md5.init();
    }
    validateLicense() {
        const licenseDetails = this.getLicenseDetails(this.licenseKey);
        if (licenseDetails.missing) {
            if (!this.isWebsiteUrl() || this.isForceWatermark()) {
                this.outputMissingLicenseKey();
            }
        }
        else if (!licenseDetails.valid) {
            this.outputInvalidLicenseKey(licenseDetails.incorrectLicenseType, licenseDetails.licenseType);
        }
        else if (licenseDetails.isTrial && licenseDetails.trialExpired) {
            this.outputExpiredTrialKey(licenseDetails.expiry);
        }
        else if (licenseDetails.expired) {
            const chartsReleaseDate = LicenseManager.getchartsReleaseDate();
            const formattedReleaseDate = LicenseManager.formatDate(chartsReleaseDate);
            this.outputIncompatibleVersion(licenseDetails.expiry, formattedReleaseDate);
        }
    }
    static extractExpiry(license) {
        const restrictionHashed = license.substring(license.lastIndexOf('_') + 1, license.length);
        return new Date(parseInt(LicenseManager.decode(restrictionHashed), 10));
    }
    static extractLicenseComponents(licenseKey) {
        // when users copy the license key from a PDF extra zero width characters are sometimes copied too
        // carriage returns and line feeds are problematic too
        // all of which causes license key validation to fail - strip these out
        let cleanedLicenseKey = licenseKey.replace(/[\u200B-\u200D\uFEFF]/g, '');
        cleanedLicenseKey = cleanedLicenseKey.replace(/\r?\n|\r/g, '');
        // the hash that follows the key is 32 chars long
        if (licenseKey.length <= 32) {
            return { md5: null, license: licenseKey, version: null, isTrial: null };
        }
        const hashStart = cleanedLicenseKey.length - 32;
        const md5 = cleanedLicenseKey.substring(hashStart);
        const license = cleanedLicenseKey.substring(0, hashStart);
        const [version, isTrial, type] = LicenseManager.extractBracketedInformation(cleanedLicenseKey);
        return { md5, license, version, isTrial, type };
    }
    getLicenseDetails(licenseKey) {
        if (missingOrEmpty(licenseKey)) {
            return {
                licenseKey,
                valid: false,
                missing: true,
            };
        }
        const chartsReleaseDate = LicenseManager.getchartsReleaseDate();
        const { md5, license, version, isTrial, type } = LicenseManager.extractLicenseComponents(licenseKey);
        let valid = md5 === this.md5.md5(license) && licenseKey.indexOf('For_Trialing_ag-Grid_Only') === -1;
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
                expired = chartsReleaseDate > expiry;
                switch (version) {
                    case 'legacy':
                    case '2': {
                        valid = false;
                        break;
                    }
                    case '3': {
                        if (missingOrEmpty(type)) {
                            valid = false;
                        }
                        else {
                            if (type !== LICENSE_TYPES['02'] && type !== LICENSE_TYPES['0102']) {
                                valid = false;
                                incorrectLicenseType = true;
                                licenseType = type;
                            }
                            else if (isTrial) {
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
                licenseType,
            };
        }
        return {
            licenseKey,
            valid,
            expiry: LicenseManager.formatDate(expiry),
            expired,
            version,
            isTrial,
            trialExpired,
        };
    }
    isDisplayWatermark() {
        return (this.isForceWatermark() ||
            (!this.isLocalhost() && !this.isWebsiteUrl() && !missingOrEmpty(this.watermarkMessage)));
    }
    getWatermarkMessage() {
        return this.watermarkMessage || '';
    }
    getHostname() {
        if (!this.document) {
            return 'localhost';
        }
        const win = this.document.defaultView || window;
        if (!win) {
            return 'localhost';
        }
        const loc = win.location;
        const { hostname = '' } = loc;
        return hostname;
    }
    isForceWatermark() {
        var _a, _b;
        if (!this.document) {
            return false;
        }
        const win = ((_b = (_a = this.document) === null || _a === void 0 ? void 0 : _a.defaultView) !== null && _b !== void 0 ? _b : typeof window != 'undefined') ? window : undefined;
        if (!win) {
            return false;
        }
        const { pathname } = win.location;
        return pathname ? pathname.indexOf('forceWatermark') !== -1 : false;
    }
    isWebsiteUrl() {
        const hostname = this.getHostname();
        return hostname.match(/^((?:[\w-]+\.)?zing-grid\.com)$/) !== null;
    }
    isLocalhost() {
        const hostname = this.getHostname();
        return hostname.match(/^(?:127\.0\.0\.1|localhost)$/) !== null;
    }
    static formatDate(date) {
        const monthNames = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
        const day = date.getDate();
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        return day + ' ' + monthNames[monthIndex] + ' ' + year;
    }
    static getchartsReleaseDate() {
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
            n = (s << 2) | (o >> 4);
            r = ((o & 15) << 4) | (u >> 2);
            i = ((u & 3) << 6) | a;
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
            }
            else if (r > 127 && r < 2048) {
                t += String.fromCharCode((r >> 6) | 192);
                t += String.fromCharCode((r & 63) | 128);
            }
            else {
                t += String.fromCharCode((r >> 12) | 224);
                t += String.fromCharCode(((r >> 6) & 63) | 128);
                t += String.fromCharCode((r & 63) | 128);
            }
        }
        return t;
    }
    setLicenseKey(licenseKey) {
        this.licenseKey = licenseKey;
    }
    static extractBracketedInformation(licenseKey) {
        // legacy no trial key
        if (!licenseKey.includes('[')) {
            return ['legacy', false, undefined];
        }
        const matches = licenseKey.match(/\[(.*?)\]/g).map((match) => match.replace('[', '').replace(']', ''));
        if (!matches || matches.length === 0) {
            return ['legacy', false, undefined];
        }
        const isTrial = matches.filter((match) => match === 'TRIAL').length === 1;
        const rawVersion = matches.filter((match) => match.indexOf('v') === 0)[0];
        const version = rawVersion ? rawVersion.replace('v', '') : 'legacy';
        const type = LICENSE_TYPES[matches.filter((match) => LICENSE_TYPES[match])[0]];
        return [version, isTrial, type];
    }
    outputInvalidLicenseKey(incorrectLicenseType, licenseType) {
        console.error('*****************************************************************************************************************');
        console.error('***************************************** ZING Charts Enterprise License *******************************************');
        console.error('********************************************* Invalid License ***************************************************');
        if (exists(incorrectLicenseType) && incorrectLicenseType && licenseType === 'GRID') {
            console.error('* The license supplied is for ZING Grid Enterprise Only and does not cover ZING Charts Enterprise                    *');
        }
        console.error('* Your license for ZING Charts Enterprise is not valid - please contact info@zing-grid.com to obtain a valid license. *');
        console.error('*****************************************************************************************************************');
        console.error('*****************************************************************************************************************');
        this.watermarkMessage = 'Invalid License';
    }
    outputExpiredTrialKey(formattedExpiryDate) {
        console.error('****************************************************************************************************************');
        console.error('***************************************** ZING Charts Enterprise License *******************************************');
        console.error('*****************************************   Trial Period Expired.    *******************************************');
        console.error(`* Your license for ZING Charts Enterprise expired on ${formattedExpiryDate}.                                                *`);
        console.error('* Please email info@zing-grid.com to purchase a license.                                                         *');
        console.error('****************************************************************************************************************');
        console.error('****************************************************************************************************************');
        this.watermarkMessage = 'Trial Period Expired';
    }
    outputMissingLicenseKey() {
        console.error('****************************************************************************************************************');
        console.error('***************************************** ZING Charts Enterprise License *******************************************');
        console.error('****************************************** License Key Not Found ***********************************************');
        console.error('* All ZING Charts Enterprise features are unlocked.                                                                *');
        console.error('* This is an evaluation only version, it is not licensed for development projects intended for production.     *');
        console.error('* If you want to hide the watermark, please email info@zing-grid.com for a trial license.                        *');
        console.error('****************************************************************************************************************');
        console.error('****************************************************************************************************************');
        this.watermarkMessage = 'For Trial Use Only';
    }
    outputIncompatibleVersion(formattedExpiryDate, formattedReleaseDate) {
        console.error('****************************************************************************************************************************');
        console.error('****************************************************************************************************************************');
        console.error('*                                             ZING Charts Enterprise License                                                   *');
        console.error('*                           License not compatible with installed version of ZING Charts Enterprise.                           *');
        console.error('*                                                                                                                          *');
        console.error(`* Your ZING Charts License entitles you to all versions of ZING Charts that we release within the time covered by your license     *`);
        console.error(`* - typically we provide one year licenses which entitles you to all releases / updates of ZING Charts within that year.       *`);
        console.error(`* Your license has an end (expiry) date which stops the license key working with versions of ZING Charts released after the    *`);
        console.error(`* license end date. The license key that you have expires on ${formattedExpiryDate}, however the version of ZING Charts you    *`);
        console.error(`* are trying to use was released on ${formattedReleaseDate}.                                                               *`);
        console.error('*                                                                                                                          *');
        console.error('* Please contact info@zing-grid.com to renew your subscription to new versions and get a new license key to work with this   *');
        console.error('* version of ZING Charts.                                                                                                      *');
        console.error('****************************************************************************************************************************');
        console.error('****************************************************************************************************************************');
        this.watermarkMessage = 'License Expired';
    }
}
LicenseManager.RELEASE_INFORMATION = 'MTcwMDc2MzcxODkzNg==';
//# sourceMappingURL=licenseManager.js.map