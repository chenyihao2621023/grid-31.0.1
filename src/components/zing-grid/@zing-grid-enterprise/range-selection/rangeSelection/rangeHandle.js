import { CellRangeType, SelectionHandleType, _ } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { AbstractSelectionHandle } from "./abstractSelectionHandle";
export class RangeHandle extends AbstractSelectionHandle {
  constructor() {
    super(RangeHandle.TEMPLATE);
    this.type = SelectionHandleType.RANGE;
    this.rangeFixed = false;
  }
  onDrag(e) {
    const lastCellHovered = this.getLastCellHovered();
    if (!lastCellHovered) {
      return;
    }
    const cellRanges = this.rangeService.getCellRanges();
    const lastRange = _.last(cellRanges);
    if (!this.rangeFixed) {
      this.fixRangeStartEnd(lastRange);
      this.rangeFixed = true;
    }
    this.endPosition = {
      rowIndex: lastCellHovered.rowIndex,
      rowPinned: lastCellHovered.rowPinned,
      column: lastCellHovered.column
    };
    if (cellRanges.length === 2 && cellRanges[0].type === CellRangeType.DIMENSION && lastRange.type === CellRangeType.VALUE) {
      const rowChanged = !this.rowPositionUtils.sameRow(this.endPosition, this.rangeService.getRangeEndRow(lastRange));
      if (rowChanged) {
        this.rangeService.updateRangeEnd(cellRanges[0], Object.assign(Object.assign({}, this.endPosition), {
          column: cellRanges[0].columns[0]
        }), true);
      }
    }
    this.rangeService.extendLatestRangeToCell(this.endPosition);
  }
  onDragEnd(e) {
    const cellRange = _.last(this.rangeService.getCellRanges());
    this.fixRangeStartEnd(cellRange);
    this.rangeFixed = false;
  }
  fixRangeStartEnd(cellRange) {
    const startRow = this.rangeService.getRangeStartRow(cellRange);
    const endRow = this.rangeService.getRangeEndRow(cellRange);
    const column = cellRange.columns[0];
    cellRange.startRow = startRow;
    cellRange.endRow = endRow;
    cellRange.startColumn = column;
  }
}
RangeHandle.TEMPLATE = `<div class="zing-range-handle"></div>`;