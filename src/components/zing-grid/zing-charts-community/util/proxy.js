import { addTransformToInstanceProperty } from './decorator';
export function ProxyProperty(...proxyProperties) {
    const property = proxyProperties[proxyProperties.length - 1];
    if (proxyProperties.length === 1) {
        return addTransformToInstanceProperty((target, _, value) => {
            target[property] = value;
            return value;
        }, (target, _) => {
            return target[property];
        });
    }
    const getTarget = (target) => {
        let value = target;
        for (let i = 0; i < proxyProperties.length - 1; i += 1) {
            value = value[proxyProperties[i]];
        }
        return value;
    };
    return addTransformToInstanceProperty((target, _, value) => {
        getTarget(target)[property] = value;
        return value;
    }, (target, _) => {
        return getTarget(target)[property];
    });
}
export function ProxyOnWrite(proxyProperty) {
    return addTransformToInstanceProperty((target, _, value) => {
        target[proxyProperty] = value;
        return value;
    });
}
export function ProxyPropertyOnWrite(childName, childProperty) {
    return addTransformToInstanceProperty((target, key, value) => {
        target[childName][childProperty !== null && childProperty !== void 0 ? childProperty : key] = value;
        return value;
    });
}

export function ActionOnSet(opts) {
    const { newValue: newValueFn, oldValue: oldValueFn, changeValue: changeValueFn } = opts;
    return addTransformToInstanceProperty((target, _, newValue, oldValue) => {
        if (newValue !== oldValue) {
            if (oldValue !== undefined) {
                oldValueFn === null || oldValueFn === void 0 ? void 0 : oldValueFn.call(target, oldValue);
            }
            if (newValue !== undefined) {
                newValueFn === null || newValueFn === void 0 ? void 0 : newValueFn.call(target, newValue);
            }
            changeValueFn === null || changeValueFn === void 0 ? void 0 : changeValueFn.call(target, newValue, oldValue);
        }
        return newValue;
    });
}
