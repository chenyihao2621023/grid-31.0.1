import { exists, toStringOrNull } from './generic';
export function firstExistingValue(...values) {
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    if (exists(value)) {
      return value;
    }
  }
  return null;
}
export function existsAndNotEmpty(value) {
  return value != null && value.length > 0;
}
export function last(arr) {
  if (!arr || !arr.length) {
    return;
  }
  return arr[arr.length - 1];
}
export function areEqual(a, b, comparator) {
  if (a == null && b == null) {
    return true;
  }
  return a != null && b != null && a.length === b.length && a.every((value, index) => comparator ? comparator(value, b[index]) : b[index] === value);
}
export function shallowCompare(arr1, arr2) {
  return areEqual(arr1, arr2);
}
export function sortNumerically(array) {
  return array.sort((a, b) => a - b);
}
export function removeRepeatsFromArray(array, object) {
  if (!array) {
    return;
  }
  for (let index = array.length - 2; index >= 0; index--) {
    const thisOneMatches = array[index] === object;
    const nextOneMatches = array[index + 1] === object;
    if (thisOneMatches && nextOneMatches) {
      array.splice(index + 1, 1);
    }
  }
}
export function removeFromUnorderedArray(array, object) {
  const index = array.indexOf(object);
  if (index >= 0) {
    array[index] = array[array.length - 1];
    array.pop();
  }
}
export function removeFromArray(array, object) {
  const index = array.indexOf(object);
  if (index >= 0) {
    array.splice(index, 1);
  }
}
export function removeAllFromUnorderedArray(array, toRemove) {
  for (let i = 0; i < toRemove.length; i++) {
    removeFromUnorderedArray(array, toRemove[i]);
  }
}
export function removeAllFromArray(array, toRemove) {
  for (let i = 0; i < toRemove.length; i++) {
    removeFromArray(array, toRemove[i]);
  }
}
export function insertIntoArray(array, object, toIndex) {
  array.splice(toIndex, 0, object);
}
export function insertArrayIntoArray(dest, src, toIndex) {
  if (dest == null || src == null) {
    return;
  }
  for (let i = src.length - 1; i >= 0; i--) {
    const item = src[i];
    insertIntoArray(dest, item, toIndex);
  }
}
export function moveInArray(array, objectsToMove, toIndex) {
  removeAllFromArray(array, objectsToMove);
  objectsToMove.slice().reverse().forEach(obj => insertIntoArray(array, obj, toIndex));
}
export function includes(array, value) {
  return array.indexOf(value) > -1;
}
export function flatten(arrayOfArrays) {
  return [].concat.apply([], arrayOfArrays);
}
export function pushAll(target, source) {
  if (source == null || target == null) {
    return;
  }
  source.forEach(value => target.push(value));
}
export function toStrings(array) {
  return array.map(toStringOrNull);
}
export function forEachReverse(list, action) {
  if (list == null) {
    return;
  }
  for (let i = list.length - 1; i >= 0; i--) {
    action(list[i], i);
  }
}