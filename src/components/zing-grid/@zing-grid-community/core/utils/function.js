const doOnceFlags = {};
export function doOnce(func, key) {
  if (doOnceFlags[key]) {
    return;
  }
  func();
  doOnceFlags[key] = true;
}
export function warnOnce(msg) {
  doOnce(() => console.warn("ZING Grid: " + msg), msg);
}
export function errorOnce(msg) {
  doOnce(() => console.error("ZING Grid: " + msg), msg);
}
export function getFunctionName(funcConstructor) {
  if (funcConstructor.name) {
    return funcConstructor.name;
  }
  const matches = /function\s+([^\(]+)/.exec(funcConstructor.toString());
  return matches && matches.length === 2 ? matches[1].trim() : null;
}
export function isFunction(val) {
  return !!(val && val.constructor && val.call && val.apply);
}
export function executeInAWhile(funcs) {
  executeAfter(funcs, 400);
}
const executeNextVMTurnFuncs = [];
let executeNextVMTurnPending = false;
export function executeNextVMTurn(func) {
  executeNextVMTurnFuncs.push(func);
  if (executeNextVMTurnPending) {
    return;
  }
  executeNextVMTurnPending = true;
  window.setTimeout(() => {
    const funcsCopy = executeNextVMTurnFuncs.slice();
    executeNextVMTurnFuncs.length = 0;
    executeNextVMTurnPending = false;
    funcsCopy.forEach(func => func());
  }, 0);
}
export function executeAfter(funcs, milliseconds = 0) {
  if (funcs.length > 0) {
    window.setTimeout(() => funcs.forEach(func => func()), milliseconds);
  }
}
export function debounce(func, delay) {
  let timeout;
  return function (...args) {
    const context = this;
    window.clearTimeout(timeout);
    timeout = window.setTimeout(function () {
      func.apply(context, args);
    }, delay);
  };
}
export function throttle(func, wait) {
  let previousCall = 0;
  return function (...args) {
    const context = this;
    const currentCall = new Date().getTime();
    if (currentCall - previousCall < wait) {
      return;
    }
    previousCall = currentCall;
    func.apply(context, args);
  };
}
export function waitUntil(condition, callback, timeout = 100, timeoutMessage) {
  const timeStamp = new Date().getTime();
  let interval = null;
  let executed = false;
  const internalCallback = () => {
    const reachedTimeout = new Date().getTime() - timeStamp > timeout;
    if (condition() || reachedTimeout) {
      callback();
      executed = true;
      if (interval != null) {
        window.clearInterval(interval);
        interval = null;
      }
      if (reachedTimeout && timeoutMessage) {
        console.warn(timeoutMessage);
      }
    }
  };
  internalCallback();
  if (!executed) {
    interval = window.setInterval(internalCallback, 10);
  }
}
export function compose(...fns) {
  return arg => fns.reduce((composed, f) => f(composed), arg);
}
export function callIfPresent(func) {
  if (func) {
    func();
  }
}
export const noop = () => {
  return;
};