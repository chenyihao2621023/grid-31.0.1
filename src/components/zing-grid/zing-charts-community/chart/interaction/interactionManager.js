var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
};
import { injectStyle } from '../../util/dom';
import { Logger } from '../../util/logger';
import { isNumber } from '../../util/value';
import { BaseManager } from './baseManager';
const WINDOW_EVENT_HANDLERS = ['pagehide', 'mousemove', 'mouseup'];
const EVENT_HANDLERS = ['click', 'dblclick', 'contextmenu', 'mousedown', 'mouseout', 'mouseenter', 'touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel'];
const CSS = `
.zing-chart-wrapper {
    touch-action: none;
}
`;
export class InteractionManager extends BaseManager {
  constructor(element, document, window) {
    super();
    this.eventHandler = event => this.processEvent(event);
    this.mouseDown = false;
    this.touchDown = false;
    this.pausers = {
      animation: 0,
      'context-menu': 0
    };
    this.rootElement = document.body;
    this.element = element;
    this.window = window;
    for (const type of EVENT_HANDLERS) {
      if (type.startsWith('touch')) {
        element.addEventListener(type, this.eventHandler, {
          passive: true
        });
      } else if (type === 'wheel') {
        element.addEventListener(type, this.eventHandler, {
          passive: false
        });
      } else {
        element.addEventListener(type, this.eventHandler);
      }
    }
    for (const type of WINDOW_EVENT_HANDLERS) {
      this.window.addEventListener(type, this.eventHandler);
    }
    if (!InteractionManager.interactionDocuments.includes(document)) {
      injectStyle(document, CSS);
      InteractionManager.interactionDocuments.push(document);
    }
  }
  destroy() {
    for (const type of WINDOW_EVENT_HANDLERS) {
      this.window.removeEventListener(type, this.eventHandler);
    }
    for (const type of EVENT_HANDLERS) {
      this.element.removeEventListener(type, this.eventHandler);
    }
  }
  resume(pauseType) {
    this.pausers[pauseType]--;
  }
  pause(pauseType) {
    this.pausers[pauseType]++;
  }
  processEvent(event) {
    const types = this.decideInteractionEventTypes(event);
    if (types.length > 0) {
      this.dispatchEvent(event, types).catch(e => Logger.errorOnce(e));
    }
  }
  dispatchEvent(event, types) {
    return __awaiter(this, void 0, void 0, function* () {
      const coords = this.calculateCoordinates(event);
      if (coords == null) {
        return;
      }
      const pauses = Object.entries(this.pausers).filter(([, count]) => count > 0).map(([pause]) => pause);
      for (const type of types) {
        this.listeners.dispatchWrapHandlers(type, (handler, meta, interactionEvent) => {
          var _a;
          if (pauses.length > 0 && !((_a = meta === null || meta === void 0 ? void 0 : meta.bypassPause) === null || _a === void 0 ? void 0 : _a.some(p => pauses.includes(p)))) {
            return;
          }
          if (!interactionEvent.consumed) {
            handler(interactionEvent);
          }
        }, this.buildEvent(Object.assign({
          type,
          event,
          pauses
        }, coords)));
      }
    });
  }
  decideInteractionEventTypes(event) {
    const dragStart = 'drag-start';
    switch (event.type) {
      case 'click':
        return ['click'];
      case 'dblclick':
        return ['dblclick'];
      case 'contextmenu':
        return ['contextmenu'];
      case 'mousedown':
        this.mouseDown = true;
        this.dragStartElement = event.target;
        return [dragStart];
      case 'touchstart':
        this.touchDown = true;
        this.dragStartElement = event.target;
        return [dragStart];
      case 'touchmove':
      case 'mousemove':
        if (!this.mouseDown && !this.touchDown && !this.isEventOverElement(event)) {
          return [];
        }
        return this.mouseDown || this.touchDown ? ['drag'] : ['hover'];
      case 'mouseup':
        if (!this.mouseDown && !this.isEventOverElement(event)) {
          return [];
        }
        this.mouseDown = false;
        this.dragStartElement = undefined;
        return ['drag-end'];
      case 'touchend':
        if (!this.touchDown && !this.isEventOverElement(event)) {
          return [];
        }
        this.touchDown = false;
        this.dragStartElement = undefined;
        return ['drag-end'];
      case 'mouseout':
      case 'touchcancel':
        return ['leave'];
      case 'mouseenter':
        const mouseButtonDown = event instanceof MouseEvent && (event.buttons & 1) === 1;
        if (this.mouseDown !== mouseButtonDown) {
          this.mouseDown = mouseButtonDown;
          return [mouseButtonDown ? dragStart : 'drag-end'];
        }
        return [];
      case 'pagehide':
        return ['page-left'];
      case 'wheel':
        return ['wheel'];
    }
    return [];
  }
  isEventOverElement(event) {
    var _a;
    return event.target === this.element || ((_a = event.target) === null || _a === void 0 ? void 0 : _a.parentElement) === this.element;
  }
  calculateCoordinates(event) {
    var _a;
    if (event instanceof MouseEvent) {
      const {
        clientX,
        clientY,
        pageX,
        pageY,
        offsetX,
        offsetY
      } = event;
      return this.fixOffsets(event, {
        clientX,
        clientY,
        pageX,
        pageY,
        offsetX,
        offsetY
      });
    } else if (typeof TouchEvent !== 'undefined' && event instanceof TouchEvent) {
      const lastTouch = (_a = event.touches[0]) !== null && _a !== void 0 ? _a : event.changedTouches[0];
      const {
        clientX,
        clientY,
        pageX,
        pageY
      } = lastTouch;
      return Object.assign(Object.assign({}, InteractionManager.NULL_COORDS), {
        clientX,
        clientY,
        pageX,
        pageY
      });
    } else if (event instanceof PageTransitionEvent) {
      if (event.persisted) {
        return;
      }
      return InteractionManager.NULL_COORDS;
    }
  }
  fixOffsets(event, coords) {
    const offsets = el => {
      let x = 0;
      let y = 0;
      while (el) {
        x += el.offsetLeft;
        y += el.offsetTop;
        el = el.offsetParent;
      }
      return {
        x,
        y
      };
    };
    if (this.dragStartElement != null && event.target !== this.dragStartElement) {
      const offsetDragStart = offsets(this.dragStartElement);
      const offsetEvent = offsets(event.target);
      coords.offsetX -= offsetDragStart.x - offsetEvent.x;
      coords.offsetY -= offsetDragStart.y - offsetEvent.y;
    }
    return coords;
  }
  buildEvent(opts) {
    const {
      type,
      event,
      clientX,
      clientY,
      pauses
    } = opts;
    let {
      offsetX,
      offsetY,
      pageX,
      pageY
    } = opts;
    if (!isNumber(offsetX) || !isNumber(offsetY)) {
      const rect = this.element.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
    }
    if (!isNumber(pageX) || !isNumber(pageY)) {
      const pageRect = this.rootElement.getBoundingClientRect();
      pageX = clientX - pageRect.left;
      pageY = clientY - pageRect.top;
    }
    const builtEvent = {
      type,
      offsetX: offsetX,
      offsetY: offsetY,
      pageX: pageX,
      pageY: pageY,
      sourceEvent: event,
      consumed: false,
      pauses,
      consume() {
        builtEvent.consumed = true;
      }
    };
    return builtEvent;
  }
}
InteractionManager.interactionDocuments = [];
InteractionManager.NULL_COORDS = {
  clientX: -Infinity,
  clientY: -Infinity,
  pageX: -Infinity,
  pageY: -Infinity,
  offsetX: -Infinity,
  offsetY: -Infinity
};