var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BeanStub } from "../context/beanStub";
import { Autowired, Optional } from "../context/context";
import { LayoutFeature } from "../styling/layoutFeature";
import { Events } from "../eventKeys";
import { GridBodyScrollFeature } from "./gridBodyScrollFeature";
import { getInnerWidth, isElementChildOfClass, isVerticalScrollShowing } from "../utils/dom";
import { RowDragFeature } from "./rowDragFeature";
import { getTabIndex, isInvisibleScrollbar, isIOSUserAgent } from "../utils/browser";
import { TouchListener } from "../widgets/touchListener";
export var RowAnimationCssClasses;
(function (RowAnimationCssClasses) {
  RowAnimationCssClasses["ANIMATION_ON"] = "zing-row-animation";
  RowAnimationCssClasses["ANIMATION_OFF"] = "zing-row-no-animation";
})(RowAnimationCssClasses || (RowAnimationCssClasses = {}));
export const CSS_CLASS_FORCE_VERTICAL_SCROLL = 'zing-force-vertical-scroll';
const CSS_CLASS_CELL_SELECTABLE = 'zing-selectable';
const CSS_CLASS_COLUMN_MOVING = 'zing-column-moving';
export class GridBodyCtrl extends BeanStub {
  constructor() {
    super(...arguments);
    this.stickyTopHeight = 0;
  }
  getScrollFeature() {
    return this.bodyScrollFeature;
  }
  getBodyViewportElement() {
    return this.eBodyViewport;
  }
  setComp(comp, eGridBody, eBodyViewport, eTop, eBottom, eStickyTop) {
    this.comp = comp;
    this.eGridBody = eGridBody;
    this.eBodyViewport = eBodyViewport;
    this.eTop = eTop;
    this.eBottom = eBottom;
    this.eStickyTop = eStickyTop;
    this.setCellTextSelection(this.gridOptionsService.get('enableCellTextSelection'));
    this.addManagedPropertyListener('enableCellTextSelection', props => this.setCellTextSelection(props.currentValue));
    this.createManagedBean(new LayoutFeature(this.comp));
    this.bodyScrollFeature = this.createManagedBean(new GridBodyScrollFeature(this.eBodyViewport));
    this.addRowDragListener();
    this.setupRowAnimationCssClass();
    this.addEventListeners();
    this.addFocusListeners([eTop, eBodyViewport, eBottom, eStickyTop]);
    this.onGridColumnsChanged();
    this.addBodyViewportListener();
    this.setFloatingHeights();
    this.disableBrowserDragging();
    this.addStopEditingWhenGridLosesFocus();
    this.filterManager.setupAdvancedFilterHeaderComp(eTop);
    this.ctrlsService.registerGridBodyCtrl(this);
  }
  getComp() {
    return this.comp;
  }
  addEventListeners() {
    this.addManagedListener(this.eventService, Events.EVENT_GRID_COLUMNS_CHANGED, this.onGridColumnsChanged.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_SCROLL_VISIBILITY_CHANGED, this.onScrollVisibilityChanged.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_PINNED_ROW_DATA_CHANGED, this.onPinnedRowDataChanged.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_HEADER_HEIGHT_CHANGED, this.onHeaderHeightChanged.bind(this));
  }
  addFocusListeners(elements) {
    elements.forEach(element => {
      this.addManagedListener(element, 'focusin', e => {
        const {
          target
        } = e;
        const isFocusedElementNested = isElementChildOfClass(target, 'zing-root', element);
        element.classList.toggle('zing-has-focus', !isFocusedElementNested);
      });
      this.addManagedListener(element, 'focusout', e => {
        const {
          target,
          relatedTarget
        } = e;
        const gridContainRelatedTarget = element.contains(relatedTarget);
        const isNestedRelatedTarget = isElementChildOfClass(relatedTarget, 'zing-root', element);
        const isNestedTarget = isElementChildOfClass(target, 'zing-root', element);
        if (isNestedTarget) {
          return;
        }
        if (!gridContainRelatedTarget || isNestedRelatedTarget) {
          element.classList.remove('zing-has-focus');
        }
      });
    });
  }
  setColumnMovingCss(moving) {
    this.comp.setColumnMovingCss(CSS_CLASS_COLUMN_MOVING, moving);
  }
  setCellTextSelection(selectable = false) {
    this.comp.setCellSelectableCss(CSS_CLASS_CELL_SELECTABLE, selectable);
  }
  onScrollVisibilityChanged() {
    const visible = this.scrollVisibleService.isVerticalScrollShowing();
    this.setVerticalScrollPaddingVisible(visible);
    this.setStickyTopWidth(visible);
    const scrollbarWidth = visible ? this.gridOptionsService.getScrollbarWidth() || 0 : 0;
    const pad = isInvisibleScrollbar() ? 16 : 0;
    const width = `calc(100% + ${scrollbarWidth + pad}px)`;
    this.animationFrameService.requestAnimationFrame(() => this.comp.setBodyViewportWidth(width));
  }
  onGridColumnsChanged() {
    const columns = this.columnModel.getAllGridColumns();
    this.comp.setColumnCount(columns.length);
  }
  disableBrowserDragging() {
    this.addManagedListener(this.eGridBody, 'dragstart', event => {
      if (event.target instanceof HTMLImageElement) {
        event.preventDefault();
        return false;
      }
    });
  }
  addStopEditingWhenGridLosesFocus() {
    if (!this.gridOptionsService.get('stopEditingWhenCellsLoseFocus')) {
      return;
    }
    const focusOutListener = event => {
      const elementWithFocus = event.relatedTarget;
      if (getTabIndex(elementWithFocus) === null) {
        this.rowRenderer.stopEditing();
        return;
      }
      let clickInsideGrid = viewports.some(viewport => viewport.contains(elementWithFocus)) && this.mouseEventService.isElementInThisGrid(elementWithFocus);
      if (!clickInsideGrid) {
        const popupService = this.popupService;
        clickInsideGrid = popupService.getActivePopups().some(popup => popup.contains(elementWithFocus)) || popupService.isElementWithinCustomPopup(elementWithFocus);
      }
      if (!clickInsideGrid) {
        this.rowRenderer.stopEditing();
      }
    };
    const viewports = [this.eBodyViewport, this.eBottom, this.eTop, this.eStickyTop];
    viewports.forEach(viewport => this.addManagedListener(viewport, 'focusout', focusOutListener));
  }
  updateRowCount() {
    const headerCount = this.headerNavigationService.getHeaderRowCount() + this.filterManager.getHeaderRowCount();
    const rowCount = this.rowModel.isLastRowIndexKnown() ? this.rowModel.getRowCount() : -1;
    const total = rowCount === -1 ? -1 : headerCount + rowCount;
    this.comp.setRowCount(total);
  }
  registerBodyViewportResizeListener(listener) {
    this.comp.registerBodyViewportResizeListener(listener);
  }
  setVerticalScrollPaddingVisible(visible) {
    const overflowY = visible ? 'scroll' : 'hidden';
    this.comp.setPinnedTopBottomOverflowY(overflowY);
  }
  isVerticalScrollShowing() {
    const show = this.gridOptionsService.get('alwaysShowVerticalScroll');
    const cssClass = show ? CSS_CLASS_FORCE_VERTICAL_SCROLL : null;
    const allowVerticalScroll = this.gridOptionsService.isDomLayout('normal');
    this.comp.setAlwaysVerticalScrollClass(cssClass, show);
    return show || allowVerticalScroll && isVerticalScrollShowing(this.eBodyViewport);
  }
  setupRowAnimationCssClass() {
    const listener = () => {
      const animateRows = this.gridOptionsService.isAnimateRows() && !this.rowContainerHeightService.isStretching();
      const animateRowsCssClass = animateRows ? RowAnimationCssClasses.ANIMATION_ON : RowAnimationCssClasses.ANIMATION_OFF;
      this.comp.setRowAnimationCssOnBodyViewport(animateRowsCssClass, animateRows);
    };
    listener();
    this.addManagedListener(this.eventService, Events.EVENT_HEIGHT_SCALE_CHANGED, listener);
    this.addManagedPropertyListener('animateRows', listener);
  }
  getGridBodyElement() {
    return this.eGridBody;
  }
  addBodyViewportListener() {
    const listener = this.onBodyViewportContextMenu.bind(this);
    this.addManagedListener(this.eBodyViewport, 'contextmenu', listener);
    this.mockContextMenuForIPad(listener);
    this.addManagedListener(this.eBodyViewport, 'wheel', this.onBodyViewportWheel.bind(this));
    this.addManagedListener(this.eStickyTop, 'wheel', this.onStickyTopWheel.bind(this));
    this.addFullWidthContainerWheelListener();
  }
  addFullWidthContainerWheelListener() {
    const fullWidthContainer = this.eBodyViewport.querySelector('.zing-full-width-container');
    const eCenterColsViewport = this.eBodyViewport.querySelector('.zing-center-cols-viewport');
    if (fullWidthContainer && eCenterColsViewport) {
      this.addManagedListener(fullWidthContainer, 'wheel', e => this.onFullWidthContainerWheel(e, eCenterColsViewport));
    }
  }
  onFullWidthContainerWheel(e, eCenterColsViewport) {
    if (!e.deltaX || Math.abs(e.deltaY) > Math.abs(e.deltaX) || !this.mouseEventService.isEventFromThisGrid(e)) {
      return;
    }
    e.preventDefault();
    eCenterColsViewport.scrollBy({
      left: e.deltaX
    });
  }
  onBodyViewportContextMenu(mouseEvent, touch, touchEvent) {
    if (!mouseEvent && !touchEvent) {
      return;
    }
    if (this.gridOptionsService.get('preventDefaultOnContextMenu')) {
      const event = mouseEvent || touchEvent;
      event.preventDefault();
    }
    const {
      target
    } = mouseEvent || touch;
    if (target === this.eBodyViewport || target === this.ctrlsService.getCenterRowContainerCtrl().getViewportElement()) {
      if (!this.contextMenuFactory) {
        return;
      }
      if (mouseEvent) {
        this.contextMenuFactory.onContextMenu(mouseEvent, null, null, null, null, this.eGridBody);
      } else if (touchEvent) {
        this.contextMenuFactory.onContextMenu(null, touchEvent, null, null, null, this.eGridBody);
      }
    }
  }
  mockContextMenuForIPad(listener) {
    if (!isIOSUserAgent()) {
      return;
    }
    const touchListener = new TouchListener(this.eBodyViewport);
    const longTapListener = event => {
      listener(undefined, event.touchStart, event.touchEvent);
    };
    this.addManagedListener(touchListener, TouchListener.EVENT_LONG_TAP, longTapListener);
    this.addDestroyFunc(() => touchListener.destroy());
  }
  onBodyViewportWheel(e) {
    if (!this.gridOptionsService.get('suppressScrollWhenPopupsAreOpen')) {
      return;
    }
    if (this.popupService.hasAnchoredPopup()) {
      e.preventDefault();
    }
  }
  onStickyTopWheel(e) {
    e.preventDefault();
    if (e.offsetY) {
      this.scrollVertically(e.deltaY);
    }
  }
  getGui() {
    return this.eGridBody;
  }
  scrollVertically(pixels) {
    const oldScrollPosition = this.eBodyViewport.scrollTop;
    this.bodyScrollFeature.setVerticalScrollPosition(oldScrollPosition + pixels);
    return this.eBodyViewport.scrollTop - oldScrollPosition;
  }
  addRowDragListener() {
    this.rowDragFeature = this.createManagedBean(new RowDragFeature(this.eBodyViewport));
    this.dragAndDropService.addDropTarget(this.rowDragFeature);
  }
  getRowDragFeature() {
    return this.rowDragFeature;
  }
  onPinnedRowDataChanged() {
    this.setFloatingHeights();
  }
  setFloatingHeights() {
    const {
      pinnedRowModel
    } = this;
    let floatingTopHeight = pinnedRowModel.getPinnedTopTotalHeight();
    if (floatingTopHeight) {
      floatingTopHeight += 1;
    }
    let floatingBottomHeight = pinnedRowModel.getPinnedBottomTotalHeight();
    if (floatingBottomHeight) {
      floatingBottomHeight += 1;
    }
    this.comp.setTopHeight(floatingTopHeight);
    this.comp.setBottomHeight(floatingBottomHeight);
    this.comp.setTopDisplay(floatingTopHeight ? 'inherit' : 'none');
    this.comp.setBottomDisplay(floatingBottomHeight ? 'inherit' : 'none');
    this.setStickyTopOffsetTop();
  }
  setStickyTopHeight(height = 0) {
    this.comp.setStickyTopHeight(`${height}px`);
    this.stickyTopHeight = height;
  }
  getStickyTopHeight() {
    return this.stickyTopHeight;
  }
  setStickyTopWidth(vScrollVisible) {
    if (!vScrollVisible) {
      this.comp.setStickyTopWidth('100%');
    } else {
      const scrollbarWidth = this.gridOptionsService.getScrollbarWidth();
      this.comp.setStickyTopWidth(`calc(100% - ${scrollbarWidth}px)`);
    }
  }
  onHeaderHeightChanged() {
    this.setStickyTopOffsetTop();
  }
  setStickyTopOffsetTop() {
    const headerCtrl = this.ctrlsService.getGridHeaderCtrl();
    const headerHeight = headerCtrl.getHeaderHeight() + this.filterManager.getHeaderHeight();
    const pinnedTopHeight = this.pinnedRowModel.getPinnedTopTotalHeight();
    let height = 0;
    if (headerHeight > 0) {
      height += headerHeight + 1;
    }
    if (pinnedTopHeight > 0) {
      height += pinnedTopHeight + 1;
    }
    this.comp.setStickyTopTop(`${height}px`);
  }
  sizeColumnsToFit(params, nextTimeout) {
    const removeScrollWidth = this.isVerticalScrollShowing();
    const scrollWidthToRemove = removeScrollWidth ? this.gridOptionsService.getScrollbarWidth() : 0;
    const bodyViewportWidth = getInnerWidth(this.eGridBody);
    const availableWidth = bodyViewportWidth - scrollWidthToRemove;
    if (availableWidth > 0) {
      this.columnModel.sizeColumnsToFit(availableWidth, "sizeColumnsToFit", false, params);
      return;
    }
    if (nextTimeout === undefined) {
      window.setTimeout(() => {
        this.sizeColumnsToFit(params, 100);
      }, 0);
    } else if (nextTimeout === 100) {
      window.setTimeout(() => {
        this.sizeColumnsToFit(params, 500);
      }, 100);
    } else if (nextTimeout === 500) {
      window.setTimeout(() => {
        this.sizeColumnsToFit(params, -1);
      }, 500);
    } else {
      console.warn('ZING Grid: tried to call sizeColumnsToFit() but the grid is coming back with ' + 'zero width, maybe the grid is not visible yet on the screen?');
    }
  }
  addScrollEventListener(listener) {
    this.eBodyViewport.addEventListener('scroll', listener, {
      passive: true
    });
  }
  removeScrollEventListener(listener) {
    this.eBodyViewport.removeEventListener('scroll', listener);
  }
}
__decorate([Autowired('animationFrameService')], GridBodyCtrl.prototype, "animationFrameService", void 0);
__decorate([Autowired('rowContainerHeightService')], GridBodyCtrl.prototype, "rowContainerHeightService", void 0);
__decorate([Autowired('ctrlsService')], GridBodyCtrl.prototype, "ctrlsService", void 0);
__decorate([Autowired('columnModel')], GridBodyCtrl.prototype, "columnModel", void 0);
__decorate([Autowired('scrollVisibleService')], GridBodyCtrl.prototype, "scrollVisibleService", void 0);
__decorate([Optional('contextMenuFactory')], GridBodyCtrl.prototype, "contextMenuFactory", void 0);
__decorate([Autowired('headerNavigationService')], GridBodyCtrl.prototype, "headerNavigationService", void 0);
__decorate([Autowired('dragAndDropService')], GridBodyCtrl.prototype, "dragAndDropService", void 0);
__decorate([Autowired('pinnedRowModel')], GridBodyCtrl.prototype, "pinnedRowModel", void 0);
__decorate([Autowired('rowRenderer')], GridBodyCtrl.prototype, "rowRenderer", void 0);
__decorate([Autowired('popupService')], GridBodyCtrl.prototype, "popupService", void 0);
__decorate([Autowired('mouseEventService')], GridBodyCtrl.prototype, "mouseEventService", void 0);
__decorate([Autowired('rowModel')], GridBodyCtrl.prototype, "rowModel", void 0);
__decorate([Autowired('filterManager')], GridBodyCtrl.prototype, "filterManager", void 0);