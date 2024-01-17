import { durationMinute } from './duration';
import { CountableTimeInterval } from './interval';
function encode(date) {
    return Math.floor(date.getTime() / durationMinute);
}
function decode(encoded) {
    return new Date(encoded * durationMinute);
}
export const utcMinute = new CountableTimeInterval(encode, decode);
//# sourceMappingURL=utcMinute.js.map