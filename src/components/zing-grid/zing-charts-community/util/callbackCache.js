import { Logger } from './logger';
export class CallbackCache {
  constructor() {
    this.cache = new WeakMap();
  }
  call(fn, ...params) {
    let serialisedParams;
    let paramCache = this.cache.get(fn);
    const invoke = () => {
      try {
        const result = fn(...params);
        if (paramCache && serialisedParams != null) {
          paramCache.set(serialisedParams, result);
        }
        return result;
      } catch (e) {
        Logger.warnOnce(`User callback errored, ignoring`, e);
        return undefined;
      }
    };
    try {
      serialisedParams = JSON.stringify(params);
    } catch (e) {
      return invoke();
    }
    if (paramCache == null) {
      paramCache = new Map();
      this.cache.set(fn, paramCache);
    }
    if (!paramCache.has(serialisedParams)) {
      return invoke();
    }
    return paramCache.get(serialisedParams);
  }
  invalidateCache() {
    this.cache = new WeakMap();
  }
}