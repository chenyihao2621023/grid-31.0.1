var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Bean } from "../context/context";
import { BeanStub } from "../context/beanStub";
import { offsetHeight, offsetWidth } from "../utils/dom";
const DEBOUNCE_DELAY = 50;
let ResizeObserverService = class ResizeObserverService extends BeanStub {
  constructor() {
    super(...arguments);
    this.polyfillFunctions = [];
  }
  observeResize(element, callback) {
    const win = this.gridOptionsService.getWindow();
    const useBrowserResizeObserver = () => {
      const resizeObserver = new win.ResizeObserver(callback);
      resizeObserver.observe(element);
      return () => resizeObserver.disconnect();
    };
    const usePolyfill = () => {
      let widthLastTime = offsetWidth(element);
      let heightLastTime = offsetHeight(element);
      let running = true;
      const periodicallyCheckWidthAndHeight = () => {
        if (running) {
          const newWidth = offsetWidth(element);
          const newHeight = offsetHeight(element);
          const changed = newWidth !== widthLastTime || newHeight !== heightLastTime;
          if (changed) {
            widthLastTime = newWidth;
            heightLastTime = newHeight;
            callback();
          }
          this.doNextPolyfillTurn(periodicallyCheckWidthAndHeight);
        }
      };
      periodicallyCheckWidthAndHeight();
      return () => running = false;
    };
    const suppressResize = this.gridOptionsService.get('suppressBrowserResizeObserver');
    const resizeObserverExists = !!win.ResizeObserver;
    if (resizeObserverExists && !suppressResize) {
      return useBrowserResizeObserver();
    }
    return usePolyfill();
  }
  doNextPolyfillTurn(func) {
    this.polyfillFunctions.push(func);
    this.schedulePolyfill();
  }
  schedulePolyfill() {
    if (this.polyfillScheduled) {
      return;
    }
    const executeAllFuncs = () => {
      const funcs = this.polyfillFunctions;
      this.polyfillScheduled = false;
      this.polyfillFunctions = [];
      funcs.forEach(f => f());
    };
    this.polyfillScheduled = true;
    this.getFrameworkOverrides().setTimeout(executeAllFuncs, DEBOUNCE_DELAY);
  }
};
ResizeObserverService = __decorate([Bean('resizeObserverService')], ResizeObserverService);
export { ResizeObserverService };