var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = this && this.__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
import { Bean, Qualifier } from "./context/context";
let EventService = class EventService {
  constructor() {
    this.allSyncListeners = new Map();
    this.allAsyncListeners = new Map();
    this.globalSyncListeners = new Set();
    this.globalAsyncListeners = new Set();
    this.asyncFunctionsQueue = [];
    this.scheduled = false;
    this.firedEvents = {};
  }
  setBeans(loggerFactory, gridOptionsService, frameworkOverrides, globalEventListener = null, globalSyncEventListener = null) {
    this.frameworkOverrides = frameworkOverrides;
    this.gridOptionsService = gridOptionsService;
    if (globalEventListener) {
      const async = gridOptionsService.useAsyncEvents();
      this.addGlobalListener(globalEventListener, async);
    }
    if (globalSyncEventListener) {
      this.addGlobalListener(globalSyncEventListener, false);
    }
  }
  getListeners(eventType, async, autoCreateListenerCollection) {
    const listenerMap = async ? this.allAsyncListeners : this.allSyncListeners;
    let listeners = listenerMap.get(eventType);
    if (!listeners && autoCreateListenerCollection) {
      listeners = new Set();
      listenerMap.set(eventType, listeners);
    }
    return listeners;
  }
  noRegisteredListenersExist() {
    return this.allSyncListeners.size === 0 && this.allAsyncListeners.size === 0 && this.globalSyncListeners.size === 0 && this.globalAsyncListeners.size === 0;
  }
  addEventListener(eventType, listener, async = false) {
    this.getListeners(eventType, async, true).add(listener);
  }
  removeEventListener(eventType, listener, async = false) {
    const listeners = this.getListeners(eventType, async, false);
    if (!listeners) {
      return;
    }
    listeners.delete(listener);
    if (listeners.size === 0) {
      const listenerMap = async ? this.allAsyncListeners : this.allSyncListeners;
      listenerMap.delete(eventType);
    }
  }
  addGlobalListener(listener, async = false) {
    (async ? this.globalAsyncListeners : this.globalSyncListeners).add(listener);
  }
  removeGlobalListener(listener, async = false) {
    (async ? this.globalAsyncListeners : this.globalSyncListeners).delete(listener);
  }
  dispatchEvent(event) {
    let zingEvent = event;
    if (this.gridOptionsService) {
      const {
        api,
        columnApi,
        context
      } = this.gridOptionsService;
      zingEvent.api = api;
      zingEvent.columnApi = columnApi;
      zingEvent.context = context;
    }
    this.dispatchToListeners(zingEvent, true);
    this.dispatchToListeners(zingEvent, false);
    this.firedEvents[zingEvent.type] = true;
  }
  dispatchEventOnce(event) {
    if (!this.firedEvents[event.type]) {
      this.dispatchEvent(event);
    }
  }
  dispatchToListeners(event, async) {
    var _a;
    const eventType = event.type;
    if (async && 'event' in event) {
      const browserEvent = event.event;
      if (browserEvent instanceof Event) {
        event.eventPath = browserEvent.composedPath();
      }
    }
    const processEventListeners = (listeners, originalListeners) => listeners.forEach(listener => {
      if (!originalListeners.has(listener)) {
        return;
      }
      if (async) {
        this.dispatchAsync(() => listener(event));
      } else {
        listener(event);
      }
    });
    const originalListeners = (_a = this.getListeners(eventType, async, false)) !== null && _a !== void 0 ? _a : new Set();
    const listeners = new Set(originalListeners);
    if (listeners.size > 0) {
      processEventListeners(listeners, originalListeners);
    }
    const globalListeners = new Set(async ? this.globalAsyncListeners : this.globalSyncListeners);
    globalListeners.forEach(listener => {
      if (async) {
        this.dispatchAsync(() => this.frameworkOverrides.dispatchEvent(eventType, () => listener(eventType, event), true));
      } else {
        this.frameworkOverrides.dispatchEvent(eventType, () => listener(eventType, event), true);
      }
    });
  }
  dispatchAsync(func) {
    this.asyncFunctionsQueue.push(func);
    if (!this.scheduled) {
      window.setTimeout(this.flushAsyncQueue.bind(this), 0);
      this.scheduled = true;
    }
  }
  flushAsyncQueue() {
    this.scheduled = false;
    const queueCopy = this.asyncFunctionsQueue.slice();
    this.asyncFunctionsQueue = [];
    queueCopy.forEach(func => func());
  }
};
__decorate([__param(0, Qualifier('loggerFactory')), __param(1, Qualifier('gridOptionsService')), __param(2, Qualifier('frameworkOverrides')), __param(3, Qualifier('globalEventListener')), __param(4, Qualifier('globalSyncEventListener'))], EventService.prototype, "setBeans", null);
EventService = __decorate([Bean('eventService')], EventService);
export { EventService };