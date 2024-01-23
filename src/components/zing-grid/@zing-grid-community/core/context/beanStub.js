var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { EventService } from "../eventService";
import { Autowired, PreDestroy } from "./context";
import { addSafePassiveEventListener } from "../utils/event";
export class BeanStub {
  constructor() {
    this.destroyFunctions = [];
    this.destroyed = false;
    this.__v_skip = true;
    this.lastChangeSetIdLookup = {};
    this.propertyListenerId = 0;
    this.isAlive = () => !this.destroyed;
  }
  getFrameworkOverrides() {
    return this.frameworkOverrides;
  }
  getContext() {
    return this.context;
  }
  destroy() {
    this.destroyFunctions.forEach(func => func());
    this.destroyFunctions.length = 0;
    this.destroyed = true;
    this.dispatchEvent({
      type: BeanStub.EVENT_DESTROYED
    });
  }
  addEventListener(eventType, listener) {
    if (!this.localEventService) {
      this.localEventService = new EventService();
    }
    this.localEventService.addEventListener(eventType, listener);
  }
  removeEventListener(eventType, listener) {
    if (this.localEventService) {
      this.localEventService.removeEventListener(eventType, listener);
    }
  }
  dispatchEventAsync(event) {
    window.setTimeout(() => this.dispatchEvent(event), 0);
  }
  dispatchEvent(event) {
    if (this.localEventService) {
      this.localEventService.dispatchEvent(event);
    }
  }
  addManagedListener(object, event, listener) {
    if (this.destroyed) {
      return;
    }
    if (object instanceof HTMLElement) {
      addSafePassiveEventListener(this.getFrameworkOverrides(), object, event, listener);
    } else {
      object.addEventListener(event, listener);
    }
    const destroyFunc = () => {
      object.removeEventListener(event, listener);
      this.destroyFunctions = this.destroyFunctions.filter(fn => fn !== destroyFunc);
      return null;
    };
    this.destroyFunctions.push(destroyFunc);
    return destroyFunc;
  }
  setupGridOptionListener(event, listener) {
    this.gridOptionsService.addEventListener(event, listener);
    const destroyFunc = () => {
      this.gridOptionsService.removeEventListener(event, listener);
      this.destroyFunctions = this.destroyFunctions.filter(fn => fn !== destroyFunc);
      return null;
    };
    this.destroyFunctions.push(destroyFunc);
  }
  addManagedPropertyListener(event, listener) {
    if (this.destroyed) {
      return;
    }
    this.setupGridOptionListener(event, listener);
  }
  addManagedPropertyListeners(events, listener) {
    if (this.destroyed) {
      return;
    }
    const eventsKey = events.join('-') + this.propertyListenerId++;
    const wrappedListener = event => {
      if (event.changeSet) {
        if (event.changeSet && event.changeSet.id === this.lastChangeSetIdLookup[eventsKey]) {
          return;
        }
        this.lastChangeSetIdLookup[eventsKey] = event.changeSet.id;
      }
      const propertiesChangeEvent = {
        type: 'gridPropertyChanged',
        changeSet: event.changeSet
      };
      listener(propertiesChangeEvent);
    };
    events.forEach(event => this.setupGridOptionListener(event, wrappedListener));
  }
  addDestroyFunc(func) {
    if (this.isAlive()) {
      this.destroyFunctions.push(func);
    } else {
      func();
    }
  }
  createManagedBean(bean, context) {
    const res = this.createBean(bean, context);
    this.addDestroyFunc(this.destroyBean.bind(this, bean, context));
    return res;
  }
  createBean(bean, context, afterPreCreateCallback) {
    return (context || this.getContext()).createBean(bean, afterPreCreateCallback);
  }
  destroyBean(bean, context) {
    return (context || this.getContext()).destroyBean(bean);
  }
  destroyBeans(beans, context) {
    if (beans) {
      beans.forEach(bean => this.destroyBean(bean, context));
    }
    return [];
  }
}
BeanStub.EVENT_DESTROYED = 'destroyed';
__decorate([Autowired('frameworkOverrides')], BeanStub.prototype, "frameworkOverrides", void 0);
__decorate([Autowired('context')], BeanStub.prototype, "context", void 0);
__decorate([Autowired('eventService')], BeanStub.prototype, "eventService", void 0);
__decorate([Autowired('gridOptionsService')], BeanStub.prototype, "gridOptionsService", void 0);
__decorate([Autowired('localeService')], BeanStub.prototype, "localeService", void 0);
__decorate([Autowired('environment')], BeanStub.prototype, "environment", void 0);
__decorate([PreDestroy], BeanStub.prototype, "destroy", null);