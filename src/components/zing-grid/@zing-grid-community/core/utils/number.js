export function padStartWidthZeros(value, totalStringSize) {
    return value.toString().padStart(totalStringSize, '0');
}
export function createArrayOfNumbers(first, last) {
    const result = [];
    for (let i = first; i <= last; i++) {
        result.push(i);
    }
    return result;
}
export function cleanNumber(value) {
    if (typeof value === 'string') {
        value = parseInt(value, 10);
    }
    if (typeof value === 'number') {
        return Math.floor(value);
    }
    return null;
}
export function decToHex(number, bytes) {
    let hex = '';
    for (let i = 0; i < bytes; i++) {
        hex += String.fromCharCode(number & 0xff);
        number >>>= 8;
    }
    return hex;
}
export function formatNumberTwoDecimalPlacesAndCommas(value, thousandSeparator, decimalSeparator) {
    if (typeof value !== 'number') {
        return '';
    }
    return formatNumberCommas(Math.round(value * 100) / 100, thousandSeparator, decimalSeparator);
}

export function formatNumberCommas(value, thousandSeparator, decimalSeparator) {
    if (typeof value !== 'number') {
        return '';
    }
    return value.toString().replace('.', decimalSeparator).replace(/(\d)(?=(\d{3})+(?!\d))/g, `$1${thousandSeparator}`);
}
export function sum(values) {
    return values == null ? null : values.reduce((total, value) => total + value, 0);
}
