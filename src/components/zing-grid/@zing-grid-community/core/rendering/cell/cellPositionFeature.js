import { areEqual, last } from "../../utils/array";
import { Events } from "../../eventKeys";
import { missing } from "../../utils/generic";
import { BeanStub } from "../../context/beanStub";
export class CellPositionFeature extends BeanStub {
  constructor(ctrl, beans) {
    super();
    this.cellCtrl = ctrl;
    this.beans = beans;
    this.column = ctrl.getColumn();
    this.rowNode = ctrl.getRowNode();
    this.setupColSpan();
    this.setupRowSpan();
  }
  setupRowSpan() {
    this.rowSpan = this.column.getRowSpan(this.rowNode);
    this.addManagedListener(this.beans.eventService, Events.EVENT_NEW_COLUMNS_LOADED, () => this.onNewColumnsLoaded());
  }
  setComp(eGui) {
    this.eGui = eGui;
    this.onLeftChanged();
    this.onWidthChanged();
    this.applyRowSpan();
  }
  onNewColumnsLoaded() {
    const rowSpan = this.column.getRowSpan(this.rowNode);
    if (this.rowSpan === rowSpan) {
      return;
    }
    this.rowSpan = rowSpan;
    this.applyRowSpan(true);
  }
  onDisplayColumnsChanged() {
    const colsSpanning = this.getColSpanningList();
    if (!areEqual(this.colsSpanning, colsSpanning)) {
      this.colsSpanning = colsSpanning;
      this.onWidthChanged();
      this.onLeftChanged();
    }
  }
  setupColSpan() {
    if (this.column.getColDef().colSpan == null) {
      return;
    }
    this.colsSpanning = this.getColSpanningList();
    this.addManagedListener(this.beans.eventService, Events.EVENT_DISPLAYED_COLUMNS_CHANGED, this.onDisplayColumnsChanged.bind(this));
    this.addManagedListener(this.beans.eventService, Events.EVENT_DISPLAYED_COLUMNS_WIDTH_CHANGED, this.onWidthChanged.bind(this));
  }
  onWidthChanged() {
    if (!this.eGui) {
      return;
    }
    const width = this.getCellWidth();
    this.eGui.style.width = `${width}px`;
  }
  getCellWidth() {
    if (!this.colsSpanning) {
      return this.column.getActualWidth();
    }
    return this.colsSpanning.reduce((width, col) => width + col.getActualWidth(), 0);
  }
  getColSpanningList() {
    const colSpan = this.column.getColSpan(this.rowNode);
    const colsSpanning = [];
    if (colSpan === 1) {
      colsSpanning.push(this.column);
    } else {
      let pointer = this.column;
      const pinned = this.column.getPinned();
      for (let i = 0; pointer && i < colSpan; i++) {
        colsSpanning.push(pointer);
        pointer = this.beans.columnModel.getDisplayedColAfter(pointer);
        if (!pointer || missing(pointer)) {
          break;
        }
        if (pinned !== pointer.getPinned()) {
          break;
        }
      }
    }
    return colsSpanning;
  }
  onLeftChanged() {
    if (!this.eGui) {
      return;
    }
    const left = this.modifyLeftForPrintLayout(this.getCellLeft());
    this.eGui.style.left = left + 'px';
  }
  getCellLeft() {
    let mostLeftCol;
    if (this.beans.gridOptionsService.get('enableRtl') && this.colsSpanning) {
      mostLeftCol = last(this.colsSpanning);
    } else {
      mostLeftCol = this.column;
    }
    return mostLeftCol.getLeft();
  }
  modifyLeftForPrintLayout(leftPosition) {
    if (!this.cellCtrl.isPrintLayout() || this.column.getPinned() === 'left') {
      return leftPosition;
    }
    const leftWidth = this.beans.columnModel.getDisplayedColumnsLeftWidth();
    if (this.column.getPinned() === 'right') {
      const bodyWidth = this.beans.columnModel.getBodyContainerWidth();
      return leftWidth + bodyWidth + (leftPosition || 0);
    }
    return leftWidth + (leftPosition || 0);
  }
  applyRowSpan(force) {
    if (this.rowSpan === 1 && !force) {
      return;
    }
    const singleRowHeight = this.beans.gridOptionsService.getRowHeightAsNumber();
    const totalRowHeight = singleRowHeight * this.rowSpan;
    this.eGui.style.height = `${totalRowHeight}px`;
    this.eGui.style.zIndex = '1';
  }
  destroy() {
    super.destroy();
  }
}