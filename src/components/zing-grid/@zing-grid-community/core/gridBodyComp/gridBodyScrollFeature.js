var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, PostConstruct } from "../context/context";
import { BeanStub } from "../context/beanStub";
import { Events } from "../eventKeys";
import { debounce } from "../utils/function";
import { isIOSUserAgent } from "../utils/browser";
import { getInnerHeight, getScrollLeft, isRtlNegativeScroll, setScrollLeft } from "../utils/dom";
var ScrollDirection;
(function (ScrollDirection) {
  ScrollDirection[ScrollDirection["Vertical"] = 0] = "Vertical";
  ScrollDirection[ScrollDirection["Horizontal"] = 1] = "Horizontal";
})(ScrollDirection || (ScrollDirection = {}));
;
var ScrollSource;
(function (ScrollSource) {
  ScrollSource[ScrollSource["Container"] = 0] = "Container";
  ScrollSource[ScrollSource["FakeContainer"] = 1] = "FakeContainer";
})(ScrollSource || (ScrollSource = {}));
;
export class GridBodyScrollFeature extends BeanStub {
  constructor(eBodyViewport) {
    super();
    this.lastScrollSource = [null, null];
    this.scrollLeft = -1;
    this.nextScrollTop = -1;
    this.scrollTop = -1;
    this.eBodyViewport = eBodyViewport;
    this.resetLastHScrollDebounced = debounce(() => this.lastScrollSource[ScrollDirection.Horizontal] = null, 500);
    this.resetLastVScrollDebounced = debounce(() => this.lastScrollSource[ScrollDirection.Vertical] = null, 500);
  }
  postConstruct() {
    this.enableRtl = this.gridOptionsService.get('enableRtl');
    this.addManagedListener(this.eventService, Events.EVENT_DISPLAYED_COLUMNS_WIDTH_CHANGED, this.onDisplayedColumnsWidthChanged.bind(this));
    this.ctrlsService.whenReady(p => {
      this.centerRowContainerCtrl = p.centerRowContainerCtrl;
      this.onDisplayedColumnsWidthChanged();
      this.addScrollListener();
    });
  }
  addScrollListener() {
    const fakeHScroll = this.ctrlsService.getFakeHScrollComp();
    const fakeVScroll = this.ctrlsService.getFakeVScrollComp();
    this.addManagedListener(this.centerRowContainerCtrl.getViewportElement(), 'scroll', this.onHScroll.bind(this));
    fakeHScroll.onScrollCallback(this.onFakeHScroll.bind(this));
    const isDebounce = this.gridOptionsService.get('debounceVerticalScrollbar');
    const onVScroll = isDebounce ? debounce(this.onVScroll.bind(this), 100) : this.onVScroll.bind(this);
    const onFakeVScroll = isDebounce ? debounce(this.onFakeVScroll.bind(this), 100) : this.onFakeVScroll.bind(this);
    this.addManagedListener(this.eBodyViewport, 'scroll', onVScroll);
    fakeVScroll.onScrollCallback(onFakeVScroll);
  }
  onDisplayedColumnsWidthChanged() {
    if (this.enableRtl) {
      this.horizontallyScrollHeaderCenterAndFloatingCenter();
    }
  }
  horizontallyScrollHeaderCenterAndFloatingCenter(scrollLeft) {
    const notYetInitialised = this.centerRowContainerCtrl == null;
    if (notYetInitialised) {
      return;
    }
    if (scrollLeft === undefined) {
      scrollLeft = this.centerRowContainerCtrl.getCenterViewportScrollLeft();
    }
    const offset = this.enableRtl ? scrollLeft : -scrollLeft;
    const topCenterContainer = this.ctrlsService.getTopCenterRowContainerCtrl();
    const stickyTopCenterContainer = this.ctrlsService.getStickyTopCenterRowContainerCtrl();
    const bottomCenterContainer = this.ctrlsService.getBottomCenterRowContainerCtrl();
    const fakeHScroll = this.ctrlsService.getFakeHScrollComp();
    const centerHeaderContainer = this.ctrlsService.getHeaderRowContainerCtrl();
    centerHeaderContainer.setHorizontalScroll(-offset);
    bottomCenterContainer.setContainerTranslateX(offset);
    topCenterContainer.setContainerTranslateX(offset);
    stickyTopCenterContainer.setContainerTranslateX(offset);
    const centerViewport = this.centerRowContainerCtrl.getViewportElement();
    const isCenterViewportLastHorizontal = this.lastScrollSource[ScrollDirection.Horizontal] === ScrollSource.Container;
    scrollLeft = Math.abs(scrollLeft);
    if (isCenterViewportLastHorizontal) {
      fakeHScroll.setScrollPosition(scrollLeft);
    } else {
      setScrollLeft(centerViewport, scrollLeft, this.enableRtl);
    }
  }
  isControllingScroll(source, direction) {
    if (this.lastScrollSource[direction] == null) {
      this.lastScrollSource[direction] = source;
      return true;
    }
    return this.lastScrollSource[direction] === source;
  }
  onFakeHScroll() {
    if (!this.isControllingScroll(ScrollSource.FakeContainer, ScrollDirection.Horizontal)) {
      return;
    }
    this.onHScrollCommon(ScrollSource.FakeContainer);
  }
  onHScroll() {
    if (!this.isControllingScroll(ScrollSource.Container, ScrollDirection.Horizontal)) {
      return;
    }
    this.onHScrollCommon(ScrollSource.Container);
  }
  onHScrollCommon(source) {
    const centerContainerViewport = this.centerRowContainerCtrl.getViewportElement();
    const {
      scrollLeft
    } = centerContainerViewport;
    if (this.shouldBlockScrollUpdate(ScrollDirection.Horizontal, scrollLeft, true)) {
      return;
    }
    let newScrollLeft;
    if (source === ScrollSource.Container) {
      newScrollLeft = getScrollLeft(centerContainerViewport, this.enableRtl);
    } else {
      newScrollLeft = this.ctrlsService.getFakeHScrollComp().getScrollPosition();
    }
    this.doHorizontalScroll(Math.round(newScrollLeft));
    this.resetLastHScrollDebounced();
  }
  onFakeVScroll() {
    if (!this.isControllingScroll(ScrollSource.FakeContainer, ScrollDirection.Vertical)) {
      return;
    }
    this.onVScrollCommon(ScrollSource.FakeContainer);
  }
  onVScroll() {
    if (!this.isControllingScroll(ScrollSource.Container, ScrollDirection.Vertical)) {
      return;
    }
    this.onVScrollCommon(ScrollSource.Container);
  }
  onVScrollCommon(source) {
    let scrollTop;
    if (source === ScrollSource.Container) {
      scrollTop = this.eBodyViewport.scrollTop;
    } else {
      scrollTop = this.ctrlsService.getFakeVScrollComp().getScrollPosition();
    }
    if (this.shouldBlockScrollUpdate(ScrollDirection.Vertical, scrollTop, true)) {
      return;
    }
    this.animationFrameService.setScrollTop(scrollTop);
    this.nextScrollTop = scrollTop;
    if (source === ScrollSource.Container) {
      this.ctrlsService.getFakeVScrollComp().setScrollPosition(scrollTop);
    } else {
      this.eBodyViewport.scrollTop = scrollTop;
    }
    if (this.gridOptionsService.get('suppressAnimationFrame')) {
      this.scrollGridIfNeeded();
    } else {
      this.animationFrameService.schedule();
    }
    this.resetLastVScrollDebounced();
  }
  doHorizontalScroll(scrollLeft) {
    const fakeScrollLeft = this.ctrlsService.getFakeHScrollComp().getScrollPosition();
    if (this.scrollLeft === scrollLeft && scrollLeft === fakeScrollLeft) {
      return;
    }
    this.scrollLeft = scrollLeft;
    this.fireScrollEvent(ScrollDirection.Horizontal);
    this.horizontallyScrollHeaderCenterAndFloatingCenter(scrollLeft);
    this.centerRowContainerCtrl.onHorizontalViewportChanged(true);
  }
  fireScrollEvent(direction) {
    const bodyScrollEvent = {
      type: Events.EVENT_BODY_SCROLL,
      direction: direction === ScrollDirection.Horizontal ? 'horizontal' : 'vertical',
      left: this.scrollLeft,
      top: this.scrollTop
    };
    this.eventService.dispatchEvent(bodyScrollEvent);
    window.clearTimeout(this.scrollTimer);
    this.scrollTimer = undefined;
    this.scrollTimer = window.setTimeout(() => {
      const bodyScrollEndEvent = Object.assign(Object.assign({}, bodyScrollEvent), {
        type: Events.EVENT_BODY_SCROLL_END
      });
      this.eventService.dispatchEvent(bodyScrollEndEvent);
    }, 100);
  }
  shouldBlockScrollUpdate(direction, scrollTo, touchOnly = false) {
    if (touchOnly && !isIOSUserAgent()) {
      return false;
    }
    if (direction === ScrollDirection.Vertical) {
      return this.shouldBlockVerticalScroll(scrollTo);
    }
    return this.shouldBlockHorizontalScroll(scrollTo);
  }
  shouldBlockVerticalScroll(scrollTo) {
    const clientHeight = getInnerHeight(this.eBodyViewport);
    const {
      scrollHeight
    } = this.eBodyViewport;
    if (scrollTo < 0 || scrollTo + clientHeight > scrollHeight) {
      return true;
    }
    return false;
  }
  shouldBlockHorizontalScroll(scrollTo) {
    const clientWidth = this.centerRowContainerCtrl.getCenterWidth();
    const {
      scrollWidth
    } = this.centerRowContainerCtrl.getViewportElement();
    if (this.enableRtl && isRtlNegativeScroll()) {
      if (scrollTo > 0) {
        return true;
      }
    } else if (scrollTo < 0) {
      return true;
    }
    if (Math.abs(scrollTo) + clientWidth > scrollWidth) {
      return true;
    }
    return false;
  }
  redrawRowsAfterScroll() {
    this.fireScrollEvent(ScrollDirection.Vertical);
  }
  checkScrollLeft() {
    if (this.scrollLeft !== this.centerRowContainerCtrl.getCenterViewportScrollLeft()) {
      this.onHScrollCommon(ScrollSource.Container);
    }
  }
  scrollGridIfNeeded() {
    const frameNeeded = this.scrollTop != this.nextScrollTop;
    if (frameNeeded) {
      this.scrollTop = this.nextScrollTop;
      this.redrawRowsAfterScroll();
    }
    return frameNeeded;
  }
  setHorizontalScrollPosition(hScrollPosition, fromAlignedGridsService = false) {
    const minScrollLeft = 0;
    const maxScrollLeft = this.centerRowContainerCtrl.getViewportElement().scrollWidth - this.centerRowContainerCtrl.getCenterWidth();
    if (!fromAlignedGridsService && this.shouldBlockScrollUpdate(ScrollDirection.Horizontal, hScrollPosition)) {
      if (this.enableRtl && isRtlNegativeScroll()) {
        hScrollPosition = hScrollPosition > 0 ? 0 : maxScrollLeft;
      } else {
        hScrollPosition = Math.min(Math.max(hScrollPosition, minScrollLeft), maxScrollLeft);
      }
    }
    setScrollLeft(this.centerRowContainerCtrl.getViewportElement(), Math.abs(hScrollPosition), this.enableRtl);
    this.doHorizontalScroll(hScrollPosition);
  }
  setVerticalScrollPosition(vScrollPosition) {
    this.eBodyViewport.scrollTop = vScrollPosition;
  }
  getVScrollPosition() {
    const result = {
      top: this.eBodyViewport.scrollTop,
      bottom: this.eBodyViewport.scrollTop + this.eBodyViewport.offsetHeight
    };
    return result;
  }
  getHScrollPosition() {
    return this.centerRowContainerCtrl.getHScrollPosition();
  }
  isHorizontalScrollShowing() {
    return this.centerRowContainerCtrl.isHorizontalScrollShowing();
  }
  scrollHorizontally(pixels) {
    const oldScrollPosition = this.centerRowContainerCtrl.getViewportElement().scrollLeft;
    this.setHorizontalScrollPosition(oldScrollPosition + pixels);
    return this.centerRowContainerCtrl.getViewportElement().scrollLeft - oldScrollPosition;
  }
  scrollToTop() {
    this.eBodyViewport.scrollTop = 0;
  }
  ensureNodeVisible(comparator, position = null) {
    const rowCount = this.rowModel.getRowCount();
    let indexToSelect = -1;
    for (let i = 0; i < rowCount; i++) {
      const node = this.rowModel.getRow(i);
      if (typeof comparator === 'function') {
        const predicate = comparator;
        if (node && predicate(node)) {
          indexToSelect = i;
          break;
        }
      } else {
        if (comparator === node || comparator === node.data) {
          indexToSelect = i;
          break;
        }
      }
    }
    if (indexToSelect >= 0) {
      this.ensureIndexVisible(indexToSelect, position);
    }
  }
  ensureIndexVisible(index, position) {
    if (this.gridOptionsService.isDomLayout('print')) {
      return;
    }
    const rowCount = this.paginationProxy.getRowCount();
    if (typeof index !== 'number' || index < 0 || index >= rowCount) {
      console.warn('ZING Grid: Invalid row index for ensureIndexVisible: ' + index);
      return;
    }
    const isPaging = this.gridOptionsService.get('pagination');
    const paginationPanelEnabled = isPaging && !this.gridOptionsService.get('suppressPaginationPanel');
    if (!paginationPanelEnabled) {
      this.paginationProxy.goToPageWithIndex(index);
    }
    const gridBodyCtrl = this.ctrlsService.getGridBodyCtrl();
    const stickyTopHeight = gridBodyCtrl.getStickyTopHeight();
    const rowNode = this.paginationProxy.getRow(index);
    let rowGotShiftedDuringOperation;
    do {
      const startingRowTop = rowNode.rowTop;
      const startingRowHeight = rowNode.rowHeight;
      const paginationOffset = this.paginationProxy.getPixelOffset();
      const rowTopPixel = rowNode.rowTop - paginationOffset;
      const rowBottomPixel = rowTopPixel + rowNode.rowHeight;
      const scrollPosition = this.getVScrollPosition();
      const heightOffset = this.heightScaler.getDivStretchOffset();
      const vScrollTop = scrollPosition.top + heightOffset;
      const vScrollBottom = scrollPosition.bottom + heightOffset;
      const viewportHeight = vScrollBottom - vScrollTop;
      const pxTop = this.heightScaler.getScrollPositionForPixel(rowTopPixel);
      const pxBottom = this.heightScaler.getScrollPositionForPixel(rowBottomPixel - viewportHeight);
      const pxMiddle = Math.min((pxTop + pxBottom) / 2, rowTopPixel);
      const rowAboveViewport = vScrollTop + stickyTopHeight > rowTopPixel;
      const rowBelowViewport = vScrollBottom < rowBottomPixel;
      let newScrollPosition = null;
      if (position === 'top') {
        newScrollPosition = pxTop;
      } else if (position === 'bottom') {
        newScrollPosition = pxBottom;
      } else if (position === 'middle') {
        newScrollPosition = pxMiddle;
      } else if (rowAboveViewport) {
        newScrollPosition = pxTop - stickyTopHeight;
      } else if (rowBelowViewport) {
        newScrollPosition = pxBottom;
      }
      if (newScrollPosition !== null) {
        this.setVerticalScrollPosition(newScrollPosition);
        this.rowRenderer.redraw({
          afterScroll: true
        });
      }
      rowGotShiftedDuringOperation = startingRowTop !== rowNode.rowTop || startingRowHeight !== rowNode.rowHeight;
    } while (rowGotShiftedDuringOperation);
    this.animationFrameService.flushAllFrames();
  }
  ensureColumnVisible(key, position = 'auto') {
    const column = this.columnModel.getGridColumn(key);
    if (!column) {
      return;
    }
    if (column.isPinned()) {
      return;
    }
    if (!this.columnModel.isColumnDisplayed(column)) {
      return;
    }
    const newHorizontalScroll = this.getPositionedHorizontalScroll(column, position);
    if (newHorizontalScroll !== null) {
      this.centerRowContainerCtrl.setCenterViewportScrollLeft(newHorizontalScroll);
    }
    this.centerRowContainerCtrl.onHorizontalViewportChanged();
    this.animationFrameService.flushAllFrames();
  }
  setScrollPosition(top, left) {
    this.centerRowContainerCtrl.setCenterViewportScrollLeft(left);
    this.setVerticalScrollPosition(top);
    this.rowRenderer.redraw({
      afterScroll: true
    });
    this.animationFrameService.flushAllFrames();
  }
  getPositionedHorizontalScroll(column, position) {
    const {
      columnBeforeStart,
      columnAfterEnd
    } = this.isColumnOutsideViewport(column);
    const viewportTooSmallForColumn = this.centerRowContainerCtrl.getCenterWidth() < column.getActualWidth();
    const viewportWidth = this.centerRowContainerCtrl.getCenterWidth();
    const isRtl = this.enableRtl;
    let alignColToStart = (isRtl ? columnBeforeStart : columnAfterEnd) || viewportTooSmallForColumn;
    let alignColToEnd = isRtl ? columnAfterEnd : columnBeforeStart;
    if (position !== 'auto') {
      alignColToStart = position === 'start';
      alignColToEnd = position === 'end';
    }
    const isMiddle = position === 'middle';
    if (alignColToStart || alignColToEnd || isMiddle) {
      const {
        colLeft,
        colMiddle,
        colRight
      } = this.getColumnBounds(column);
      if (isMiddle) {
        return colMiddle - viewportWidth / 2;
      }
      if (alignColToStart) {
        return isRtl ? colRight : colLeft;
      }
      return isRtl ? colLeft - viewportWidth : colRight - viewportWidth;
    }
    return null;
  }
  isColumnOutsideViewport(column) {
    const {
      start: viewportStart,
      end: viewportEnd
    } = this.getViewportBounds();
    const {
      colLeft,
      colRight
    } = this.getColumnBounds(column);
    const isRtl = this.enableRtl;
    const columnBeforeStart = isRtl ? viewportStart > colRight : viewportEnd < colRight;
    const columnAfterEnd = isRtl ? viewportEnd < colLeft : viewportStart > colLeft;
    return {
      columnBeforeStart,
      columnAfterEnd
    };
  }
  getColumnBounds(column) {
    const isRtl = this.enableRtl;
    const bodyWidth = this.columnModel.getBodyContainerWidth();
    const colWidth = column.getActualWidth();
    const colLeft = column.getLeft();
    const multiplier = isRtl ? -1 : 1;
    const colLeftPixel = isRtl ? bodyWidth - colLeft : colLeft;
    const colRightPixel = colLeftPixel + colWidth * multiplier;
    const colMidPixel = colLeftPixel + colWidth / 2 * multiplier;
    return {
      colLeft: colLeftPixel,
      colMiddle: colMidPixel,
      colRight: colRightPixel
    };
  }
  getViewportBounds() {
    const viewportWidth = this.centerRowContainerCtrl.getCenterWidth();
    const scrollPosition = this.centerRowContainerCtrl.getCenterViewportScrollLeft();
    const viewportStartPixel = scrollPosition;
    const viewportEndPixel = viewportWidth + scrollPosition;
    return {
      start: viewportStartPixel,
      end: viewportEndPixel,
      width: viewportWidth
    };
  }
}
__decorate([Autowired('ctrlsService')], GridBodyScrollFeature.prototype, "ctrlsService", void 0);
__decorate([Autowired('animationFrameService')], GridBodyScrollFeature.prototype, "animationFrameService", void 0);
__decorate([Autowired('paginationProxy')], GridBodyScrollFeature.prototype, "paginationProxy", void 0);
__decorate([Autowired('rowModel')], GridBodyScrollFeature.prototype, "rowModel", void 0);
__decorate([Autowired('rowContainerHeightService')], GridBodyScrollFeature.prototype, "heightScaler", void 0);
__decorate([Autowired('rowRenderer')], GridBodyScrollFeature.prototype, "rowRenderer", void 0);
__decorate([Autowired('columnModel')], GridBodyScrollFeature.prototype, "columnModel", void 0);
__decorate([PostConstruct], GridBodyScrollFeature.prototype, "postConstruct", null);