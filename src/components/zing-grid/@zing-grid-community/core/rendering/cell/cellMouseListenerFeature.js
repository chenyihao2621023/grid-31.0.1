import { Events } from "../../events";
import { isBrowserSafari, isIOSUserAgent } from "../../utils/browser";
import { isElementChildOfClass, isFocusableFormField } from "../../utils/dom";
import { isEventSupported, isStopPropagationForZingGrid } from "../../utils/event";
import { Beans } from "../beans";
export class CellMouseListenerFeature extends Beans {
  constructor(ctrl, beans, column) {
    super();
    this.cellCtrl = ctrl;
    this.beans = beans;
    this.column = column;
  }
  onMouseEvent(eventName, mouseEvent) {
    if (isStopPropagationForZingGrid(mouseEvent)) {
      return;
    }
    switch (eventName) {
      case 'click':
        this.onCellClicked(mouseEvent);
        break;
      case 'mousedown':
      case 'touchstart':
        this.onMouseDown(mouseEvent);
        break;
      case 'dblclick':
        this.onCellDoubleClicked(mouseEvent);
        break;
      case 'mouseout':
        this.onMouseOut(mouseEvent);
        break;
      case 'mouseover':
        this.onMouseOver(mouseEvent);
        break;
    }
  }
  onCellClicked(mouseEvent) {
    if (this.isDoubleClickOnIPad()) {
      this.onCellDoubleClicked(mouseEvent);
      mouseEvent.preventDefault();
      return;
    }
    const {
      eventService,
      rangeService,
      gridOptionsService
    } = this.beans;
    const isMultiKey = mouseEvent.ctrlKey || mouseEvent.metaKey;
    if (rangeService && isMultiKey) {
      if (rangeService.getCellRangeCount(this.cellCtrl.getCellPosition()) > 1) {
        rangeService.intersectLastRange(true);
      }
    }
    const cellClickedEvent = this.cellCtrl.createEvent(mouseEvent, Events.EVENT_CELL_CLICKED);
    eventService.dispatchEvent(cellClickedEvent);
    const colDef = this.column.getColDef();
    if (colDef.onCellClicked) {
      window.setTimeout(() => colDef.onCellClicked(cellClickedEvent), 0);
    }
    const editOnSingleClick = (gridOptionsService.get('singleClickEdit') || colDef.singleClickEdit) && !gridOptionsService.get('suppressClickEdit');
    if (editOnSingleClick && !(mouseEvent.shiftKey && (rangeService === null || rangeService === void 0 ? void 0 : rangeService.getCellRanges().length) != 0)) {
      this.cellCtrl.startRowOrCellEdit();
    }
  }
  isDoubleClickOnIPad() {
    if (!isIOSUserAgent() || isEventSupported('dblclick')) {
      return false;
    }
    const nowMillis = new Date().getTime();
    const res = nowMillis - this.lastIPadMouseClickEvent < 200;
    this.lastIPadMouseClickEvent = nowMillis;
    return res;
  }
  onCellDoubleClicked(mouseEvent) {
    const colDef = this.column.getColDef();
    const cellDoubleClickedEvent = this.cellCtrl.createEvent(mouseEvent, Events.EVENT_CELL_DOUBLE_CLICKED);
    this.beans.eventService.dispatchEvent(cellDoubleClickedEvent);
    if (typeof colDef.onCellDoubleClicked === 'function') {
      window.setTimeout(() => colDef.onCellDoubleClicked(cellDoubleClickedEvent), 0);
    }
    const editOnDoubleClick = !this.beans.gridOptionsService.get('singleClickEdit') && !this.beans.gridOptionsService.get('suppressClickEdit');
    if (editOnDoubleClick) {
      this.cellCtrl.startRowOrCellEdit(null, mouseEvent);
    }
  }
  onMouseDown(mouseEvent) {
    const {
      ctrlKey,
      metaKey,
      shiftKey
    } = mouseEvent;
    const target = mouseEvent.target;
    const {
      cellCtrl,
      beans
    } = this;
    const {
      eventService,
      rangeService,
      focusService
    } = beans;
    if (this.isRightClickInExistingRange(mouseEvent)) {
      return;
    }
    const ranges = rangeService && rangeService.getCellRanges().length != 0;
    if (!shiftKey || !ranges) {
      const forceBrowserFocus = isBrowserSafari() && !cellCtrl.isEditing() && !isFocusableFormField(target);
      cellCtrl.focusCell(forceBrowserFocus);
    }
    if (shiftKey && ranges && !focusService.isCellFocused(cellCtrl.getCellPosition())) {
      mouseEvent.preventDefault();
      const focusedCellPosition = focusService.getFocusedCell();
      if (focusedCellPosition) {
        const {
          column,
          rowIndex,
          rowPinned
        } = focusedCellPosition;
        const focusedRowCtrl = beans.rowRenderer.getRowByPosition({
          rowIndex,
          rowPinned
        });
        const focusedCellCtrl = focusedRowCtrl === null || focusedRowCtrl === void 0 ? void 0 : focusedRowCtrl.getCellCtrl(column);
        if (focusedCellCtrl === null || focusedCellCtrl === void 0 ? void 0 : focusedCellCtrl.isEditing()) {
          focusedCellCtrl.stopEditing();
        }
        focusService.setFocusedCell({
          column,
          rowIndex,
          rowPinned,
          forceBrowserFocus: true,
          preventScrollOnBrowserFocus: true
        });
      }
    }
    if (this.containsWidget(target)) {
      return;
    }
    if (rangeService) {
      const thisCell = this.cellCtrl.getCellPosition();
      if (shiftKey) {
        rangeService.extendLatestRangeToCell(thisCell);
      } else {
        const isMultiKey = ctrlKey || metaKey;
        rangeService.setRangeToCell(thisCell, isMultiKey);
      }
    }
    eventService.dispatchEvent(this.cellCtrl.createEvent(mouseEvent, Events.EVENT_CELL_MOUSE_DOWN));
  }
  isRightClickInExistingRange(mouseEvent) {
    const {
      rangeService
    } = this.beans;
    if (rangeService) {
      const cellInRange = rangeService.isCellInAnyRange(this.cellCtrl.getCellPosition());
      const isRightClick = mouseEvent.button === 2 || mouseEvent.ctrlKey && this.beans.gridOptionsService.get('allowContextMenuWithControlKey');
      if (cellInRange && isRightClick) {
        return true;
      }
    }
    return false;
  }
  containsWidget(target) {
    return isElementChildOfClass(target, 'zing-selection-checkbox', 3);
  }
  onMouseOut(mouseEvent) {
    if (this.mouseStayingInsideCell(mouseEvent)) {
      return;
    }
    const cellMouseOutEvent = this.cellCtrl.createEvent(mouseEvent, Events.EVENT_CELL_MOUSE_OUT);
    this.beans.eventService.dispatchEvent(cellMouseOutEvent);
    this.beans.columnHoverService.clearMouseOver();
  }
  onMouseOver(mouseEvent) {
    if (this.mouseStayingInsideCell(mouseEvent)) {
      return;
    }
    const cellMouseOverEvent = this.cellCtrl.createEvent(mouseEvent, Events.EVENT_CELL_MOUSE_OVER);
    this.beans.eventService.dispatchEvent(cellMouseOverEvent);
    this.beans.columnHoverService.setMouseOver([this.column]);
  }
  mouseStayingInsideCell(e) {
    if (!e.target || !e.relatedTarget) {
      return false;
    }
    const eGui = this.cellCtrl.getGui();
    const cellContainsTarget = eGui.contains(e.target);
    const cellContainsRelatedTarget = eGui.contains(e.relatedTarget);
    return cellContainsTarget && cellContainsRelatedTarget;
  }
  destroy() {}
}