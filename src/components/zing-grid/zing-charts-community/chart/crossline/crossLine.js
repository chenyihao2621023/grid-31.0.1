import { ContinuousScale } from '../../integrated-charts-scene';
import { Logger } from '../../util/logger';
import { predicateWithMessage, stringify } from '../../util/validation';
import { checkDatum } from '../../util/value';
export const MATCHING_CROSSLINE_TYPE = property => {
  return property === 'value' ? predicateWithMessage((_, ctx) => ctx.target['type'] === 'line', ctx => ctx.target['type'] === 'range' ? `crossLine type 'range' to have a 'range' property instead of 'value'` : `crossLine property 'type' to be 'line'`) : predicateWithMessage((_, ctx) => ctx.target['type'] === 'range', ctx => ctx.target.type === 'line' ? `crossLine type 'line' to have a 'value' property instead of 'range'` : `crossLine property 'type' to be 'range'`);
};
export const validateCrossLineValues = (type, value, range, scale) => {
  const lineCrossLine = type === 'line' && value !== undefined;
  const rangeCrossLine = type === 'range' && range !== undefined;
  if (!lineCrossLine && !rangeCrossLine) {
    return true;
  }
  const [start, end] = range !== null && range !== void 0 ? range : [value, undefined];
  const isContinuous = ContinuousScale.is(scale);
  const validStart = checkDatum(start, isContinuous) != null && !isNaN(scale.convert(start));
  const validEnd = checkDatum(end, isContinuous) != null && !isNaN(scale.convert(end));
  if (lineCrossLine && validStart || rangeCrossLine && validStart && validEnd) {
    return true;
  }
  const message = [`Expecting crossLine`];
  if (rangeCrossLine) {
    if (!validStart) {
      message.push(`range start ${stringify(start)}`);
    }
    if (!validEnd) {
      message.push(`${!validStart ? 'and ' : ''}range end ${stringify(end)}`);
    }
  } else {
    message.push(`value ${stringify(start)}`);
  }
  message.push(`to match the axis scale domain.`);
  Logger.warnOnce(message.join(' '));
  return false;
};