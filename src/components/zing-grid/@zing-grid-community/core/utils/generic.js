export function makeNull(value) {
  if (value == null || value === '') {
    return null;
  }
  return value;
}
export function exists(value, allowEmptyString = false) {
  return value != null && (value !== '' || allowEmptyString);
}
export function missing(value) {
  return !exists(value);
}
export function missingOrEmpty(value) {
  return value == null || value.length === 0;
}
export function toStringOrNull(value) {
  return value != null && typeof value.toString === 'function' ? value.toString() : null;
}
export function attrToNumber(value) {
  if (value === undefined) {
    return;
  }
  if (value === null || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return isNaN(value) ? undefined : value;
  }
  const valueParsed = parseInt(value, 10);
  return isNaN(valueParsed) ? undefined : valueParsed;
}
export function attrToBoolean(value) {
  if (value === undefined) {
    return;
  }
  if (value === null || value === '') {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return /true/i.test(value);
}
export function attrToString(value) {
  if (value == null || value === '') {
    return;
  }
  return value;
}
export function jsonEquals(val1, val2) {
  const val1Json = val1 ? JSON.stringify(val1) : null;
  const val2Json = val2 ? JSON.stringify(val2) : null;
  return val1Json === val2Json;
}
export function defaultComparator(valueA, valueB, accentedCompare = false) {
  const valueAMissing = valueA == null;
  const valueBMissing = valueB == null;
  if (valueA && valueA.toNumber) {
    valueA = valueA.toNumber();
  }
  if (valueB && valueB.toNumber) {
    valueB = valueB.toNumber();
  }
  if (valueAMissing && valueBMissing) {
    return 0;
  }
  if (valueAMissing) {
    return -1;
  }
  if (valueBMissing) {
    return 1;
  }
  function doQuickCompare(a, b) {
    return a > b ? 1 : a < b ? -1 : 0;
  }
  if (typeof valueA !== 'string') {
    return doQuickCompare(valueA, valueB);
  }
  if (!accentedCompare) {
    return doQuickCompare(valueA, valueB);
  }
  try {
    return valueA.localeCompare(valueB);
  } catch (e) {
    return doQuickCompare(valueA, valueB);
  }
}
export function values(object) {
  if (object instanceof Set || object instanceof Map) {
    const arr = [];
    object.forEach(value => arr.push(value));
    return arr;
  }
  return Object.values(object);
}