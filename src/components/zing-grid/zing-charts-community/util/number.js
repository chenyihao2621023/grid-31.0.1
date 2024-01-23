export function clamp(min, value, max) {
  return Math.min(max, Math.max(min, value));
}
export function clampArray(value, array) {
  return clamp(Math.min(...array), value, Math.max(...array));
}
export function isEqual(a, b, epsilon = 1e-10) {
  return Math.abs(a - b) < epsilon;
}
export function isNegative(a) {
  return Math.sign(a) < 0 || Object.is(a, -0);
}
export function isReal(a) {
  return isFinite(a) && !isNaN(a);
}
export function round(value, decimals = 2) {
  const pow = Math.pow(10, decimals);
  return Math.round(value * pow) / pow;
}
export function toFixed(value, fractionOrSignificantDigits = 2) {
  const power = Math.floor(Math.log(Math.abs(value)) / Math.LN10);
  if (power >= 0 || !isFinite(power)) {
    return value.toFixed(fractionOrSignificantDigits);
  }
  return value.toFixed(Math.abs(power) - 1 + fractionOrSignificantDigits);
}
export function toReal(value) {
  return isReal(value) ? value : 0;
}
export function mod(n, m) {
  if (n >= 0) {
    return Math.floor(n % m);
  }
  return Math.floor(n % m + m);
}
export const countFractionDigits = (value, maxFractionDigits = 10) => {
  const decimal = (Math.abs(value) % 1).toFixed(maxFractionDigits);
  for (let i = decimal.length - 1; i >= 2; i -= 1) {
    if (decimal[i] !== '0') {
      return maxFractionDigits - (decimal.length - 1 - i);
    }
  }
  return 0;
};