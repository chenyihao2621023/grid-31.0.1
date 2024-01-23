const reUnescapedHtml = /[&<>"']/g;
const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};
export function utf8_encode(s) {
  const stringFromCharCode = String.fromCharCode;
  function ucs2decode(string) {
    const output = [];
    if (!string) {
      return [];
    }
    const len = string.length;
    let counter = 0;
    let value;
    let extra;
    while (counter < len) {
      value = string.charCodeAt(counter++);
      if (value >= 0xD800 && value <= 0xDBFF && counter < len) {
        extra = string.charCodeAt(counter++);
        if ((extra & 0xFC00) == 0xDC00) {
          output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
        } else {
          output.push(value);
          counter--;
        }
      } else {
        output.push(value);
      }
    }
    return output;
  }
  function checkScalarValue(point) {
    if (point >= 0xD800 && point <= 0xDFFF) {
      throw Error('Lone surrogate U+' + point.toString(16).toUpperCase() + ' is not a scalar value');
    }
  }
  function createByte(point, shift) {
    return stringFromCharCode(point >> shift & 0x3F | 0x80);
  }
  function encodeCodePoint(point) {
    if (point >= 0 && point <= 31 && point !== 10) {
      const convertedCode = point.toString(16).toUpperCase();
      const paddedCode = convertedCode.padStart(4, '0');
      return `_x${paddedCode}_`;
    }
    if ((point & 0xFFFFFF80) == 0) {
      return stringFromCharCode(point);
    }
    let symbol = '';
    if ((point & 0xFFFFF800) == 0) {
      symbol = stringFromCharCode(point >> 6 & 0x1F | 0xC0);
    } else if ((point & 0xFFFF0000) == 0) {
      checkScalarValue(point);
      symbol = stringFromCharCode(point >> 12 & 0x0F | 0xE0);
      symbol += createByte(point, 6);
    } else if ((point & 0xFFE00000) == 0) {
      symbol = stringFromCharCode(point >> 18 & 0x07 | 0xF0);
      symbol += createByte(point, 12);
      symbol += createByte(point, 6);
    }
    symbol += stringFromCharCode(point & 0x3F | 0x80);
    return symbol;
  }
  const codePoints = ucs2decode(s);
  const length = codePoints.length;
  let index = -1;
  let codePoint;
  let byteString = '';
  while (++index < length) {
    codePoint = codePoints[index];
    byteString += encodeCodePoint(codePoint);
  }
  return byteString;
}
export function capitalise(str) {
  return str[0].toUpperCase() + str.substring(1).toLowerCase();
}
export function escapeString(toEscape, skipEscapingHtmlChars) {
  if (toEscape == null) {
    return null;
  }
  const stringResult = toEscape.toString().toString();
  if (skipEscapingHtmlChars) {
    return stringResult;
  }
  return stringResult.replace(reUnescapedHtml, chr => HTML_ESCAPES[chr]);
}
export function camelCaseToHumanText(camelCase) {
  if (!camelCase || camelCase == null) {
    return null;
  }
  const rex = /([a-z])([A-Z])/g;
  const rexCaps = /([A-Z]+)([A-Z])([a-z])/g;
  const words = camelCase.replace(rex, '$1 $2').replace(rexCaps, '$1 $2$3').replace(/\./g, ' ').split(' ');
  return words.map(word => word.substring(0, 1).toUpperCase() + (word.length > 1 ? word.substring(1, word.length) : '')).join(' ');
}
export function camelCaseToHyphenated(camelCase) {
  return camelCase.replace(/[A-Z]/g, s => `-${s.toLocaleLowerCase()}`);
}