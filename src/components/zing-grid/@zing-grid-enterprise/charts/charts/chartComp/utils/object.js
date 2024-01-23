function emptyTarget(value) {
  return Array.isArray(value) ? [] : {};
}
function cloneUnlessOtherwiseSpecified(value, options) {
  return options.clone !== false && options.isMergeableObject(value) ? deepMerge(emptyTarget(value), value, options) : value;
}
function defaultArrayMerge(target, source, options) {
  return target.concat(source).map(function (element) {
    return cloneUnlessOtherwiseSpecified(element, options);
  });
}
function getMergeFunction(key, options) {
  if (!options.customMerge) {
    return deepMerge;
  }
  const customMerge = options.customMerge(key);
  return typeof customMerge === 'function' ? customMerge : deepMerge;
}
function getEnumerableOwnPropertySymbols(target) {
  return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function (symbol) {
    return target.propertyIsEnumerable(symbol);
  }) : [];
}
function getKeys(target) {
  return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
}
function propertyIsOnObject(object, property) {
  try {
    return property in object;
  } catch (_) {
    return false;
  }
}
function propertyIsUnsafe(target, key) {
  return propertyIsOnObject(target, key) && !(Object.hasOwnProperty.call(target, key) && Object.propertyIsEnumerable.call(target, key));
}
function mergeObject(target = {}, source = {}, options) {
  const destination = {};
  if (options.isMergeableObject(target)) {
    getKeys(target).forEach(function (key) {
      destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
    });
  }
  getKeys(source).forEach(function (key) {
    if (propertyIsUnsafe(target, key)) {
      return;
    }
    if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
      destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
    } else {
      destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
    }
  });
  return destination;
}
function defaultIsMergeableObject(value) {
  return isNonNullObject(value) && !isSpecial(value);
}
function isNonNullObject(value) {
  return !!value && typeof value === 'object';
}
function isSpecial(value) {
  const stringValue = Object.prototype.toString.call(value);
  return stringValue === '[object RegExp]' || stringValue === '[object Date]';
}
export function deepMerge(target, source, options) {
  options = options || {};
  options.arrayMerge = options.arrayMerge || defaultArrayMerge;
  options.isMergeableObject = options.isMergeableObject || defaultIsMergeableObject;
  options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
  const sourceIsArray = Array.isArray(source);
  const targetIsArray = Array.isArray(target);
  const sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;
  if (!sourceAndTargetTypesMatch) {
    return cloneUnlessOtherwiseSpecified(source, options);
  } else if (sourceIsArray) {
    return options.arrayMerge(target, source, options);
  } else {
    return mergeObject(target, source, options);
  }
}
export function mergeDeep(dest, source, copyUndefined = true, objectsThatNeedCopy = [], iteration = 0) {
  if (!exists(source)) {
    return;
  }
  iterateObject(source, (key, sourceValue) => {
    let destValue = dest[key];
    if (destValue === sourceValue) {
      return;
    }
    const dontCopyOverSourceObject = iteration == 0 && destValue == null && sourceValue != null && objectsThatNeedCopy.indexOf(key) >= 0;
    if (dontCopyOverSourceObject) {
      destValue = {};
      dest[key] = destValue;
    }
    if (typeof destValue === 'object' && typeof sourceValue === 'object' && !Array.isArray(destValue)) {
      mergeDeep(destValue, sourceValue, copyUndefined, objectsThatNeedCopy, iteration++);
    } else if (copyUndefined || sourceValue !== undefined) {
      dest[key] = sourceValue;
    }
  });
}
function iterateObject(object, callback) {
  if (object == null) {
    return;
  }
  if (Array.isArray(object)) {
    forEach(object, (value, index) => callback(`${index}`, value));
  } else {
    forEach(Object.keys(object), key => callback(key, object[key]));
  }
}
export function exists(value, allowEmptyString = false) {
  return value != null && (allowEmptyString || value !== '');
}
function forEach(list, action) {
  if (list == null) {
    return;
  }
  for (let i = 0; i < list.length; i++) {
    action(list[i], i);
  }
}