import { CountableTimeInterval } from './interval';
function encode(date) {
  return date.getUTCFullYear();
}
function decode(encoded) {
  const d = new Date();
  d.setUTCFullYear(encoded);
  d.setUTCMonth(0, 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
export const utcYear = new CountableTimeInterval(encode, decode);
export default utcYear;