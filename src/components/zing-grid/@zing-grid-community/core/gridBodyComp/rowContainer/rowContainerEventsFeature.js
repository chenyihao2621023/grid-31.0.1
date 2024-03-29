var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BeanStub } from "../../context/beanStub";
import { getCtrlForEventTarget, isStopPropagationForZingGrid, isEventSupported } from "../../utils/event";
import { Autowired, Optional, PostConstruct } from "../../context/context";
import { RowCtrl } from "../../rendering/row/rowCtrl";
import { isIOSUserAgent } from "../../utils/browser";
import { TouchListener } from "../../widgets/touchListener";
import { isEventFromPrintableCharacter, isUserSuppressingKeyboardEvent } from "../../utils/keyboard";
import { Events } from "../../events";
import { KeyCode } from "../../constants/keyCode";
import { missingOrEmpty } from "../../utils/generic";
import { last } from "../../utils/array";
import { normaliseQwertyAzerty } from "../../utils/keyboard";
import { CellCtrl } from "../../rendering/cell/cellCtrl";
export class RowContainerEventsFeature extends BeanStub {
  constructor(element) {
    super();
    this.element = element;
  }
  postConstruct() {
    this.addKeyboardListeners();
    this.addMouseListeners();
    this.mockContextMenuForIPad();
  }
  addKeyboardListeners() {
    const eventName = 'keydown';
    const listener = this.processKeyboardEvent.bind(this, eventName);
    this.addManagedListener(this.element, eventName, listener);
  }
  addMouseListeners() {
    const mouseDownEvent = isEventSupported('touchstart') ? 'touchstart' : 'mousedown';
    const eventNames = ['dblclick', 'contextmenu', 'mouseover', 'mouseout', 'click', mouseDownEvent];
    eventNames.forEach(eventName => {
      const listener = this.processMouseEvent.bind(this, eventName);
      this.addManagedListener(this.element, eventName, listener);
    });
  }
  processMouseEvent(eventName, mouseEvent) {
    if (!this.mouseEventService.isEventFromThisGrid(mouseEvent) || isStopPropagationForZingGrid(mouseEvent)) {
      return;
    }
    const rowComp = this.getRowForEvent(mouseEvent);
    const cellCtrl = this.mouseEventService.getRenderedCellForEvent(mouseEvent);
    if (eventName === "contextmenu") {
      this.handleContextMenuMouseEvent(mouseEvent, null, rowComp, cellCtrl);
    } else {
      if (cellCtrl) {
        cellCtrl.onMouseEvent(eventName, mouseEvent);
      }
      if (rowComp) {
        rowComp.onMouseEvent(eventName, mouseEvent);
      }
    }
  }
  mockContextMenuForIPad() {
    if (!isIOSUserAgent()) {
      return;
    }
    const touchListener = new TouchListener(this.element);
    const longTapListener = event => {
      const rowComp = this.getRowForEvent(event.touchEvent);
      const cellComp = this.mouseEventService.getRenderedCellForEvent(event.touchEvent);
      this.handleContextMenuMouseEvent(null, event.touchEvent, rowComp, cellComp);
    };
    this.addManagedListener(touchListener, TouchListener.EVENT_LONG_TAP, longTapListener);
    this.addDestroyFunc(() => touchListener.destroy());
  }
  getRowForEvent(event) {
    let sourceElement = event.target;
    while (sourceElement) {
      const rowCon = this.gridOptionsService.getDomData(sourceElement, RowCtrl.DOM_DATA_KEY_ROW_CTRL);
      if (rowCon) {
        return rowCon;
      }
      sourceElement = sourceElement.parentElement;
    }
    return null;
  }
  handleContextMenuMouseEvent(mouseEvent, touchEvent, rowComp, cellCtrl) {
    const rowNode = rowComp ? rowComp.getRowNode() : null;
    const column = cellCtrl ? cellCtrl.getColumn() : null;
    let value = null;
    if (column) {
      const event = mouseEvent ? mouseEvent : touchEvent;
      cellCtrl.dispatchCellContextMenuEvent(event);
      value = this.valueService.getValue(column, rowNode);
    }
    const gridBodyCon = this.ctrlsService.getGridBodyCtrl();
    const anchorToElement = cellCtrl ? cellCtrl.getGui() : gridBodyCon.getGridBodyElement();
    if (this.contextMenuFactory) {
      this.contextMenuFactory.onContextMenu(mouseEvent, touchEvent, rowNode, column, value, anchorToElement);
    }
  }
  getControlsForEventTarget(target) {
    return {
      cellCtrl: getCtrlForEventTarget(this.gridOptionsService, target, CellCtrl.DOM_DATA_KEY_CELL_CTRL),
      rowCtrl: getCtrlForEventTarget(this.gridOptionsService, target, RowCtrl.DOM_DATA_KEY_ROW_CTRL)
    };
  }
  processKeyboardEvent(eventName, keyboardEvent) {
    const {
      cellCtrl,
      rowCtrl
    } = this.getControlsForEventTarget(keyboardEvent.target);
    if (keyboardEvent.defaultPrevented) {
      return;
    }
    if (cellCtrl) {
      this.processCellKeyboardEvent(cellCtrl, eventName, keyboardEvent);
    } else if (rowCtrl && rowCtrl.isFullWidth()) {
      this.processFullWidthRowKeyboardEvent(rowCtrl, eventName, keyboardEvent);
    }
  }
  processCellKeyboardEvent(cellCtrl, eventName, keyboardEvent) {
    const rowNode = cellCtrl.getRowNode();
    const column = cellCtrl.getColumn();
    const editing = cellCtrl.isEditing();
    const gridProcessingAllowed = !isUserSuppressingKeyboardEvent(this.gridOptionsService, keyboardEvent, rowNode, column, editing);
    if (gridProcessingAllowed) {
      if (eventName === 'keydown') {
        const wasScrollKey = !editing && this.navigationService.handlePageScrollingKey(keyboardEvent);
        if (!wasScrollKey) {
          cellCtrl.onKeyDown(keyboardEvent);
        }
        this.doGridOperations(keyboardEvent, cellCtrl.isEditing());
        if (isEventFromPrintableCharacter(keyboardEvent)) {
          cellCtrl.processCharacter(keyboardEvent);
        }
      }
    }
    if (eventName === 'keydown') {
      const cellKeyDownEvent = cellCtrl.createEvent(keyboardEvent, Events.EVENT_CELL_KEY_DOWN);
      this.eventService.dispatchEvent(cellKeyDownEvent);
    }
  }
  processFullWidthRowKeyboardEvent(rowComp, eventName, keyboardEvent) {
    const rowNode = rowComp.getRowNode();
    const focusedCell = this.focusService.getFocusedCell();
    const column = focusedCell && focusedCell.column;
    const gridProcessingAllowed = !isUserSuppressingKeyboardEvent(this.gridOptionsService, keyboardEvent, rowNode, column, false);
    if (gridProcessingAllowed) {
      const key = keyboardEvent.key;
      if (eventName === 'keydown') {
        switch (key) {
          case KeyCode.PAGE_HOME:
          case KeyCode.PAGE_END:
          case KeyCode.PAGE_UP:
          case KeyCode.PAGE_DOWN:
            this.navigationService.handlePageScrollingKey(keyboardEvent, true);
            break;
          case KeyCode.UP:
          case KeyCode.DOWN:
            rowComp.onKeyboardNavigate(keyboardEvent);
            break;
          case KeyCode.TAB:
            rowComp.onTabKeyDown(keyboardEvent);
            break;
          default:
        }
      }
    }
    if (eventName === 'keydown') {
      const cellKeyDownEvent = rowComp.createRowEvent(Events.EVENT_CELL_KEY_DOWN, keyboardEvent);
      this.eventService.dispatchEvent(cellKeyDownEvent);
    }
  }
  doGridOperations(keyboardEvent, editing) {
    if (!keyboardEvent.ctrlKey && !keyboardEvent.metaKey) {
      return;
    }
    if (editing) {
      return;
    }
    if (!this.mouseEventService.isEventFromThisGrid(keyboardEvent)) {
      return;
    }
    const keyCode = normaliseQwertyAzerty(keyboardEvent);
    if (keyCode === KeyCode.A) {
      return this.onCtrlAndA(keyboardEvent);
    }
    if (keyCode === KeyCode.C) {
      return this.onCtrlAndC(keyboardEvent);
    }
    if (keyCode === KeyCode.D) {
      return this.onCtrlAndD(keyboardEvent);
    }
    if (keyCode === KeyCode.V) {
      return this.onCtrlAndV(keyboardEvent);
    }
    if (keyCode === KeyCode.X) {
      return this.onCtrlAndX(keyboardEvent);
    }
    if (keyCode === KeyCode.Y) {
      return this.onCtrlAndY();
    }
    if (keyCode === KeyCode.Z) {
      return this.onCtrlAndZ(keyboardEvent);
    }
  }
  onCtrlAndA(event) {
    const {
      pinnedRowModel,
      paginationProxy,
      rangeService
    } = this;
    if (rangeService && paginationProxy.isRowsToRender()) {
      const [isEmptyPinnedTop, isEmptyPinnedBottom] = [pinnedRowModel.isEmpty('top'), pinnedRowModel.isEmpty('bottom')];
      const floatingStart = isEmptyPinnedTop ? null : 'top';
      let floatingEnd;
      let rowEnd;
      if (isEmptyPinnedBottom) {
        floatingEnd = null;
        rowEnd = this.paginationProxy.getRowCount() - 1;
      } else {
        floatingEnd = 'bottom';
        rowEnd = pinnedRowModel.getPinnedBottomRowData().length - 1;
      }
      const allDisplayedColumns = this.columnModel.getAllDisplayedColumns();
      if (missingOrEmpty(allDisplayedColumns)) {
        return;
      }
      rangeService.setCellRange({
        rowStartIndex: 0,
        rowStartPinned: floatingStart,
        rowEndIndex: rowEnd,
        rowEndPinned: floatingEnd,
        columnStart: allDisplayedColumns[0],
        columnEnd: last(allDisplayedColumns)
      });
    }
    event.preventDefault();
  }
  onCtrlAndC(event) {
    if (!this.clipboardService || this.gridOptionsService.get('enableCellTextSelection')) {
      return;
    }
    const {
      cellCtrl,
      rowCtrl
    } = this.getControlsForEventTarget(event.target);
    if ((cellCtrl === null || cellCtrl === void 0 ? void 0 : cellCtrl.isEditing()) || (rowCtrl === null || rowCtrl === void 0 ? void 0 : rowCtrl.isEditing())) {
      return;
    }
    event.preventDefault();
    this.clipboardService.copyToClipboard();
  }
  onCtrlAndX(event) {
    if (!this.clipboardService || this.gridOptionsService.get('enableCellTextSelection') || this.gridOptionsService.get('suppressCutToClipboard')) {
      return;
    }
    const {
      cellCtrl,
      rowCtrl
    } = this.getControlsForEventTarget(event.target);
    if ((cellCtrl === null || cellCtrl === void 0 ? void 0 : cellCtrl.isEditing()) || (rowCtrl === null || rowCtrl === void 0 ? void 0 : rowCtrl.isEditing())) {
      return;
    }
    event.preventDefault();
    this.clipboardService.cutToClipboard(undefined, 'ui');
  }
  onCtrlAndV(event) {
    const {
      cellCtrl,
      rowCtrl
    } = this.getControlsForEventTarget(event.target);
    if ((cellCtrl === null || cellCtrl === void 0 ? void 0 : cellCtrl.isEditing()) || (rowCtrl === null || rowCtrl === void 0 ? void 0 : rowCtrl.isEditing())) {
      return;
    }
    if (this.clipboardService && !this.gridOptionsService.get('suppressClipboardPaste')) {
      this.clipboardService.pasteFromClipboard();
    }
  }
  onCtrlAndD(event) {
    if (this.clipboardService && !this.gridOptionsService.get('suppressClipboardPaste')) {
      this.clipboardService.copyRangeDown();
    }
    event.preventDefault();
  }
  onCtrlAndZ(event) {
    if (!this.gridOptionsService.get('undoRedoCellEditing')) {
      return;
    }
    event.preventDefault();
    if (event.shiftKey) {
      this.undoRedoService.redo('ui');
    } else {
      this.undoRedoService.undo('ui');
    }
  }
  onCtrlAndY() {
    this.undoRedoService.redo('ui');
  }
}
__decorate([Autowired('mouseEventService')], RowContainerEventsFeature.prototype, "mouseEventService", void 0);
__decorate([Autowired('valueService')], RowContainerEventsFeature.prototype, "valueService", void 0);
__decorate([Optional('contextMenuFactory')], RowContainerEventsFeature.prototype, "contextMenuFactory", void 0);
__decorate([Autowired('ctrlsService')], RowContainerEventsFeature.prototype, "ctrlsService", void 0);
__decorate([Autowired('navigationService')], RowContainerEventsFeature.prototype, "navigationService", void 0);
__decorate([Autowired('focusService')], RowContainerEventsFeature.prototype, "focusService", void 0);
__decorate([Autowired('undoRedoService')], RowContainerEventsFeature.prototype, "undoRedoService", void 0);
__decorate([Autowired('columnModel')], RowContainerEventsFeature.prototype, "columnModel", void 0);
__decorate([Autowired('paginationProxy')], RowContainerEventsFeature.prototype, "paginationProxy", void 0);
__decorate([Autowired('pinnedRowModel')], RowContainerEventsFeature.prototype, "pinnedRowModel", void 0);
__decorate([Optional('rangeService')], RowContainerEventsFeature.prototype, "rangeService", void 0);
__decorate([Optional('clipboardService')], RowContainerEventsFeature.prototype, "clipboardService", void 0);
__decorate([PostConstruct], RowContainerEventsFeature.prototype, "postConstruct", null);