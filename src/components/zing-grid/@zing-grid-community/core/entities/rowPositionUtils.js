var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean } from "../context/context";
import { BeanStub } from "../context/beanStub";
import { exists } from "../utils/generic";
let RowPositionUtils = class RowPositionUtils extends BeanStub {
  getFirstRow() {
    let rowIndex = 0;
    let rowPinned;
    if (this.pinnedRowModel.getPinnedTopRowCount()) {
      rowPinned = 'top';
    } else if (this.rowModel.getRowCount()) {
      rowPinned = null;
      rowIndex = this.paginationProxy.getPageFirstRow();
    } else if (this.pinnedRowModel.getPinnedBottomRowCount()) {
      rowPinned = 'bottom';
    }
    return rowPinned === undefined ? null : {
      rowIndex,
      rowPinned
    };
  }
  getLastRow() {
    let rowIndex;
    let rowPinned = null;
    const pinnedBottomCount = this.pinnedRowModel.getPinnedBottomRowCount();
    const pinnedTopCount = this.pinnedRowModel.getPinnedTopRowCount();
    if (pinnedBottomCount) {
      rowPinned = 'bottom';
      rowIndex = pinnedBottomCount - 1;
    } else if (this.rowModel.getRowCount()) {
      rowPinned = null;
      rowIndex = this.paginationProxy.getPageLastRow();
    } else if (pinnedTopCount) {
      rowPinned = 'top';
      rowIndex = pinnedTopCount - 1;
    }
    return rowIndex === undefined ? null : {
      rowIndex,
      rowPinned
    };
  }
  getRowNode(gridRow) {
    switch (gridRow.rowPinned) {
      case 'top':
        return this.pinnedRowModel.getPinnedTopRowData()[gridRow.rowIndex];
      case 'bottom':
        return this.pinnedRowModel.getPinnedBottomRowData()[gridRow.rowIndex];
      default:
        return this.rowModel.getRow(gridRow.rowIndex);
    }
  }
  sameRow(rowA, rowB) {
    if (!rowA && !rowB) {
      return true;
    }
    if (rowA && !rowB || !rowA && rowB) {
      return false;
    }
    return rowA.rowIndex === rowB.rowIndex && rowA.rowPinned == rowB.rowPinned;
  }
  before(rowA, rowB) {
    switch (rowA.rowPinned) {
      case 'top':
        if (rowB.rowPinned !== 'top') {
          return true;
        }
        break;
      case 'bottom':
        if (rowB.rowPinned !== 'bottom') {
          return false;
        }
        break;
      default:
        if (exists(rowB.rowPinned)) {
          return rowB.rowPinned !== 'top';
        }
        break;
    }
    return rowA.rowIndex < rowB.rowIndex;
  }
  rowMax(rows) {
    let max;
    rows.forEach(row => {
      if (max === undefined || this.before(max, row)) {
        max = row;
      }
    });
    return max;
  }
  rowMin(rows) {
    let min;
    rows.forEach(row => {
      if (min === undefined || this.before(row, min)) {
        min = row;
      }
    });
    return min;
  }
};
__decorate([Autowired('rowModel')], RowPositionUtils.prototype, "rowModel", void 0);
__decorate([Autowired('pinnedRowModel')], RowPositionUtils.prototype, "pinnedRowModel", void 0);
__decorate([Autowired('paginationProxy')], RowPositionUtils.prototype, "paginationProxy", void 0);
RowPositionUtils = __decorate([Bean('rowPositionUtils')], RowPositionUtils);
export { RowPositionUtils };