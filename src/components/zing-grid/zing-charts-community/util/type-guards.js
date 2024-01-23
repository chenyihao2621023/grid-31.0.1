export function isDefined(val) {
    return val != null;
}
export function isArray(value) {
    return Array.isArray(value);
}
export function isBoolean(value) {
    return typeof value === 'boolean';
}
export function isDate(value) {
    return value instanceof Date;
}
export function isValidDate(value) {
    return isDate(value) && !isNaN(Number(value));
}
export function isFunction(value) {
    return typeof value === 'function';
}
export function isObject(value) {
    return typeof value === 'object' && value !== null && !isArray(value);
}
export function isObjectLike(value) {
    return typeof value === 'object' && value !== null;
}
export function isPlainObject(value) {
    return typeof value === 'object' && value !== null && value.constructor === Object;
}
export function isString(value) {
    return typeof value === 'string';
}
export function isNumber(value) {
    return typeof value === 'number';
}
export function isFiniteNumber(value) {
    return isNumber(value) && Number.isFinite(value);
}
export function isHtmlElement(value) {
    return typeof window !== 'undefined' && value instanceof HTMLElement;
}
