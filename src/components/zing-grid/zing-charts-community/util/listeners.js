import { Logger } from './logger';
export class Listeners {
  constructor() {
    this.registeredListeners = new Map();
  }
  addListener(eventType, handler, meta) {
    const record = {
      symbol: Symbol(eventType),
      handler,
      meta
    };
    if (this.registeredListeners.has(eventType)) {
      this.registeredListeners.get(eventType).push(record);
    } else {
      this.registeredListeners.set(eventType, [record]);
    }
    return () => this.removeListener(record.symbol);
  }
  removeListener(eventSymbol) {
    for (const [type, listeners] of this.registeredListeners.entries()) {
      const matchIndex = listeners.findIndex(listener => listener.symbol === eventSymbol);
      if (matchIndex >= 0) {
        listeners.splice(matchIndex, 1);
        if (listeners.length === 0) {
          this.registeredListeners.delete(type);
        }
        break;
      }
    }
  }
  dispatch(eventType, ...params) {
    for (const listener of this.getListenersByType(eventType)) {
      try {
        listener.handler(...params);
      } catch (e) {
        Logger.errorOnce(e);
      }
    }
  }
  dispatchWrapHandlers(eventType, wrapFn, ...params) {
    for (const listener of this.getListenersByType(eventType)) {
      try {
        wrapFn(listener.handler, listener.meta, ...params);
      } catch (e) {
        Logger.errorOnce(e);
      }
    }
  }
  getListenersByType(eventType) {
    var _a;
    return (_a = this.registeredListeners.get(eventType)) !== null && _a !== void 0 ? _a : [];
  }
}