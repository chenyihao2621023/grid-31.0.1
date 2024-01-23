import { includes } from './array';
const ZING_GRID_STOP_PROPAGATION = '__zing_Grid_Stop_Propagation';
const PASSIVE_EVENTS = ['touchstart', 'touchend', 'touchmove', 'touchcancel', 'scroll'];
const supports = {};
export function stopPropagationForZingGrid(event) {
  event[ZING_GRID_STOP_PROPAGATION] = true;
}
export function isStopPropagationForZingGrid(event) {
  return event[ZING_GRID_STOP_PROPAGATION] === true;
}
export const isEventSupported = (() => {
  const tags = {
    select: 'input',
    change: 'input',
    submit: 'form',
    reset: 'form',
    error: 'img',
    load: 'img',
    abort: 'img'
  };
  const eventChecker = eventName => {
    if (typeof supports[eventName] === 'boolean') {
      return supports[eventName];
    }
    const el = document.createElement(tags[eventName] || 'div');
    eventName = 'on' + eventName;
    return supports[eventName] = eventName in el;
  };
  return eventChecker;
})();
export function getCtrlForEventTarget(gridOptionsService, eventTarget, type) {
  let sourceElement = eventTarget;
  while (sourceElement) {
    const renderedComp = gridOptionsService.getDomData(sourceElement, type);
    if (renderedComp) {
      return renderedComp;
    }
    sourceElement = sourceElement.parentElement;
  }
  return null;
}
export function isElementInEventPath(element, event) {
  if (!event || !element) {
    return false;
  }
  return getEventPath(event).indexOf(element) >= 0;
}
export function createEventPath(event) {
  const res = [];
  let pointer = event.target;
  while (pointer) {
    res.push(pointer);
    pointer = pointer.parentElement;
  }
  return res;
}
export function getEventPath(event) {
  const eventNoType = event;
  if (eventNoType.path) {
    return eventNoType.path;
  }
  if (eventNoType.composedPath) {
    return eventNoType.composedPath();
  }
  return createEventPath(eventNoType);
}
export function addSafePassiveEventListener(frameworkOverrides, eElement, event, listener) {
  const isPassive = includes(PASSIVE_EVENTS, event);
  const options = isPassive ? {
    passive: true
  } : undefined;
  if (frameworkOverrides && frameworkOverrides.addEventListener) {
    frameworkOverrides.addEventListener(eElement, event, listener, options);
  }
}