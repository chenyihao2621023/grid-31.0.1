import { getFunctionName } from '../utils/function';
export function QuerySelector(selector) {
    return querySelectorFunc.bind(this, selector, undefined);
}
export function RefSelector(ref) {
    return querySelectorFunc.bind(this, `[ref=${ref}]`, ref);
}
function querySelectorFunc(selector, refSelector, classPrototype, methodOrAttributeName, index) {
    if (selector === null) {
        console.error('ZING Grid: QuerySelector selector should not be null');
        return;
    }
    if (typeof index === 'number') {
        console.error('ZING Grid: QuerySelector should be on an attribute');
        return;
    }
    addToObjectProps(classPrototype, 'querySelectors', {
        attributeName: methodOrAttributeName,
        querySelector: selector,
        refSelector: refSelector
    });
}
// // think we should take this out, put property bindings on the
// export function Method(eventName?: string): Function {
//     return methodFunc.bind(this, eventName);
// }
//
// function methodFunc(alias: string, target: Object, methodName: string) {
//     if (alias === null) {
//         console.error("ZING Grid: EventListener eventName should not be null");
//         return;
//     }
//
//     addToObjectProps(target, 'methods', {
//         methodName: methodName,
//         alias: alias
//     });
// }
function addToObjectProps(target, key, value) {
    // it's an attribute on the class
    const props = getOrCreateProps(target, getFunctionName(target.constructor));
    if (!props[key]) {
        props[key] = [];
    }
    props[key].push(value);
}
function getOrCreateProps(target, instanceName) {
    if (!target.__zingComponentMetaData) {
        target.__zingComponentMetaData = {};
    }
    if (!target.__zingComponentMetaData[instanceName]) {
        target.__zingComponentMetaData[instanceName] = {};
    }
    return target.__zingComponentMetaData[instanceName];
}
//# sourceMappingURL=componentAnnotations.js.map