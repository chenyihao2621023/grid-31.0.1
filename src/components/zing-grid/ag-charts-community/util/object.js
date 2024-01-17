import { isDecoratedObject, listDecoratedProperties } from './decorator';
export function deepMerge(target, source) {
    if (isPlainObject(target) && isPlainObject(source)) {
        const result = {};
        Object.keys(target).forEach((key) => {
            if (key in source) {
                result[key] = deepMerge(target[key], source[key]);
            }
            else {
                result[key] = target[key];
            }
        });
        Object.keys(source).forEach((key) => {
            if (!(key in target)) {
                result[key] = source[key];
            }
        });
        return result;
    }
    if ((Array.isArray(target) && !Array.isArray(source)) || (isObjectLike(target) && !isObjectLike(source))) {
        return target;
    }
    return source;
}
function isObjectLike(value) {
    return typeof value === 'object' && value !== null;
}
function isObject(value) {
    return isObjectLike(value) && !Array.isArray(value);
}
function isPlainObject(x) {
    return isObject(x) && x.constructor === Object;
}
export function mergeDefaults(...sources) {
    var _a;
    const target = {};
    for (const source of sources) {
        if (!source)
            continue;
        const keys = isDecoratedObject(source) ? listDecoratedProperties(source) : Object.keys(source);
        for (const key of keys) {
            if (isObject(target[key]) && isObject(source[key])) {
                target[key] = mergeDefaults(target[key], source[key]);
            }
            else {
                (_a = target[key]) !== null && _a !== void 0 ? _a : (target[key] = source[key]);
            }
        }
    }
    return target;
}
// Similar to Object.assign, but only copy an explicit set of keys.
export function partialAssign(keysToCopy, target, source) {
    if (source === undefined) {
        return target;
    }
    for (const key of keysToCopy) {
        const value = source[key];
        if (value !== undefined) {
            target[key] = value;
        }
    }
    return target;
}
//# sourceMappingURL=object.js.map