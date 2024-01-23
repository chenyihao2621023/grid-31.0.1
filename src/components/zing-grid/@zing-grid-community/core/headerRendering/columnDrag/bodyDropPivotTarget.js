var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { DragAndDropService } from "../../dragAndDrop/dragAndDropService";
import { Autowired } from "../../context/context";
export class BodyDropPivotTarget {
  constructor(pinned) {
    this.columnsToAggregate = [];
    this.columnsToGroup = [];
    this.columnsToPivot = [];
    this.pinned = pinned;
  }
  onDragEnter(draggingEvent) {
    this.clearColumnsList();
    if (this.gridOptionsService.get('functionsReadOnly')) {
      return;
    }
    const dragColumns = draggingEvent.dragItem.columns;
    if (!dragColumns) {
      return;
    }
    dragColumns.forEach(column => {
      if (!column.isPrimary()) {
        return;
      }
      if (column.isAnyFunctionActive()) {
        return;
      }
      if (column.isAllowValue()) {
        this.columnsToAggregate.push(column);
      } else if (column.isAllowRowGroup()) {
        this.columnsToGroup.push(column);
      } else if (column.isAllowPivot()) {
        this.columnsToPivot.push(column);
      }
    });
  }
  getIconName() {
    const totalColumns = this.columnsToAggregate.length + this.columnsToGroup.length + this.columnsToPivot.length;
    if (totalColumns > 0) {
      return this.pinned ? DragAndDropService.ICON_PINNED : DragAndDropService.ICON_MOVE;
    }
    return null;
  }
  onDragLeave(draggingEvent) {
    this.clearColumnsList();
  }
  clearColumnsList() {
    this.columnsToAggregate.length = 0;
    this.columnsToGroup.length = 0;
    this.columnsToPivot.length = 0;
  }
  onDragging(draggingEvent) {}
  onDragStop(draggingEvent) {
    if (this.columnsToAggregate.length > 0) {
      this.columnModel.addValueColumns(this.columnsToAggregate, "toolPanelDragAndDrop");
    }
    if (this.columnsToGroup.length > 0) {
      this.columnModel.addRowGroupColumns(this.columnsToGroup, "toolPanelDragAndDrop");
    }
    if (this.columnsToPivot.length > 0) {
      this.columnModel.addPivotColumns(this.columnsToPivot, "toolPanelDragAndDrop");
    }
  }
}
__decorate([Autowired('columnModel')], BodyDropPivotTarget.prototype, "columnModel", void 0);
__decorate([Autowired('gridOptionsService')], BodyDropPivotTarget.prototype, "gridOptionsService", void 0);