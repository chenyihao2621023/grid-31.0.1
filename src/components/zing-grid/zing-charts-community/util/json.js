import { Logger } from './logger';
import { isProperties } from './properties';
import { isArray, isDate, isFunction, isHtmlElement, isObject, isPlainObject } from './type-guards';
const CLASS_INSTANCE_TYPE = 'class-instance';
/**
 * Performs a recursive JSON-diff between a source and target JSON structure.
 *
 * On a per-property basis, takes the target property value where:
 * - types are different.
 * - type is primitive.
 * - type is array and length or content have changed.
 *
 * @param source starting point for diff
 * @param target target for diff vs. source
 *
 * @returns `null` if no differences, or an object with the subset of properties that have changed.
 */
export function jsonDiff(source, target) {
    if (isArray(target)) {
        if (!isArray(source) ||
            source.length !== target.length ||
            target.some((v, i) => jsonDiff(source[i], v) != null)) {
            return target;
        }
    }
    else if (isObject(target)) {
        if (!isObject(source) || !isPlainObject(target)) {
            return target;
        }
        const result = {};
        const allKeys = new Set([
            ...Object.keys(source),
            ...Object.keys(target),
        ]);
        for (const key of allKeys) {
            // Cheap-and-easy equality check.
            if (source[key] === target[key]) {
                continue;
            }
            if (typeof source[key] !== typeof target[key]) {
                result[key] = target[key];
            }
            else {
                const diff = jsonDiff(source[key], target[key]);
                if (diff !== null) {
                    result[key] = diff;
                }
            }
        }
        return Object.keys(result).length ? result : null;
    }
    else if (source !== target) {
        return target;
    }
    return null;
}
export function jsonClone(source) {
    if (isArray(source)) {
        return source.map(jsonClone);
    }
    if (isPlainObject(source)) {
        return Object.entries(source).reduce((result, [key, value]) => {
            result[key] = jsonClone(value);
            return result;
        }, {});
    }
    return source;
}
/**
 * Special value used by `jsonMerge` to signal that a property should be removed from the merged
 * output.
 */
export const DELETE = Symbol('<delete-property>');
const NOT_SPECIFIED = Symbol('<unspecified-property>');
/**
 * Merge together the provide JSON object structures, with the precedence of application running
 * from higher indexes to lower indexes.
 *
 * Deep-clones all objects to avoid mutation of the inputs changing the output object. For arrays,
 * just performs a deep-clone of the entire array, no merging of elements attempted.
 *
 * @param json all json objects to merge
 * @param opts merge options
 * @param opts.avoidDeepClone contains a list of properties where deep clones should be avoided
 *
 * @returns the combination of all the json inputs
 */
export function jsonMerge(json, opts) {
    var _a;
    const avoidDeepClone = (_a = opts === null || opts === void 0 ? void 0 : opts.avoidDeepClone) !== null && _a !== void 0 ? _a : [];
    const jsonTypes = json.map((v) => classify(v));
    if (jsonTypes.some((v) => v === 'array')) {
        // Clone final array.
        const finalValue = json[json.length - 1];
        if (Array.isArray(finalValue)) {
            return finalValue.map((v) => {
                const type = classify(v);
                if (type === 'array')
                    return jsonMerge([[], v], opts);
                if (type === 'object')
                    return jsonMerge([{}, v], opts);
                return v;
            });
        }
        return finalValue;
    }
    const result = {};
    const props = new Set(json.map((v) => (v != null ? Object.keys(v) : [])).reduce((r, n) => r.concat(n), []));
    for (const nextProp of props) {
        const values = json
            .map((j) => {
            if (j != null && typeof j === 'object' && nextProp in j) {
                return j[nextProp];
            }
            return NOT_SPECIFIED;
        })
            .filter((v) => v !== NOT_SPECIFIED);
        if (values.length === 0) {
            continue;
        }
        const lastValue = values[values.length - 1];
        if (lastValue === DELETE) {
            continue;
        }
        const types = values.map((v) => classify(v));
        const type = types[0];
        if (types.some((t) => t !== type)) {
            // Short-circuit if mismatching types.
            result[nextProp] = lastValue;
            continue;
        }
        if ((type === 'array' || type === 'object') && !avoidDeepClone.includes(nextProp)) {
            result[nextProp] = jsonMerge(values, opts);
        }
        else if (type === 'array') {
            // Arrays need to be shallow copied to avoid external mutation and allow jsonDiff to
            // detect changes.
            result[nextProp] = [...lastValue];
        }
        else {
            // Just directly assign/overwrite.
            result[nextProp] = lastValue;
        }
    }
    return result;
}
/**
 * Recursively apply a JSON object into a class-hierarchy, optionally instantiating certain classes
 * by property name.
 *
 * @param target to apply source JSON properties into
 * @param source to be applied
 * @param params
 * @param params.path path for logging/error purposes, to aid with pinpointing problems
 * @param params.matcherPath path for pattern matching, to lookup allowedTypes override.
 * @param params.skip property names to skip from the source
 * @param params.constructors dictionary of property name to class constructors for properties that
 *                            require object construction
 * @param params.constructedArrays map stores arrays which items should be initialised
 *                                 using a class constructor
 * @param params.allowedTypes overrides by path for allowed property types
 */
export function jsonApply(target, source, params = {}) {
    var _a, _b, _c;
    const { path, matcherPath = path ? path.replace(/(\[[0-9+]+])/i, '[]') : undefined, skip = [], constructors = {}, constructedArrays = new WeakMap(), allowedTypes = {}, idx, } = params;
    if (target == null) {
        throw new Error(`ZING Charts - target is uninitialised: ${path !== null && path !== void 0 ? path : '<root>'}`);
    }
    if (source == null) {
        return target;
    }
    if (isProperties(target)) {
        return target.set(source);
    }
    const targetAny = target;
    if (idx != null && '_declarationOrder' in targetAny) {
        targetAny['_declarationOrder'] = idx;
    }
    const targetType = classify(target);
    for (const property in source) {
        const propertyMatcherPath = `${matcherPath ? matcherPath + '.' : ''}${property}`;
        if (skip.indexOf(propertyMatcherPath) >= 0) {
            continue;
        }
        const newValue = source[property];
        const propertyPath = `${path ? path + '.' : ''}${property}`;
        const targetClass = targetAny.constructor;
        const currentValue = targetAny[property];
        let ctr = (_a = constructors[propertyMatcherPath]) !== null && _a !== void 0 ? _a : constructors[property];
        try {
            const currentValueType = classify(currentValue);
            const newValueType = classify(newValue);
            if (targetType === CLASS_INSTANCE_TYPE && !(property in target || Object.hasOwn(targetAny, property))) {
                Logger.warn(`unable to set [${propertyPath}] in ${targetClass === null || targetClass === void 0 ? void 0 : targetClass.name} - property is unknown`);
                continue;
            }
            const allowableTypes = (_b = allowedTypes[propertyMatcherPath]) !== null && _b !== void 0 ? _b : [currentValueType];
            if (currentValueType === CLASS_INSTANCE_TYPE && newValueType === 'object') {
                // Allowed, this is the common case! - do not error.
            }
            else if (currentValueType != null && newValueType != null && !allowableTypes.includes(newValueType)) {
                Logger.warn(`unable to set [${propertyPath}] in ${targetClass === null || targetClass === void 0 ? void 0 : targetClass.name} - can't apply type of [${newValueType}], allowed types are: [${allowableTypes}]`);
                continue;
            }
            if (newValueType === 'array') {
                ctr = (_c = ctr !== null && ctr !== void 0 ? ctr : constructedArrays.get(currentValue)) !== null && _c !== void 0 ? _c : constructors[`${propertyMatcherPath}[]`];
                if (isProperties(targetAny[property])) {
                    targetAny[property].set(newValue);
                }
                else if (ctr != null) {
                    const newValueArray = newValue;
                    targetAny[property] = newValueArray.map((v, idx) => jsonApply(new ctr(), v, Object.assign(Object.assign({}, params), { path: propertyPath, matcherPath: propertyMatcherPath + '[]', idx })));
                }
                else {
                    targetAny[property] = newValue;
                }
            }
            else if (newValueType === CLASS_INSTANCE_TYPE) {
                targetAny[property] = newValue;
            }
            else if (newValueType === 'object') {
                if (currentValue != null) {
                    jsonApply(currentValue, newValue, Object.assign(Object.assign({}, params), { path: propertyPath, matcherPath: propertyMatcherPath, idx: undefined }));
                }
                else if (isProperties(targetAny[property])) {
                    targetAny[property].set(newValue);
                }
                else if (ctr != null) {
                    const obj = new ctr();
                    if (isProperties(obj)) {
                        targetAny[property] = obj.set(newValue);
                    }
                    else {
                        targetAny[property] = jsonApply(obj, newValue, Object.assign(Object.assign({}, params), { path: propertyPath, matcherPath: propertyMatcherPath, idx: undefined }));
                    }
                }
                else {
                    targetAny[property] = newValue;
                }
            }
            else if (isProperties(targetAny[property])) {
                targetAny[property].set(newValue);
            }
            else {
                targetAny[property] = newValue;
            }
        }
        catch (error) {
            Logger.warn(`unable to set [${propertyPath}] in [${targetClass === null || targetClass === void 0 ? void 0 : targetClass.name}]; nested error is: ${error.message}`);
        }
    }
    return target;
}
/**
 * Walk the given JSON object graphs, invoking the visit() callback for every object encountered.
 * Arrays are descended into without a callback, however their elements will have the visit()
 * callback invoked if they are objects.
 *
 * @param json to traverse
 * @param visit callback for each non-primitive and non-array object found
 * @param opts
 * @param opts.skip property names to skip when walking
 * @param jsons to traverse in parallel
 */
export function jsonWalk(json, visit, opts, ...jsons) {
    var _a;
    if (isArray(json)) {
        visit(json, ...jsons);
        json.forEach((node, index) => {
            jsonWalk(node, visit, opts, ...keyMapper(jsons, index));
        });
    }
    else if (isPlainObject(json)) {
        visit(json, ...jsons);
        for (const key of Object.keys(json)) {
            if ((_a = opts === null || opts === void 0 ? void 0 : opts.skip) === null || _a === void 0 ? void 0 : _a.includes(key)) {
                continue;
            }
            const value = json[key];
            if (isArray(value) || isPlainObject(value)) {
                jsonWalk(value, visit, opts, ...keyMapper(jsons, key));
            }
        }
    }
}
function keyMapper(data, key) {
    return data.map((dataObject) => dataObject === null || dataObject === void 0 ? void 0 : dataObject[key]);
}
/**
 * Classify the type of value to assist with handling for merge purposes.
 */
function classify(value) {
    if (value == null) {
        return null;
    }
    if (isHtmlElement(value) || isDate(value)) {
        return 'primitive';
    }
    if (isArray(value)) {
        return 'array';
    }
    if (isObject(value)) {
        return isPlainObject(value) ? 'object' : CLASS_INSTANCE_TYPE;
    }
    if (isFunction(value)) {
        return 'function';
    }
    return 'primitive';
}
//# sourceMappingURL=json.js.map