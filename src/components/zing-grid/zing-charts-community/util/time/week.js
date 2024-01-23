import { durationMinute, durationWeek } from './duration';
import { CountableTimeInterval } from './interval';
function weekday(weekStart) {
  const thursday = 4;
  const dayShift = (7 + weekStart - thursday) % 7;
  function encode(date) {
    const tzOffsetMs = date.getTimezoneOffset() * durationMinute;
    return Math.floor((date.getTime() - tzOffsetMs) / durationWeek - dayShift / 7);
  }
  function decode(encoded) {
    const d = new Date(1970, 0, 1);
    d.setDate(d.getDate() + encoded * 7 + dayShift);
    return d;
  }
  return new CountableTimeInterval(encode, decode);
}
export const sunday = weekday(0);
export const monday = weekday(1);
export const tuesday = weekday(2);
export const wednesday = weekday(3);
export const thursday = weekday(4);
export const friday = weekday(5);
export const saturday = weekday(6);
export default sunday;