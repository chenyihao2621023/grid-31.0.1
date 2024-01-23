import { missing, exists } from './generic';
export function iterateObject(object, callback) {
  if (object == null) {
    return;
  }
  if (Array.isArray(object)) {
    for (let i = 0; i < object.length; i++) {
      callback(i.toString(), object[i]);
    }
    return;
  }
  for (const [key, value] of Object.entries(object)) {
    callback(key, value);
  }
}
export function cloneObject(object) {
  const copy = {};
  const keys = Object.keys(object);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = object[key];
    copy[key] = value;
  }
  return copy;
}
export function deepCloneObject(object) {
  return JSON.parse(JSON.stringify(object));
}
export function deepCloneDefinition(object, keysToSkip) {
  if (!object) {
    return;
  }
  const obj = object;
  const res = {};
  Object.keys(obj).forEach(key => {
    if (keysToSkip && keysToSkip.indexOf(key) >= 0) {
      return;
    }
    const value = obj[key];
    const sourceIsSimpleObject = isNonNullObject(value) && value.constructor === Object;
    if (sourceIsSimpleObject) {
      res[key] = deepCloneDefinition(value);
    } else {
      res[key] = value;
    }
  });
  return res;
}
export function getProperty(object, key) {
  return object[key];
}
export function setProperty(object, key, value) {
  object[key] = value;
}
export function copyPropertiesIfPresent(source, target, ...properties) {
  properties.forEach(p => copyPropertyIfPresent(source, target, p));
}
export function copyPropertyIfPresent(source, target, property, transform) {
  const value = getProperty(source, property);
  if (value !== undefined) {
    setProperty(target, property, transform ? transform(value) : value);
  }
}
export function getAllKeysInObjects(objects) {
  const allValues = {};
  objects.filter(obj => obj != null).forEach(obj => {
    Object.keys(obj).forEach(key => allValues[key] = null);
  });
  return Object.keys(allValues);
}
export function getAllValuesInObject(obj) {
  if (!obj) {
    return [];
  }
  const anyObject = Object;
  if (typeof anyObject.values === 'function') {
    return anyObject.values(obj);
  }
  const ret = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && obj.propertyIsEnumerable(key)) {
      ret.push(obj[key]);
    }
  }
  return ret;
}
export function mergeDeep(dest, source, copyUndefined = true, makeCopyOfSimpleObjects = false) {
  if (!exists(source)) {
    return;
  }
  iterateObject(source, (key, sourceValue) => {
    let destValue = dest[key];
    if (destValue === sourceValue) {
      return;
    }
    if (makeCopyOfSimpleObjects) {
      const objectIsDueToBeCopied = destValue == null && sourceValue != null;
      if (objectIsDueToBeCopied) {
        const sourceIsSimpleObject = typeof sourceValue === 'object' && sourceValue.constructor === Object;
        const dontCopy = sourceIsSimpleObject;
        if (dontCopy) {
          destValue = {};
          dest[key] = destValue;
        }
      }
    }
    if (isNonNullObject(sourceValue) && isNonNullObject(destValue) && !Array.isArray(destValue)) {
      mergeDeep(destValue, sourceValue, copyUndefined, makeCopyOfSimpleObjects);
    } else if (copyUndefined || sourceValue !== undefined) {
      dest[key] = sourceValue;
    }
  });
}
export function missingOrEmptyObject(value) {
  return missing(value) || Object.keys(value).length === 0;
}
export function get(source, expression, defaultValue) {
  if (source == null) {
    return defaultValue;
  }
  const keys = expression.split('.');
  let objectToRead = source;
  while (keys.length > 1) {
    objectToRead = objectToRead[keys.shift()];
    if (objectToRead == null) {
      return defaultValue;
    }
  }
  const value = objectToRead[keys[0]];
  return value != null ? value : defaultValue;
}
export function set(target, expression, value) {
  if (target == null) {
    return;
  }
  const keys = expression.split('.');
  let objectToUpdate = target;
  keys.forEach((key, i) => {
    if (!objectToUpdate[key]) {
      objectToUpdate[key] = {};
    }
    if (i < keys.length - 1) {
      objectToUpdate = objectToUpdate[key];
    }
  });
  objectToUpdate[keys[keys.length - 1]] = value;
}
export function getValueUsingField(data, field, fieldContainsDots) {
  if (!field || !data) {
    return;
  }
  if (!fieldContainsDots) {
    return data[field];
  }
  const fields = field.split('.');
  let currentObject = data;
  for (let i = 0; i < fields.length; i++) {
    if (currentObject == null) {
      return undefined;
    }
    currentObject = currentObject[fields[i]];
  }
  return currentObject;
}
export function removeAllReferences(obj, preserveKeys = [], preDestroyLink) {
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    if (typeof value === 'object' && !preserveKeys.includes(key)) {
      obj[key] = undefined;
    }
  });
  const proto = Object.getPrototypeOf(obj);
  const properties = {};
  const msgFunc = key => `ZING Grid: Grid API function ${key}() cannot be called as the grid has been destroyed.
    It is recommended to remove local references to the grid api. Alternatively, check gridApi.isDestroyed() to avoid calling methods against a destroyed grid.
    To run logic when the grid is about to be destroyed use the gridPreDestroy event. See: ${preDestroyLink}`;
  Object.getOwnPropertyNames(proto).forEach(key => {
    const value = proto[key];
    if (typeof value === 'function' && !preserveKeys.includes(key)) {
      const func = () => {
        console.warn(msgFunc(key));
      };
      properties[key] = {
        value: func,
        writable: true
      };
    }
  });
  Object.defineProperties(obj, properties);
}
export function isNonNullObject(value) {
  return typeof value === 'object' && value !== null;
}