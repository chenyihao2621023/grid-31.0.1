var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, PostConstruct } from "../../context/context";
import { DragAndDropService, DragSourceType } from "../../dragAndDrop/dragAndDropService";
import { missing, exists } from "../../utils/generic";
import { ColumnMoveHelper } from "../columnMoveHelper";
import { HorizontalDirection } from "../../constants/direction";
export class MoveColumnFeature {
  constructor(pinned, eContainer) {
    this.needToMoveLeft = false;
    this.needToMoveRight = false;
    this.lastMovedInfo = null;
    this.pinned = pinned;
    this.eContainer = eContainer;
    this.centerContainer = !exists(pinned);
  }
  init() {
    this.ctrlsService.whenReady(() => {
      this.gridBodyCon = this.ctrlsService.getGridBodyCtrl();
    });
  }
  getIconName() {
    return this.pinned ? DragAndDropService.ICON_PINNED : DragAndDropService.ICON_MOVE;
  }
  onDragEnter(draggingEvent) {
    const columns = draggingEvent.dragItem.columns;
    const dragCameFromToolPanel = draggingEvent.dragSource.type === DragSourceType.ToolPanel;
    if (dragCameFromToolPanel) {
      this.setColumnsVisible(columns, true, "uiColumnDragged");
    } else {
      const visibleState = draggingEvent.dragItem.visibleState;
      const visibleColumns = (columns || []).filter(column => visibleState[column.getId()]);
      this.setColumnsVisible(visibleColumns, true, "uiColumnDragged");
    }
    this.setColumnsPinned(columns, this.pinned, "uiColumnDragged");
    this.onDragging(draggingEvent, true, true);
  }
  onDragLeave() {
    this.ensureIntervalCleared();
    this.lastMovedInfo = null;
  }
  setColumnsVisible(columns, visible, source = "api") {
    if (columns) {
      const allowedCols = columns.filter(c => !c.getColDef().lockVisible);
      this.columnModel.setColumnsVisible(allowedCols, visible, source);
    }
  }
  setColumnsPinned(columns, pinned, source = "api") {
    if (columns) {
      const allowedCols = columns.filter(c => !c.getColDef().lockPinned);
      this.columnModel.setColumnsPinned(allowedCols, pinned, source);
    }
  }
  onDragStop() {
    this.onDragging(this.lastDraggingEvent, false, true, true);
    this.ensureIntervalCleared();
    this.lastMovedInfo = null;
  }
  checkCenterForScrolling(xAdjustedForScroll) {
    if (this.centerContainer) {
      const firstVisiblePixel = this.ctrlsService.getCenterRowContainerCtrl().getCenterViewportScrollLeft();
      const lastVisiblePixel = firstVisiblePixel + this.ctrlsService.getCenterRowContainerCtrl().getCenterWidth();
      if (this.gridOptionsService.get('enableRtl')) {
        this.needToMoveRight = xAdjustedForScroll < firstVisiblePixel + 50;
        this.needToMoveLeft = xAdjustedForScroll > lastVisiblePixel - 50;
      } else {
        this.needToMoveLeft = xAdjustedForScroll < firstVisiblePixel + 50;
        this.needToMoveRight = xAdjustedForScroll > lastVisiblePixel - 50;
      }
      if (this.needToMoveLeft || this.needToMoveRight) {
        this.ensureIntervalStarted();
      } else {
        this.ensureIntervalCleared();
      }
    }
  }
  onDragging(draggingEvent = this.lastDraggingEvent, fromEnter = false, fakeEvent = false, finished = false) {
    var _a;
    if (finished) {
      if (this.lastMovedInfo) {
        const {
          columns,
          toIndex
        } = this.lastMovedInfo;
        ColumnMoveHelper.moveColumns(columns, toIndex, 'uiColumnMoved', true, this.columnModel);
      }
      return;
    }
    this.lastDraggingEvent = draggingEvent;
    if (missing(draggingEvent.hDirection)) {
      return;
    }
    const mouseX = ColumnMoveHelper.normaliseX(draggingEvent.x, this.pinned, false, this.gridOptionsService, this.ctrlsService);
    if (!fromEnter) {
      this.checkCenterForScrolling(mouseX);
    }
    const hDirection = this.normaliseDirection(draggingEvent.hDirection);
    const dragSourceType = draggingEvent.dragSource.type;
    const allMovingColumns = ((_a = draggingEvent.dragSource.getDragItem().columns) === null || _a === void 0 ? void 0 : _a.filter(col => {
      if (col.getColDef().lockPinned) {
        return col.getPinned() == this.pinned;
      }
      return true;
    })) || [];
    const lastMovedInfo = ColumnMoveHelper.attemptMoveColumns({
      allMovingColumns,
      isFromHeader: dragSourceType === DragSourceType.HeaderCell,
      hDirection,
      xPosition: mouseX,
      pinned: this.pinned,
      fromEnter,
      fakeEvent,
      gridOptionsService: this.gridOptionsService,
      columnModel: this.columnModel
    });
    if (lastMovedInfo) {
      this.lastMovedInfo = lastMovedInfo;
    }
  }
  normaliseDirection(hDirection) {
    if (this.gridOptionsService.get('enableRtl')) {
      switch (hDirection) {
        case HorizontalDirection.Left:
          return HorizontalDirection.Right;
        case HorizontalDirection.Right:
          return HorizontalDirection.Left;
        default:
          console.error(`ZING Grid: Unknown direction ${hDirection}`);
      }
    } else {
      return hDirection;
    }
  }
  ensureIntervalStarted() {
    if (!this.movingIntervalId) {
      this.intervalCount = 0;
      this.failedMoveAttempts = 0;
      this.movingIntervalId = window.setInterval(this.moveInterval.bind(this), 100);
      if (this.needToMoveLeft) {
        this.dragAndDropService.setGhostIcon(DragAndDropService.ICON_LEFT, true);
      } else {
        this.dragAndDropService.setGhostIcon(DragAndDropService.ICON_RIGHT, true);
      }
    }
  }
  ensureIntervalCleared() {
    if (this.movingIntervalId) {
      window.clearInterval(this.movingIntervalId);
      this.movingIntervalId = null;
      this.dragAndDropService.setGhostIcon(DragAndDropService.ICON_MOVE);
    }
  }
  moveInterval() {
    let pixelsToMove;
    this.intervalCount++;
    pixelsToMove = 10 + this.intervalCount * 5;
    if (pixelsToMove > 100) {
      pixelsToMove = 100;
    }
    let pixelsMoved = null;
    const scrollFeature = this.gridBodyCon.getScrollFeature();
    if (this.needToMoveLeft) {
      pixelsMoved = scrollFeature.scrollHorizontally(-pixelsToMove);
    } else if (this.needToMoveRight) {
      pixelsMoved = scrollFeature.scrollHorizontally(pixelsToMove);
    }
    if (pixelsMoved !== 0) {
      this.onDragging(this.lastDraggingEvent);
      this.failedMoveAttempts = 0;
    } else {
      this.failedMoveAttempts++;
      const columns = this.lastDraggingEvent.dragItem.columns;
      const columnsThatCanPin = columns.filter(c => !c.getColDef().lockPinned);
      if (columnsThatCanPin.length > 0) {
        this.dragAndDropService.setGhostIcon(DragAndDropService.ICON_PINNED);
        if (this.failedMoveAttempts > 7) {
          const pinType = this.needToMoveLeft ? 'left' : 'right';
          this.setColumnsPinned(columnsThatCanPin, pinType, "uiColumnDragged");
          this.dragAndDropService.nudge();
        }
      }
    }
  }
}
__decorate([Autowired('columnModel')], MoveColumnFeature.prototype, "columnModel", void 0);
__decorate([Autowired('dragAndDropService')], MoveColumnFeature.prototype, "dragAndDropService", void 0);
__decorate([Autowired('gridOptionsService')], MoveColumnFeature.prototype, "gridOptionsService", void 0);
__decorate([Autowired('ctrlsService')], MoveColumnFeature.prototype, "ctrlsService", void 0);
__decorate([PostConstruct], MoveColumnFeature.prototype, "init", null);