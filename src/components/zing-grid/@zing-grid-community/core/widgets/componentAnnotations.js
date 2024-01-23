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
function addToObjectProps(target, key, value) {
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