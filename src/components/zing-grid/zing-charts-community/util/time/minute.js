import { durationMinute } from './duration';
import { CountableTimeInterval } from './interval';
const offset = new Date().getTimezoneOffset() * durationMinute;
function encode(date) {
    return Math.floor((date.getTime() - offset) / durationMinute);
}
function decode(encoded) {
    return new Date(offset + encoded * durationMinute);
}
export const minute = new CountableTimeInterval(encode, decode);
export default minute;
