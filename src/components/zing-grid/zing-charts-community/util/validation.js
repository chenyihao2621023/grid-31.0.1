import { Color } from './color';
import { BREAK_TRANSFORM_CHAIN, addTransformToInstanceProperty } from './decorator';
import { Logger } from './logger';
import { isProperties } from './properties';
import { isArray, isBoolean, isFiniteNumber, isFunction, isNumber, isObject, isString, isValidDate } from './type-guards';
export function Validate(predicate, options = {}) {
  const {
    optional = false
  } = options;
  return addTransformToInstanceProperty((target, property, value) => {
    var _a;
    const context = Object.assign(Object.assign({}, options), {
      target,
      property
    });
    if (optional && typeof value === 'undefined' || predicate(value, context)) {
      if (isProperties(target[property]) && !isProperties(value)) {
        target[property].set(value);
        return target[property];
      }
      return value;
    }
    const cleanKey = String(property).replace(/^_*/, '');
    const targetName = (_a = target.constructor.className) !== null && _a !== void 0 ? _a : target.constructor.name.replace(/Properties$/, '');
    Logger.warn(`Property [${cleanKey}] of [${targetName}] cannot be set to [${stringify(value)}]${predicate.message ? `; expecting ${getPredicateMessage(predicate, context)}` : ''}, ignoring.`);
    return BREAK_TRANSFORM_CHAIN;
  }, undefined, {
    optional
  });
}
export const AND = (...predicates) => {
  const messages = [];
  return predicateWithMessage((value, ctx) => {
    messages.length = 0;
    return predicates.every(predicate => {
      const isValid = predicate(value, ctx);
      if (!isValid) {
        messages.push(getPredicateMessage(predicate, ctx));
      }
      return isValid;
    });
  }, () => messages.filter(Boolean).join(' AND '));
};
export const OR = (...predicates) => predicateWithMessage((value, ctx) => predicates.some(predicate => predicate(value, ctx)), ctx => predicates.map(getPredicateMessageMapper(ctx)).filter(Boolean).join(' OR '));
export const OBJECT = attachObjectRestrictions(predicateWithMessage((value, ctx) => isProperties(value) || isObject(value) && isProperties(ctx.target[ctx.property]), 'an object'));
export const BOOLEAN = predicateWithMessage(isBoolean, 'a boolean');
export const FUNCTION = predicateWithMessage(isFunction, 'a function');
export const STRING = predicateWithMessage(isString, 'a string');
export const NUMBER = attachNumberRestrictions(predicateWithMessage(isFiniteNumber, 'a number'));
export const NAN = predicateWithMessage(value => isNumber(value) && isNaN(value), 'NaN');
export const POSITIVE_NUMBER = NUMBER.restrict({
  min: 0
});
export const RATIO = NUMBER.restrict({
  min: 0,
  max: 1
});
export const DEGREE = NUMBER.restrict({
  min: -360,
  max: 360
});
export const NUMBER_OR_NAN = OR(NUMBER, NAN);
export const ARRAY = attachArrayRestrictions(predicateWithMessage(isArray, 'an array'));
export const ARRAY_OF = (predicate, message) => predicateWithMessage((value, ctx) => isArray(value) && value.every(item => predicate(item, ctx)), ctx => {
  var _a;
  const arrayMessage = (_a = getPredicateMessage(ARRAY, ctx)) !== null && _a !== void 0 ? _a : '';
  return message ? `${arrayMessage} of ${message}` : arrayMessage;
});
const isComparable = value => isFiniteNumber(value) || isValidDate(value);
export const LESS_THAN = otherField => predicateWithMessage((v, ctx) => !isComparable(v) || !isComparable(ctx.target[otherField]) || v < ctx.target[otherField], `expected to be less than ${otherField}`);
export const GREATER_THAN = otherField => predicateWithMessage((v, ctx) => !isComparable(v) || !isComparable(ctx.target[otherField]) || v > ctx.target[otherField], `expected to be greater than ${otherField}`);
export const DATE = predicateWithMessage(isValidDate, 'Date object');
export const DATE_OR_DATETIME_MS = OR(DATE, POSITIVE_NUMBER);
const colorMessage = `A color string can be in one of the following formats to be valid: #rgb, #rrggbb, rgb(r, g, b), rgba(r, g, b, a) or a CSS color name such as 'white', 'orange', 'cyan', etc`;
export const COLOR_STRING = predicateWithMessage(v => isString(v) && Color.validColorString(v), `color String. ${colorMessage}`);
export const COLOR_STRING_ARRAY = predicateWithMessage(ARRAY_OF(COLOR_STRING), `color strings. ${colorMessage}`);
export const BOOLEAN_ARRAY = ARRAY_OF(BOOLEAN, 'boolean values');
export const NUMBER_ARRAY = ARRAY_OF(NUMBER, 'numbers');
export const STRING_ARRAY = ARRAY_OF(STRING, 'strings');
export const DATE_ARRAY = predicateWithMessage(ARRAY_OF(DATE), 'Date objects');
export const OBJECT_ARRAY = predicateWithMessage(ARRAY_OF(OBJECT), 'objects');
export const LINE_CAP = UNION(['butt', 'round', 'square'], 'a line cap');
export const LINE_JOIN = UNION(['round', 'bevel', 'miter'], 'a line join');
export const LINE_DASH = predicateWithMessage(ARRAY_OF(POSITIVE_NUMBER), 'numbers specifying the length in pixels of alternating dashes and gaps, for example, [6, 3] means dashes with a length of 6 pixels with gaps between of 3 pixels.');
export const POSITION = UNION(['top', 'right', 'bottom', 'left'], 'a position');
export const FONT_STYLE = UNION(['normal', 'italic', 'oblique'], 'a font style');
export const FONT_WEIGHT = OR(UNION(['normal', 'bold', 'bolder', 'lighter'], 'a font weight'), NUMBER.restrict({
  min: 1,
  max: 1000
}));
export const TEXT_WRAP = UNION(['never', 'always', 'hyphenate', 'on-space'], 'a text wrap strategy');
export const TEXT_ALIGN = UNION(['left', 'center', 'right'], 'a text align');
export const VERTICAL_ALIGN = UNION(['top', 'middle', 'bottom'], 'a vertical align');
export const OVERFLOW_STRATEGY = UNION(['ellipsis', 'hide'], 'an overflow strategy');
export const DIRECTION = UNION(['horizontal', 'vertical'], 'a direction');
export const PLACEMENT = UNION(['inside', 'outside'], 'a placement');
export const INTERACTION_RANGE = OR(UNION(['exact', 'nearest'], 'interaction range'), NUMBER);
export function UNION(options, message = 'a') {
  return predicateWithMessage(v => options.includes(v), `${message} keyword such as ${joinUnionOptions(options)}`);
}
export const MIN_SPACING = OR(AND(NUMBER.restrict({
  min: 1
}), LESS_THAN('maxSpacing')), NAN);
export const MAX_SPACING = OR(AND(NUMBER.restrict({
  min: 1
}), GREATER_THAN('minSpacing')), NAN);
export function predicateWithMessage(predicate, message) {
  predicate.message = message;
  return predicate;
}
function joinUnionOptions(options) {
  const values = options.map(option => `'${option}'`);
  if (values.length === 1) {
    return values[0];
  }
  const lastValue = values.pop();
  return `${values.join(', ')} or ${lastValue}`;
}
function getPredicateMessage(predicate, ctx) {
  return isFunction(predicate.message) ? predicate.message(ctx) : predicate.message;
}
function getPredicateMessageMapper(ctx) {
  return predicate => getPredicateMessage(predicate, ctx);
}
function attachArrayRestrictions(predicate) {
  return Object.assign(predicate, {
    restrict({
      length,
      minLength
    } = {}) {
      return predicateWithMessage(value => isArray(value) && (isNumber(length) ? value.length === length : true) && (isNumber(minLength) ? value.length >= minLength : true), isNumber(minLength) && minLength > 0 ? 'a non-empty array' : isNumber(length) ? `an array of length ${length}` : 'an array');
    }
  });
}
function attachNumberRestrictions(predicate) {
  return Object.assign(predicate, {
    restrict({
      min,
      max
    } = {}) {
      const message = ['a number'];
      const hasMin = isNumber(min);
      const hasMax = isNumber(max);
      if (hasMin && hasMax) {
        message.push(`between ${min} and ${max} inclusive`);
      } else if (hasMin) {
        message.push(`greater than or equal to ${min}`);
      } else if (hasMax) {
        message.push(`less than or equal to ${max}`);
      }
      return predicateWithMessage(value => isFiniteNumber(value) && (hasMin ? value >= min : true) && (hasMax ? value <= max : true), message.join(' '));
    }
  });
}
function attachObjectRestrictions(predicate) {
  return Object.assign(predicate, {
    restrict(objectType) {
      const isInstanceOf = value => isProperties(value) && value instanceof objectType;
      return predicateWithMessage((value, ctx) => isInstanceOf(value) || isObject(value) && isInstanceOf(ctx.target[ctx.property]), ctx => {
        var _a;
        return (_a = getPredicateMessage(predicate, ctx)) !== null && _a !== void 0 ? _a : 'an object';
      });
    }
  });
}
export function stringify(value) {
  if (typeof value === 'number') {
    if (isNaN(value)) return 'NaN';
    if (value === Infinity) return 'Infinity';
    if (value === -Infinity) return '-Infinity';
  }
  return JSON.stringify(value);
}