var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PopupService_1;
import { Autowired, Bean, PostConstruct } from "../context/context";
import { Events } from '../events';
import { BeanStub } from "../context/beanStub";
import { getAbsoluteHeight, getAbsoluteWidth, getElementRectWithOffset } from '../utils/dom';
import { last } from '../utils/array';
import { isElementInEventPath, isStopPropagationForZingGrid } from '../utils/event';
import { KeyCode } from '../constants/keyCode';
import { ZingPromise } from "../utils";
import { setAriaLabel, setAriaRole } from "../utils/aria";
import { exists } from "../utils/generic";
var DIRECTION;
(function (DIRECTION) {
  DIRECTION[DIRECTION["vertical"] = 0] = "vertical";
  DIRECTION[DIRECTION["horizontal"] = 1] = "horizontal";
})(DIRECTION || (DIRECTION = {}));
let instanceIdSeq = 0;
let PopupService = PopupService_1 = class PopupService extends BeanStub {
  constructor() {
    super(...arguments);
    this.popupList = [];
  }
  postConstruct() {
    this.ctrlsService.whenReady(p => {
      this.gridCtrl = p.gridCtrl;
    });
    this.addManagedListener(this.eventService, Events.EVENT_GRID_STYLES_CHANGED, this.handleThemeChange.bind(this));
  }
  getPopupParent() {
    const ePopupParent = this.gridOptionsService.get('popupParent');
    if (ePopupParent) {
      return ePopupParent;
    }
    return this.gridCtrl.getGui();
  }
  positionPopupForMenu(params) {
    const {
      eventSource,
      ePopup
    } = params;
    const popupIdx = this.getPopupIndex(ePopup);
    if (popupIdx !== -1) {
      const popup = this.popupList[popupIdx];
      popup.alignedToElement = eventSource;
    }
    const sourceRect = eventSource.getBoundingClientRect();
    const parentRect = this.getParentRect();
    const y = this.keepXYWithinBounds(ePopup, sourceRect.top - parentRect.top, DIRECTION.vertical);
    const minWidth = ePopup.clientWidth > 0 ? ePopup.clientWidth : 200;
    ePopup.style.minWidth = `${minWidth}px`;
    const widthOfParent = parentRect.right - parentRect.left;
    const maxX = widthOfParent - minWidth;
    let x;
    if (this.gridOptionsService.get('enableRtl')) {
      x = xLeftPosition();
      if (x < 0) {
        x = xRightPosition();
        this.setAlignedStyles(ePopup, 'left');
      }
      if (x > maxX) {
        x = 0;
        this.setAlignedStyles(ePopup, 'right');
      }
    } else {
      x = xRightPosition();
      if (x > maxX) {
        x = xLeftPosition();
        this.setAlignedStyles(ePopup, 'right');
      }
      if (x < 0) {
        x = 0;
        this.setAlignedStyles(ePopup, 'left');
      }
    }
    ePopup.style.left = `${x}px`;
    ePopup.style.top = `${y}px`;
    function xRightPosition() {
      return sourceRect.right - parentRect.left - 2;
    }
    function xLeftPosition() {
      return sourceRect.left - parentRect.left - minWidth;
    }
  }
  positionPopupUnderMouseEvent(params) {
    const {
      ePopup,
      nudgeX,
      nudgeY,
      skipObserver
    } = params;
    this.positionPopup({
      ePopup: ePopup,
      nudgeX,
      nudgeY,
      keepWithinBounds: true,
      skipObserver,
      updatePosition: () => this.calculatePointerAlign(params.mouseEvent),
      postProcessCallback: () => this.callPostProcessPopup(params.type, params.ePopup, null, params.mouseEvent, params.column, params.rowNode)
    });
  }
  calculatePointerAlign(e) {
    const parentRect = this.getParentRect();
    return {
      x: e.clientX - parentRect.left,
      y: e.clientY - parentRect.top
    };
  }
  positionPopupByComponent(params) {
    const {
      ePopup,
      nudgeX,
      nudgeY,
      keepWithinBounds,
      eventSource,
      alignSide = 'left',
      position = 'over',
      column,
      rowNode,
      type
    } = params;
    const sourceRect = eventSource.getBoundingClientRect();
    const parentRect = this.getParentRect();
    const popupIdx = this.getPopupIndex(ePopup);
    if (popupIdx !== -1) {
      const popup = this.popupList[popupIdx];
      popup.alignedToElement = eventSource;
    }
    const updatePosition = () => {
      let x = sourceRect.left - parentRect.left;
      if (alignSide === 'right') {
        x -= ePopup.offsetWidth - sourceRect.width;
      }
      let y;
      if (position === 'over') {
        y = sourceRect.top - parentRect.top;
        this.setAlignedStyles(ePopup, 'over');
      } else {
        this.setAlignedStyles(ePopup, 'under');
        const alignSide = this.shouldRenderUnderOrAbove(ePopup, sourceRect, parentRect, params.nudgeY || 0);
        if (alignSide === 'under') {
          y = sourceRect.top - parentRect.top + sourceRect.height;
        } else {
          y = sourceRect.top - ePopup.offsetHeight - (nudgeY || 0) * 2 - parentRect.top;
        }
      }
      return {
        x,
        y
      };
    };
    this.positionPopup({
      ePopup,
      nudgeX,
      nudgeY,
      keepWithinBounds,
      updatePosition,
      postProcessCallback: () => this.callPostProcessPopup(type, ePopup, eventSource, null, column, rowNode)
    });
  }
  shouldRenderUnderOrAbove(ePopup, targetCompRect, parentRect, nudgeY) {
    const spaceAvailableUnder = parentRect.bottom - targetCompRect.bottom;
    const spaceAvailableAbove = targetCompRect.top - parentRect.top;
    const spaceRequired = ePopup.offsetHeight + nudgeY;
    if (spaceAvailableUnder > spaceRequired) {
      return 'under';
    }
    if (spaceAvailableAbove > spaceRequired || spaceAvailableAbove > spaceAvailableUnder) {
      return 'above';
    }
    return 'under';
  }
  setAlignedStyles(ePopup, positioned) {
    const popupIdx = this.getPopupIndex(ePopup);
    if (popupIdx === -1) {
      return;
    }
    const popup = this.popupList[popupIdx];
    const {
      alignedToElement
    } = popup;
    if (!alignedToElement) {
      return;
    }
    const positions = ['right', 'left', 'over', 'above', 'under'];
    positions.forEach(position => {
      alignedToElement.classList.remove(`zing-has-popup-positioned-${position}`);
      ePopup.classList.remove(`zing-popup-positioned-${position}`);
    });
    if (!positioned) {
      return;
    }
    alignedToElement.classList.add(`zing-has-popup-positioned-${positioned}`);
    ePopup.classList.add(`zing-popup-positioned-${positioned}`);
  }
  callPostProcessPopup(type, ePopup, eventSource, mouseEvent, column, rowNode) {
    const callback = this.gridOptionsService.getCallback('postProcessPopup');
    if (callback) {
      const params = {
        column: column,
        rowNode: rowNode,
        ePopup: ePopup,
        type: type,
        eventSource: eventSource,
        mouseEvent: mouseEvent
      };
      callback(params);
    }
  }
  positionPopup(params) {
    const {
      ePopup,
      keepWithinBounds,
      nudgeX,
      nudgeY,
      skipObserver,
      updatePosition
    } = params;
    const lastSize = {
      width: 0,
      height: 0
    };
    const updatePopupPosition = (fromResizeObserver = false) => {
      let {
        x,
        y
      } = updatePosition();
      if (fromResizeObserver && ePopup.clientWidth === lastSize.width && ePopup.clientHeight === lastSize.height) {
        return;
      }
      lastSize.width = ePopup.clientWidth;
      lastSize.height = ePopup.clientHeight;
      if (nudgeX) {
        x += nudgeX;
      }
      if (nudgeY) {
        y += nudgeY;
      }
      if (keepWithinBounds) {
        x = this.keepXYWithinBounds(ePopup, x, DIRECTION.horizontal);
        y = this.keepXYWithinBounds(ePopup, y, DIRECTION.vertical);
      }
      ePopup.style.left = `${x}px`;
      ePopup.style.top = `${y}px`;
      if (params.postProcessCallback) {
        params.postProcessCallback();
      }
    };
    updatePopupPosition();
    if (!skipObserver) {
      const resizeObserverDestroyFunc = this.resizeObserverService.observeResize(ePopup, () => updatePopupPosition(true));
      setTimeout(() => resizeObserverDestroyFunc(), PopupService_1.WAIT_FOR_POPUP_CONTENT_RESIZE);
    }
  }
  getActivePopups() {
    return this.popupList.map(popup => popup.element);
  }
  getPopupList() {
    return this.popupList;
  }
  getParentRect() {
    const eDocument = this.gridOptionsService.getDocument();
    let popupParent = this.getPopupParent();
    if (popupParent === eDocument.body) {
      popupParent = eDocument.documentElement;
    } else if (getComputedStyle(popupParent).position === 'static') {
      popupParent = popupParent.offsetParent;
    }
    return getElementRectWithOffset(popupParent);
  }
  keepXYWithinBounds(ePopup, position, direction) {
    const isVertical = direction === DIRECTION.vertical;
    const sizeProperty = isVertical ? 'clientHeight' : 'clientWidth';
    const anchorProperty = isVertical ? 'top' : 'left';
    const offsetProperty = isVertical ? 'offsetHeight' : 'offsetWidth';
    const scrollPositionProperty = isVertical ? 'scrollTop' : 'scrollLeft';
    const eDocument = this.gridOptionsService.getDocument();
    const docElement = eDocument.documentElement;
    const popupParent = this.getPopupParent();
    const parentRect = popupParent.getBoundingClientRect();
    const documentRect = eDocument.documentElement.getBoundingClientRect();
    const isBody = popupParent === eDocument.body;
    const offsetSize = ePopup[offsetProperty];
    const getSize = isVertical ? getAbsoluteHeight : getAbsoluteWidth;
    let sizeOfParent = isBody ? getSize(docElement) + docElement[scrollPositionProperty] : popupParent[sizeProperty];
    if (isBody) {
      sizeOfParent -= Math.abs(documentRect[anchorProperty] - parentRect[anchorProperty]);
    }
    const max = sizeOfParent - offsetSize;
    return Math.min(Math.max(position, 0), Math.abs(max));
  }
  addPopup(params) {
    const eDocument = this.gridOptionsService.getDocument();
    const {
      eChild,
      ariaLabel,
      alwaysOnTop,
      positionCallback,
      anchorToElement
    } = params;
    if (!eDocument) {
      console.warn('ZING Grid: could not find the document, document is empty');
      return {
        hideFunc: () => {}
      };
    }
    const pos = this.getPopupIndex(eChild);
    if (pos !== -1) {
      const popup = this.popupList[pos];
      return {
        hideFunc: popup.hideFunc
      };
    }
    this.initialisePopupPosition(eChild);
    const wrapperEl = this.createPopupWrapper(eChild, ariaLabel, !!alwaysOnTop);
    const removeListeners = this.addEventListenersToPopup(Object.assign(Object.assign({}, params), {
      wrapperEl
    }));
    if (positionCallback) {
      positionCallback();
    }
    this.addPopupToPopupList(eChild, wrapperEl, removeListeners, anchorToElement);
    return {
      hideFunc: removeListeners
    };
  }
  initialisePopupPosition(element) {
    const ePopupParent = this.getPopupParent();
    const ePopupParentRect = ePopupParent.getBoundingClientRect();
    if (!exists(element.style.top)) {
      element.style.top = `${ePopupParentRect.top * -1}px`;
    }
    if (!exists(element.style.left)) {
      element.style.left = `${ePopupParentRect.left * -1}px`;
    }
  }
  createPopupWrapper(element, ariaLabel, alwaysOnTop) {
    const ePopupParent = this.getPopupParent();
    const eWrapper = document.createElement('div');
    const {
      allThemes
    } = this.environment.getTheme();
    if (allThemes.length) {
      eWrapper.classList.add(...allThemes);
    }
    eWrapper.classList.add('zing-popup');
    element.classList.add(this.gridOptionsService.get('enableRtl') ? 'zing-rtl' : 'zing-ltr', 'zing-popup-child');
    if (!element.hasAttribute('role')) {
      setAriaRole(element, 'dialog');
    }
    setAriaLabel(element, ariaLabel);
    eWrapper.appendChild(element);
    ePopupParent.appendChild(eWrapper);
    if (alwaysOnTop) {
      this.setAlwaysOnTop(element, true);
    } else {
      this.bringPopupToFront(element);
    }
    return eWrapper;
  }
  handleThemeChange() {
    const {
      allThemes
    } = this.environment.getTheme();
    for (const popup of this.popupList) {
      for (const className of Array.from(popup.wrapper.classList)) {
        if (className.startsWith("zing-theme-")) {
          popup.wrapper.classList.remove(className);
        }
      }
      if (allThemes.length) {
        popup.wrapper.classList.add(...allThemes);
      }
    }
  }
  addEventListenersToPopup(params) {
    const eDocument = this.gridOptionsService.getDocument();
    const ePopupParent = this.getPopupParent();
    const {
      wrapperEl,
      eChild: popupEl,
      click: pointerEvent,
      closedCallback,
      afterGuiAttached,
      closeOnEsc,
      modal
    } = params;
    let popupHidden = false;
    const hidePopupOnKeyboardEvent = event => {
      if (!wrapperEl.contains(eDocument.activeElement)) {
        return;
      }
      const key = event.key;
      if (key === KeyCode.ESCAPE && !isStopPropagationForZingGrid(event)) {
        removeListeners({
          keyboardEvent: event
        });
      }
    };
    const hidePopupOnMouseEvent = event => removeListeners({
      mouseEvent: event
    });
    const hidePopupOnTouchEvent = event => removeListeners({
      touchEvent: event
    });
    const removeListeners = (popupParams = {}) => {
      const {
        mouseEvent,
        touchEvent,
        keyboardEvent
      } = popupParams;
      if (this.isEventFromCurrentPopup({
        mouseEvent,
        touchEvent
      }, popupEl) || popupHidden) {
        return;
      }
      popupHidden = true;
      ePopupParent.removeChild(wrapperEl);
      eDocument.removeEventListener('keydown', hidePopupOnKeyboardEvent);
      eDocument.removeEventListener('mousedown', hidePopupOnMouseEvent);
      eDocument.removeEventListener('touchstart', hidePopupOnTouchEvent);
      eDocument.removeEventListener('contextmenu', hidePopupOnMouseEvent);
      this.eventService.removeEventListener(Events.EVENT_DRAG_STARTED, hidePopupOnMouseEvent);
      if (closedCallback) {
        closedCallback(mouseEvent || touchEvent || keyboardEvent);
      }
      this.removePopupFromPopupList(popupEl);
    };
    if (afterGuiAttached) {
      afterGuiAttached({
        hidePopup: removeListeners
      });
    }
    window.setTimeout(() => {
      if (closeOnEsc) {
        eDocument.addEventListener('keydown', hidePopupOnKeyboardEvent);
      }
      if (modal) {
        eDocument.addEventListener('mousedown', hidePopupOnMouseEvent);
        this.eventService.addEventListener(Events.EVENT_DRAG_STARTED, hidePopupOnMouseEvent);
        eDocument.addEventListener('touchstart', hidePopupOnTouchEvent);
        eDocument.addEventListener('contextmenu', hidePopupOnMouseEvent);
      }
    }, 0);
    return removeListeners;
  }
  addPopupToPopupList(element, wrapperEl, removeListeners, anchorToElement) {
    this.popupList.push({
      element: element,
      wrapper: wrapperEl,
      hideFunc: removeListeners,
      instanceId: instanceIdSeq++,
      isAnchored: !!anchorToElement
    });
    if (anchorToElement) {
      this.setPopupPositionRelatedToElement(element, anchorToElement);
    }
  }
  getPopupIndex(el) {
    return this.popupList.findIndex(p => p.element === el);
  }
  setPopupPositionRelatedToElement(popupEl, relativeElement) {
    const popupIndex = this.getPopupIndex(popupEl);
    if (popupIndex === -1) {
      return;
    }
    const popup = this.popupList[popupIndex];
    if (popup.stopAnchoringPromise) {
      popup.stopAnchoringPromise.then(destroyFunc => destroyFunc && destroyFunc());
    }
    popup.stopAnchoringPromise = undefined;
    popup.isAnchored = false;
    if (!relativeElement) {
      return;
    }
    const destroyPositionTracker = this.keepPopupPositionedRelativeTo({
      element: relativeElement,
      ePopup: popupEl,
      hidePopup: popup.hideFunc
    });
    popup.stopAnchoringPromise = destroyPositionTracker;
    popup.isAnchored = true;
    return destroyPositionTracker;
  }
  removePopupFromPopupList(element) {
    this.setAlignedStyles(element, null);
    this.setPopupPositionRelatedToElement(element, null);
    this.popupList = this.popupList.filter(p => p.element !== element);
  }
  keepPopupPositionedRelativeTo(params) {
    const eParent = this.getPopupParent();
    const parentRect = eParent.getBoundingClientRect();
    const {
      element,
      ePopup
    } = params;
    const sourceRect = element.getBoundingClientRect();
    const initialDiffTop = parentRect.top - sourceRect.top;
    const initialDiffLeft = parentRect.left - sourceRect.left;
    let lastDiffTop = initialDiffTop;
    let lastDiffLeft = initialDiffLeft;
    const topPx = ePopup.style.top;
    const top = parseInt(topPx.substring(0, topPx.length - 1), 10);
    const leftPx = ePopup.style.left;
    const left = parseInt(leftPx.substring(0, leftPx.length - 1), 10);
    return new ZingPromise(resolve => {
      this.getFrameworkOverrides().setInterval(() => {
        const pRect = eParent.getBoundingClientRect();
        const sRect = element.getBoundingClientRect();
        const elementNotInDom = sRect.top == 0 && sRect.left == 0 && sRect.height == 0 && sRect.width == 0;
        if (elementNotInDom) {
          params.hidePopup();
          return;
        }
        const currentDiffTop = pRect.top - sRect.top;
        if (currentDiffTop != lastDiffTop) {
          const newTop = this.keepXYWithinBounds(ePopup, top + initialDiffTop - currentDiffTop, DIRECTION.vertical);
          ePopup.style.top = `${newTop}px`;
        }
        lastDiffTop = currentDiffTop;
        const currentDiffLeft = pRect.left - sRect.left;
        if (currentDiffLeft != lastDiffLeft) {
          const newLeft = this.keepXYWithinBounds(ePopup, left + initialDiffLeft - currentDiffLeft, DIRECTION.horizontal);
          ePopup.style.left = `${newLeft}px`;
        }
        lastDiffLeft = currentDiffLeft;
      }, 200).then(intervalId => {
        const result = () => {
          if (intervalId != null) {
            window.clearInterval(intervalId);
          }
        };
        resolve(result);
      });
    });
  }
  hasAnchoredPopup() {
    return this.popupList.some(popup => popup.isAnchored);
  }
  isEventFromCurrentPopup(params, target) {
    const {
      mouseEvent,
      touchEvent
    } = params;
    const event = mouseEvent ? mouseEvent : touchEvent;
    if (!event) {
      return false;
    }
    const indexOfThisChild = this.getPopupIndex(target);
    if (indexOfThisChild === -1) {
      return false;
    }
    for (let i = indexOfThisChild; i < this.popupList.length; i++) {
      const popup = this.popupList[i];
      if (isElementInEventPath(popup.element, event)) {
        return true;
      }
    }
    return this.isElementWithinCustomPopup(event.target);
  }
  isElementWithinCustomPopup(el) {
    const eDocument = this.gridOptionsService.getDocument();
    while (el && el !== eDocument.body) {
      if (el.classList.contains('zing-custom-component-popup') || el.parentElement === null) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  }
  getWrapper(ePopup) {
    while (!ePopup.classList.contains('zing-popup') && ePopup.parentElement) {
      ePopup = ePopup.parentElement;
    }
    return ePopup.classList.contains('zing-popup') ? ePopup : null;
  }
  setAlwaysOnTop(ePopup, alwaysOnTop) {
    const eWrapper = this.getWrapper(ePopup);
    if (!eWrapper) {
      return;
    }
    eWrapper.classList.toggle('zing-always-on-top', !!alwaysOnTop);
    if (alwaysOnTop) {
      this.bringPopupToFront(eWrapper);
    }
  }
  bringPopupToFront(ePopup) {
    const parent = this.getPopupParent();
    const popupList = Array.prototype.slice.call(parent.querySelectorAll('.zing-popup'));
    const popupLen = popupList.length;
    const alwaysOnTopList = Array.prototype.slice.call(parent.querySelectorAll('.zing-popup.zing-always-on-top'));
    const onTopLength = alwaysOnTopList.length;
    const eWrapper = this.getWrapper(ePopup);
    if (!eWrapper || popupLen <= 1 || !parent.contains(ePopup)) {
      return;
    }
    const pos = popupList.indexOf(eWrapper);
    const innerEls = eWrapper.querySelectorAll('div');
    const innerElsScrollMap = [];
    innerEls.forEach(el => {
      if (el.scrollTop !== 0) {
        innerElsScrollMap.push([el, el.scrollTop]);
      }
    });
    if (onTopLength) {
      const isPopupAlwaysOnTop = eWrapper.classList.contains('zing-always-on-top');
      if (isPopupAlwaysOnTop) {
        if (pos !== popupLen - 1) {
          last(alwaysOnTopList).insertAdjacentElement('afterend', eWrapper);
        }
      } else if (pos !== popupLen - onTopLength - 1) {
        alwaysOnTopList[0].insertAdjacentElement('beforebegin', eWrapper);
      }
    } else if (pos !== popupLen - 1) {
      last(popupList).insertAdjacentElement('afterend', eWrapper);
    }
    while (innerElsScrollMap.length) {
      const currentEl = innerElsScrollMap.pop();
      currentEl[0].scrollTop = currentEl[1];
    }
    const params = {
      type: 'popupToFront',
      api: this.gridOptionsService.api,
      columnApi: this.gridOptionsService.columnApi,
      eWrapper
    };
    this.eventService.dispatchEvent(params);
  }
};
PopupService.WAIT_FOR_POPUP_CONTENT_RESIZE = 200;
__decorate([Autowired('focusService')], PopupService.prototype, "focusService", void 0);
__decorate([Autowired('ctrlsService')], PopupService.prototype, "ctrlsService", void 0);
__decorate([Autowired('resizeObserverService')], PopupService.prototype, "resizeObserverService", void 0);
__decorate([PostConstruct], PopupService.prototype, "postConstruct", null);
PopupService = PopupService_1 = __decorate([Bean('popupService')], PopupService);
export { PopupService };