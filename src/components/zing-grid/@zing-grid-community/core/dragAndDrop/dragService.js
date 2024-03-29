var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Bean, PreDestroy, Autowired } from "../context/context";
import { Events } from "../events";
import { BeanStub } from "../context/beanStub";
import { exists } from "../utils/generic";
import { removeFromArray } from "../utils/array";
import { areEventsNear } from "../utils/mouse";
import { isBrowserSafari } from "../utils/browser";
import { isFocusableFormField } from "../utils/dom";
let DragService = class DragService extends BeanStub {
  constructor() {
    super(...arguments);
    this.dragEndFunctions = [];
    this.dragSources = [];
  }
  removeAllListeners() {
    this.dragSources.forEach(this.removeListener.bind(this));
    this.dragSources.length = 0;
  }
  removeListener(dragSourceAndListener) {
    const element = dragSourceAndListener.dragSource.eElement;
    const mouseDownListener = dragSourceAndListener.mouseDownListener;
    element.removeEventListener('mousedown', mouseDownListener);
    if (dragSourceAndListener.touchEnabled) {
      const touchStartListener = dragSourceAndListener.touchStartListener;
      element.removeEventListener('touchstart', touchStartListener, {
        passive: true
      });
    }
  }
  removeDragSource(params) {
    const dragSourceAndListener = this.dragSources.find(item => item.dragSource === params);
    if (!dragSourceAndListener) {
      return;
    }
    this.removeListener(dragSourceAndListener);
    removeFromArray(this.dragSources, dragSourceAndListener);
  }
  isDragging() {
    return this.dragging;
  }
  addDragSource(params) {
    const mouseListener = this.onMouseDown.bind(this, params);
    const {
      eElement,
      includeTouch,
      stopPropagationForTouch
    } = params;
    eElement.addEventListener('mousedown', mouseListener);
    let touchListener = null;
    const suppressTouch = this.gridOptionsService.get('suppressTouch');
    if (includeTouch && !suppressTouch) {
      touchListener = touchEvent => {
        if (isFocusableFormField(touchEvent.target)) {
          return;
        }
        if (touchEvent.cancelable) {
          touchEvent.preventDefault();
          if (stopPropagationForTouch) {
            touchEvent.stopPropagation();
          }
        }
        this.onTouchStart(params, touchEvent);
      };
      eElement.addEventListener('touchstart', touchListener, {
        passive: false
      });
    }
    this.dragSources.push({
      dragSource: params,
      mouseDownListener: mouseListener,
      touchStartListener: touchListener,
      touchEnabled: !!includeTouch
    });
  }
  getStartTarget() {
    return this.startTarget;
  }
  onTouchStart(params, touchEvent) {
    this.currentDragParams = params;
    this.dragging = false;
    const touch = touchEvent.touches[0];
    this.touchLastTime = touch;
    this.touchStart = touch;
    const touchMoveEvent = e => this.onTouchMove(e, params.eElement);
    const touchEndEvent = e => this.onTouchUp(e, params.eElement);
    const documentTouchMove = e => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };
    const target = touchEvent.target;
    const events = [{
      target: this.gridOptionsService.getRootNode(),
      type: 'touchmove',
      listener: documentTouchMove,
      options: {
        passive: false
      }
    }, {
      target,
      type: 'touchmove',
      listener: touchMoveEvent,
      options: {
        passive: true
      }
    }, {
      target,
      type: 'touchend',
      listener: touchEndEvent,
      options: {
        passive: true
      }
    }, {
      target,
      type: 'touchcancel',
      listener: touchEndEvent,
      options: {
        passive: true
      }
    }];
    this.addTemporaryEvents(events);
    if (params.dragStartPixels === 0) {
      this.onCommonMove(touch, this.touchStart, params.eElement);
    }
  }
  onMouseDown(params, mouseEvent) {
    const e = mouseEvent;
    if (params.skipMouseEvent && params.skipMouseEvent(mouseEvent)) {
      return;
    }
    if (e._alreadyProcessedByDragService) {
      return;
    }
    e._alreadyProcessedByDragService = true;
    if (mouseEvent.button !== 0) {
      return;
    }
    if (this.shouldPreventMouseEvent(mouseEvent)) {
      mouseEvent.preventDefault();
    }
    this.currentDragParams = params;
    this.dragging = false;
    this.mouseStartEvent = mouseEvent;
    this.startTarget = mouseEvent.target;
    const mouseMoveEvent = event => this.onMouseMove(event, params.eElement);
    const mouseUpEvent = event => this.onMouseUp(event, params.eElement);
    const contextEvent = event => event.preventDefault();
    const target = this.gridOptionsService.getRootNode();
    const events = [{
      target,
      type: 'mousemove',
      listener: mouseMoveEvent
    }, {
      target,
      type: 'mouseup',
      listener: mouseUpEvent
    }, {
      target,
      type: 'contextmenu',
      listener: contextEvent
    }];
    this.addTemporaryEvents(events);
    if (params.dragStartPixels === 0) {
      this.onMouseMove(mouseEvent, params.eElement);
    }
  }
  addTemporaryEvents(events) {
    events.forEach(currentEvent => {
      const {
        target,
        type,
        listener,
        options
      } = currentEvent;
      target.addEventListener(type, listener, options);
    });
    this.dragEndFunctions.push(() => {
      events.forEach(currentEvent => {
        const {
          target,
          type,
          listener,
          options
        } = currentEvent;
        target.removeEventListener(type, listener, options);
      });
    });
  }
  isEventNearStartEvent(currentEvent, startEvent) {
    const {
      dragStartPixels
    } = this.currentDragParams;
    const requiredPixelDiff = exists(dragStartPixels) ? dragStartPixels : 4;
    return areEventsNear(currentEvent, startEvent, requiredPixelDiff);
  }
  getFirstActiveTouch(touchList) {
    for (let i = 0; i < touchList.length; i++) {
      if (touchList[i].identifier === this.touchStart.identifier) {
        return touchList[i];
      }
    }
    return null;
  }
  onCommonMove(currentEvent, startEvent, el) {
    if (!this.dragging) {
      if (!this.dragging && this.isEventNearStartEvent(currentEvent, startEvent)) {
        return;
      }
      this.dragging = true;
      const event = {
        type: Events.EVENT_DRAG_STARTED,
        target: el
      };
      this.eventService.dispatchEvent(event);
      this.currentDragParams.onDragStart(startEvent);
      this.currentDragParams.onDragging(startEvent);
    }
    this.currentDragParams.onDragging(currentEvent);
  }
  onTouchMove(touchEvent, el) {
    const touch = this.getFirstActiveTouch(touchEvent.touches);
    if (!touch) {
      return;
    }
    this.onCommonMove(touch, this.touchStart, el);
  }
  onMouseMove(mouseEvent, el) {
    var _a;
    if (isBrowserSafari()) {
      const eDocument = this.gridOptionsService.getDocument();
      (_a = eDocument.getSelection()) === null || _a === void 0 ? void 0 : _a.removeAllRanges();
    }
    if (this.shouldPreventMouseEvent(mouseEvent)) {
      mouseEvent.preventDefault();
    }
    this.onCommonMove(mouseEvent, this.mouseStartEvent, el);
  }
  shouldPreventMouseEvent(mouseEvent) {
    const isEnableCellTextSelect = this.gridOptionsService.get('enableCellTextSelection');
    const isMouseMove = mouseEvent.type === 'mousemove';
    return isEnableCellTextSelect && isMouseMove && mouseEvent.cancelable && this.mouseEventService.isEventFromThisGrid(mouseEvent) && !this.isOverFormFieldElement(mouseEvent);
  }
  isOverFormFieldElement(mouseEvent) {
    const el = mouseEvent.target;
    const tagName = el === null || el === void 0 ? void 0 : el.tagName.toLocaleLowerCase();
    return !!(tagName === null || tagName === void 0 ? void 0 : tagName.match('^a$|textarea|input|select|button'));
  }
  onTouchUp(touchEvent, el) {
    let touch = this.getFirstActiveTouch(touchEvent.changedTouches);
    if (!touch) {
      touch = this.touchLastTime;
    }
    this.onUpCommon(touch, el);
  }
  onMouseUp(mouseEvent, el) {
    this.onUpCommon(mouseEvent, el);
  }
  onUpCommon(eventOrTouch, el) {
    if (this.dragging) {
      this.dragging = false;
      this.currentDragParams.onDragStop(eventOrTouch);
      const event = {
        type: Events.EVENT_DRAG_STOPPED,
        target: el
      };
      this.eventService.dispatchEvent(event);
    }
    this.mouseStartEvent = null;
    this.startTarget = null;
    this.touchStart = null;
    this.touchLastTime = null;
    this.currentDragParams = null;
    this.dragEndFunctions.forEach(func => func());
    this.dragEndFunctions.length = 0;
  }
};
__decorate([Autowired('mouseEventService')], DragService.prototype, "mouseEventService", void 0);
__decorate([PreDestroy], DragService.prototype, "removeAllListeners", null);
DragService = __decorate([Bean('dragService')], DragService);
export { DragService };