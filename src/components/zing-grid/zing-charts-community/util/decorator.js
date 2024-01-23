export const BREAK_TRANSFORM_CHAIN = Symbol('BREAK');
const CONFIG_KEY = '__decorator_config';
function initialiseConfig(target, propertyKeyOrSymbol) {
    if (Object.getOwnPropertyDescriptor(target, CONFIG_KEY) == null) {
        Object.defineProperty(target, CONFIG_KEY, { value: {} });
    }
    const config = target[CONFIG_KEY];
    const propertyKey = propertyKeyOrSymbol.toString();
    if (typeof config[propertyKey] !== 'undefined') {
        return config[propertyKey];
    }
    const valuesMap = new WeakMap();
    config[propertyKey] = { setters: [], getters: [], valuesMap };
    const descriptor = Object.getOwnPropertyDescriptor(target, propertyKeyOrSymbol);
    const prevSet = descriptor === null || descriptor === void 0 ? void 0 : descriptor.set;
    const prevGet = descriptor === null || descriptor === void 0 ? void 0 : descriptor.get;
    const getter = function () {
        let value = prevGet ? prevGet.call(this) : valuesMap.get(this);
        for (const transformFn of config[propertyKey].getters) {
            value = transformFn(this, propertyKeyOrSymbol, value);
            if (value === BREAK_TRANSFORM_CHAIN) {
                return;
            }
        }
        return value;
    };
    const setter = function (value) {
        const { setters } = config[propertyKey];
        let oldValue;
        if (setters.some((f) => f.length > 2)) {
            // Lazily retrieve old value.
            oldValue = prevGet ? prevGet.call(this) : valuesMap.get(this);
        }
        for (const transformFn of setters) {
            value = transformFn(this, propertyKeyOrSymbol, value, oldValue);
            if (value === BREAK_TRANSFORM_CHAIN) {
                return;
            }
        }
        if (prevSet) {
            prevSet.call(this, value);
        }
        else {
            valuesMap.set(this, value);
        }
    };
    Object.defineProperty(target, propertyKeyOrSymbol, {
        set: setter,
        get: getter,
        enumerable: true,
        configurable: false,
    });
    return config[propertyKey];
}
export function addTransformToInstanceProperty(setTransform, getTransform, configMetadata) {
    return (target, propertyKeyOrSymbol) => {
        const config = initialiseConfig(target, propertyKeyOrSymbol);
        config.setters.push(setTransform);
        if (getTransform) {
            config.getters.unshift(getTransform);
        }
        if (configMetadata) {
            Object.assign(config, configMetadata);
        }
    };
}
export function isDecoratedObject(target) {
    return typeof target !== 'undefined' && CONFIG_KEY in target;
}
export function listDecoratedProperties(target) {
    const targets = new Set();
    while (isDecoratedObject(target)) {
        targets.add(target === null || target === void 0 ? void 0 : target[CONFIG_KEY]);
        target = Object.getPrototypeOf(target);
    }
    return Array.from(targets).flatMap((configMap) => Object.keys(configMap));
}
export function extractDecoratedProperties(target) {
    return listDecoratedProperties(target).reduce((result, key) => {
        var _a;
        result[key] = (_a = target[key]) !== null && _a !== void 0 ? _a : null;
        return result;
    }, {});
}
export function extractDecoratedPropertyMetadata(target, propertyKeyOrSymbol) {
    const propertyKey = propertyKeyOrSymbol.toString();
    while (isDecoratedObject(target)) {
        const config = target[CONFIG_KEY];
        if (Object.hasOwn(config, propertyKey)) {
            return config[propertyKey];
        }
        target = Object.getPrototypeOf(target);
    }
}
