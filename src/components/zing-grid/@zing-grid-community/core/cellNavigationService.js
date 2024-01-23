var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean } from "./context/context";
import { BeanStub } from "./context/beanStub";
import { missing } from "./utils/generic";
import { last } from "./utils/array";
import { KeyCode } from './constants/keyCode';
let CellNavigationService = class CellNavigationService extends BeanStub {
  getNextCellToFocus(key, focusedCell, ctrlPressed = false) {
    if (ctrlPressed) {
      return this.getNextCellToFocusWithCtrlPressed(key, focusedCell);
    }
    return this.getNextCellToFocusWithoutCtrlPressed(key, focusedCell);
  }
  getNextCellToFocusWithCtrlPressed(key, focusedCell) {
    const upKey = key === KeyCode.UP;
    const downKey = key === KeyCode.DOWN;
    const leftKey = key === KeyCode.LEFT;
    let column;
    let rowIndex;
    if (upKey || downKey) {
      rowIndex = upKey ? this.paginationProxy.getPageFirstRow() : this.paginationProxy.getPageLastRow();
      column = focusedCell.column;
    } else {
      const allColumns = this.columnModel.getAllDisplayedColumns();
      const isRtl = this.gridOptionsService.get('enableRtl');
      rowIndex = focusedCell.rowIndex;
      column = leftKey !== isRtl ? allColumns[0] : last(allColumns);
    }
    return {
      rowIndex,
      rowPinned: null,
      column
    };
  }
  getNextCellToFocusWithoutCtrlPressed(key, focusedCell) {
    let pointer = focusedCell;
    let finished = false;
    while (!finished) {
      switch (key) {
        case KeyCode.UP:
          pointer = this.getCellAbove(pointer);
          break;
        case KeyCode.DOWN:
          pointer = this.getCellBelow(pointer);
          break;
        case KeyCode.RIGHT:
          if (this.gridOptionsService.get('enableRtl')) {
            pointer = this.getCellToLeft(pointer);
          } else {
            pointer = this.getCellToRight(pointer);
          }
          break;
        case KeyCode.LEFT:
          if (this.gridOptionsService.get('enableRtl')) {
            pointer = this.getCellToRight(pointer);
          } else {
            pointer = this.getCellToLeft(pointer);
          }
          break;
        default:
          pointer = null;
          console.warn('ZING Grid: unknown key for navigation ' + key);
          break;
      }
      if (pointer) {
        finished = this.isCellGoodToFocusOn(pointer);
      } else {
        finished = true;
      }
    }
    return pointer;
  }
  isCellGoodToFocusOn(gridCell) {
    const column = gridCell.column;
    let rowNode;
    switch (gridCell.rowPinned) {
      case 'top':
        rowNode = this.pinnedRowModel.getPinnedTopRow(gridCell.rowIndex);
        break;
      case 'bottom':
        rowNode = this.pinnedRowModel.getPinnedBottomRow(gridCell.rowIndex);
        break;
      default:
        rowNode = this.rowModel.getRow(gridCell.rowIndex);
        break;
    }
    if (!rowNode) {
      return false;
    }
    const suppressNavigable = column.isSuppressNavigable(rowNode);
    return !suppressNavigable;
  }
  getCellToLeft(lastCell) {
    if (!lastCell) {
      return null;
    }
    const colToLeft = this.columnModel.getDisplayedColBefore(lastCell.column);
    if (!colToLeft) {
      return null;
    }
    return {
      rowIndex: lastCell.rowIndex,
      column: colToLeft,
      rowPinned: lastCell.rowPinned
    };
  }
  getCellToRight(lastCell) {
    if (!lastCell) {
      return null;
    }
    const colToRight = this.columnModel.getDisplayedColAfter(lastCell.column);
    if (!colToRight) {
      return null;
    }
    return {
      rowIndex: lastCell.rowIndex,
      column: colToRight,
      rowPinned: lastCell.rowPinned
    };
  }
  getRowBelow(rowPosition) {
    const index = rowPosition.rowIndex;
    const pinned = rowPosition.rowPinned;
    if (this.isLastRowInContainer(rowPosition)) {
      switch (pinned) {
        case 'bottom':
          return null;
        case 'top':
          if (this.rowModel.isRowsToRender()) {
            return {
              rowIndex: this.paginationProxy.getPageFirstRow(),
              rowPinned: null
            };
          }
          if (this.pinnedRowModel.isRowsToRender('bottom')) {
            return {
              rowIndex: 0,
              rowPinned: 'bottom'
            };
          }
          return null;
        default:
          if (this.pinnedRowModel.isRowsToRender('bottom')) {
            return {
              rowIndex: 0,
              rowPinned: 'bottom'
            };
          }
          return null;
      }
    }
    const rowNode = this.rowModel.getRow(rowPosition.rowIndex);
    const nextStickyPosition = this.getNextStickyPosition(rowNode);
    if (nextStickyPosition) {
      return nextStickyPosition;
    }
    return {
      rowIndex: index + 1,
      rowPinned: pinned
    };
  }
  getNextStickyPosition(rowNode, up) {
    if (!this.gridOptionsService.isGroupRowsSticky() || !rowNode || !rowNode.sticky) {
      return;
    }
    const stickyRowCtrls = [...this.rowRenderer.getStickyTopRowCtrls()].sort((a, b) => a.getRowNode().rowIndex - b.getRowNode().rowIndex);
    const diff = up ? -1 : 1;
    const idx = stickyRowCtrls.findIndex(ctrl => ctrl.getRowNode().rowIndex === rowNode.rowIndex);
    const nextCtrl = stickyRowCtrls[idx + diff];
    if (nextCtrl) {
      return {
        rowIndex: nextCtrl.getRowNode().rowIndex,
        rowPinned: null
      };
    }
  }
  getCellBelow(lastCell) {
    if (!lastCell) {
      return null;
    }
    const rowBelow = this.getRowBelow(lastCell);
    if (rowBelow) {
      return {
        rowIndex: rowBelow.rowIndex,
        column: lastCell.column,
        rowPinned: rowBelow.rowPinned
      };
    }
    return null;
  }
  isLastRowInContainer(rowPosition) {
    const pinned = rowPosition.rowPinned;
    const index = rowPosition.rowIndex;
    if (pinned === 'top') {
      const lastTopIndex = this.pinnedRowModel.getPinnedTopRowData().length - 1;
      return lastTopIndex <= index;
    }
    if (pinned === 'bottom') {
      const lastBottomIndex = this.pinnedRowModel.getPinnedBottomRowData().length - 1;
      return lastBottomIndex <= index;
    }
    const lastBodyIndex = this.paginationProxy.getPageLastRow();
    return lastBodyIndex <= index;
  }
  getRowAbove(rowPosition) {
    const index = rowPosition.rowIndex;
    const pinned = rowPosition.rowPinned;
    const isFirstRow = pinned ? index === 0 : index === this.paginationProxy.getPageFirstRow();
    if (isFirstRow) {
      if (pinned === 'top') {
        return null;
      }
      if (!pinned) {
        if (this.pinnedRowModel.isRowsToRender('top')) {
          return this.getLastFloatingTopRow();
        }
        return null;
      }
      if (this.rowModel.isRowsToRender()) {
        return this.getLastBodyCell();
      }
      if (this.pinnedRowModel.isRowsToRender('top')) {
        return this.getLastFloatingTopRow();
      }
      return null;
    }
    const rowNode = this.rowModel.getRow(rowPosition.rowIndex);
    const nextStickyPosition = this.getNextStickyPosition(rowNode, true);
    if (nextStickyPosition) {
      return nextStickyPosition;
    }
    return {
      rowIndex: index - 1,
      rowPinned: pinned
    };
  }
  getCellAbove(lastCell) {
    if (!lastCell) {
      return null;
    }
    const rowAbove = this.getRowAbove({
      rowIndex: lastCell.rowIndex,
      rowPinned: lastCell.rowPinned
    });
    if (rowAbove) {
      return {
        rowIndex: rowAbove.rowIndex,
        column: lastCell.column,
        rowPinned: rowAbove.rowPinned
      };
    }
    return null;
  }
  getLastBodyCell() {
    const lastBodyRow = this.paginationProxy.getPageLastRow();
    return {
      rowIndex: lastBodyRow,
      rowPinned: null
    };
  }
  getLastFloatingTopRow() {
    const lastFloatingRow = this.pinnedRowModel.getPinnedTopRowData().length - 1;
    return {
      rowIndex: lastFloatingRow,
      rowPinned: 'top'
    };
  }
  getNextTabbedCell(gridCell, backwards) {
    if (backwards) {
      return this.getNextTabbedCellBackwards(gridCell);
    }
    return this.getNextTabbedCellForwards(gridCell);
  }
  getNextTabbedCellForwards(gridCell) {
    const displayedColumns = this.columnModel.getAllDisplayedColumns();
    let newRowIndex = gridCell.rowIndex;
    let newFloating = gridCell.rowPinned;
    let newColumn = this.columnModel.getDisplayedColAfter(gridCell.column);
    if (!newColumn) {
      newColumn = displayedColumns[0];
      const rowBelow = this.getRowBelow(gridCell);
      if (missing(rowBelow)) {
        return null;
      }
      if (!rowBelow.rowPinned && !this.paginationProxy.isRowInPage(rowBelow)) {
        return null;
      }
      newRowIndex = rowBelow ? rowBelow.rowIndex : null;
      newFloating = rowBelow ? rowBelow.rowPinned : null;
    }
    return {
      rowIndex: newRowIndex,
      column: newColumn,
      rowPinned: newFloating
    };
  }
  getNextTabbedCellBackwards(gridCell) {
    const displayedColumns = this.columnModel.getAllDisplayedColumns();
    let newRowIndex = gridCell.rowIndex;
    let newFloating = gridCell.rowPinned;
    let newColumn = this.columnModel.getDisplayedColBefore(gridCell.column);
    if (!newColumn) {
      newColumn = last(displayedColumns);
      const rowAbove = this.getRowAbove({
        rowIndex: gridCell.rowIndex,
        rowPinned: gridCell.rowPinned
      });
      if (missing(rowAbove)) {
        return null;
      }
      if (!rowAbove.rowPinned && !this.paginationProxy.isRowInPage(rowAbove)) {
        return null;
      }
      newRowIndex = rowAbove ? rowAbove.rowIndex : null;
      newFloating = rowAbove ? rowAbove.rowPinned : null;
    }
    return {
      rowIndex: newRowIndex,
      column: newColumn,
      rowPinned: newFloating
    };
  }
};
__decorate([Autowired('columnModel')], CellNavigationService.prototype, "columnModel", void 0);
__decorate([Autowired('rowModel')], CellNavigationService.prototype, "rowModel", void 0);
__decorate([Autowired('rowRenderer')], CellNavigationService.prototype, "rowRenderer", void 0);
__decorate([Autowired('pinnedRowModel')], CellNavigationService.prototype, "pinnedRowModel", void 0);
__decorate([Autowired('paginationProxy')], CellNavigationService.prototype, "paginationProxy", void 0);
CellNavigationService = __decorate([Bean('cellNavigationService')], CellNavigationService);
export { CellNavigationService };