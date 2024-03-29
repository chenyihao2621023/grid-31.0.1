import { includes, last } from "../../utils/array";
import { CellRangeType, SelectionHandleType } from "../../interfaces/IRangeService";
import { missing } from "../../utils/generic";
import { setAriaSelected } from "../../utils/aria";
const CSS_CELL_RANGE_SELECTED = 'zing-cell-range-selected';
const CSS_CELL_RANGE_CHART = 'zing-cell-range-chart';
const CSS_CELL_RANGE_SINGLE_CELL = 'zing-cell-range-single-cell';
const CSS_CELL_RANGE_CHART_CATEGORY = 'zing-cell-range-chart-category';
const CSS_CELL_RANGE_HANDLE = 'zing-cell-range-handle';
const CSS_CELL_RANGE_TOP = 'zing-cell-range-top';
const CSS_CELL_RANGE_RIGHT = 'zing-cell-range-right';
const CSS_CELL_RANGE_BOTTOM = 'zing-cell-range-bottom';
const CSS_CELL_RANGE_LEFT = 'zing-cell-range-left';
export class CellRangeFeature {
  constructor(beans, ctrl) {
    this.beans = beans;
    this.cellCtrl = ctrl;
  }
  setComp(cellComp, eGui) {
    this.cellComp = cellComp;
    this.eGui = eGui;
    this.onRangeSelectionChanged();
  }
  onRangeSelectionChanged() {
    if (!this.cellComp) {
      return;
    }
    this.rangeCount = this.beans.rangeService.getCellRangeCount(this.cellCtrl.getCellPosition());
    this.hasChartRange = this.getHasChartRange();
    this.cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_SELECTED, this.rangeCount !== 0);
    this.cellComp.addOrRemoveCssClass(`${CSS_CELL_RANGE_SELECTED}-1`, this.rangeCount === 1);
    this.cellComp.addOrRemoveCssClass(`${CSS_CELL_RANGE_SELECTED}-2`, this.rangeCount === 2);
    this.cellComp.addOrRemoveCssClass(`${CSS_CELL_RANGE_SELECTED}-3`, this.rangeCount === 3);
    this.cellComp.addOrRemoveCssClass(`${CSS_CELL_RANGE_SELECTED}-4`, this.rangeCount >= 4);
    this.cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_CHART, this.hasChartRange);
    setAriaSelected(this.eGui, this.rangeCount > 0 ? true : undefined);
    this.cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_SINGLE_CELL, this.isSingleCell());
    this.updateRangeBorders();
    this.refreshHandle();
  }
  updateRangeBorders() {
    const rangeBorders = this.getRangeBorders();
    const isSingleCell = this.isSingleCell();
    const isTop = !isSingleCell && rangeBorders.top;
    const isRight = !isSingleCell && rangeBorders.right;
    const isBottom = !isSingleCell && rangeBorders.bottom;
    const isLeft = !isSingleCell && rangeBorders.left;
    this.cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_TOP, isTop);
    this.cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_RIGHT, isRight);
    this.cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_BOTTOM, isBottom);
    this.cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_LEFT, isLeft);
  }
  isSingleCell() {
    const {
      rangeService
    } = this.beans;
    return this.rangeCount === 1 && rangeService && !rangeService.isMoreThanOneCell();
  }
  getHasChartRange() {
    const {
      rangeService
    } = this.beans;
    if (!this.rangeCount || !rangeService) {
      return false;
    }
    const cellRanges = rangeService.getCellRanges();
    return cellRanges.length > 0 && cellRanges.every(range => includes([CellRangeType.DIMENSION, CellRangeType.VALUE], range.type));
  }
  updateRangeBordersIfRangeCount() {
    if (this.rangeCount > 0) {
      this.updateRangeBorders();
      this.refreshHandle();
    }
  }
  getRangeBorders() {
    const isRtl = this.beans.gridOptionsService.get('enableRtl');
    let top = false;
    let right = false;
    let bottom = false;
    let left = false;
    const thisCol = this.cellCtrl.getCellPosition().column;
    const {
      rangeService,
      columnModel
    } = this.beans;
    let leftCol;
    let rightCol;
    if (isRtl) {
      leftCol = columnModel.getDisplayedColAfter(thisCol);
      rightCol = columnModel.getDisplayedColBefore(thisCol);
    } else {
      leftCol = columnModel.getDisplayedColBefore(thisCol);
      rightCol = columnModel.getDisplayedColAfter(thisCol);
    }
    const ranges = rangeService.getCellRanges().filter(range => rangeService.isCellInSpecificRange(this.cellCtrl.getCellPosition(), range));
    if (!leftCol) {
      left = true;
    }
    if (!rightCol) {
      right = true;
    }
    for (let i = 0; i < ranges.length; i++) {
      if (top && right && bottom && left) {
        break;
      }
      const range = ranges[i];
      const startRow = rangeService.getRangeStartRow(range);
      const endRow = rangeService.getRangeEndRow(range);
      if (!top && this.beans.rowPositionUtils.sameRow(startRow, this.cellCtrl.getCellPosition())) {
        top = true;
      }
      if (!bottom && this.beans.rowPositionUtils.sameRow(endRow, this.cellCtrl.getCellPosition())) {
        bottom = true;
      }
      if (!left && leftCol && range.columns.indexOf(leftCol) < 0) {
        left = true;
      }
      if (!right && rightCol && range.columns.indexOf(rightCol) < 0) {
        right = true;
      }
    }
    return {
      top,
      right,
      bottom,
      left
    };
  }
  refreshHandle() {
    if (!this.beans.rangeService) {
      return;
    }
    const shouldHaveSelectionHandle = this.shouldHaveSelectionHandle();
    if (this.selectionHandle && !shouldHaveSelectionHandle) {
      this.selectionHandle = this.beans.context.destroyBean(this.selectionHandle);
    }
    if (shouldHaveSelectionHandle) {
      this.addSelectionHandle();
    }
    this.cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_HANDLE, !!this.selectionHandle);
  }
  shouldHaveSelectionHandle() {
    const {
      gridOptionsService,
      rangeService
    } = this.beans;
    const cellRanges = rangeService.getCellRanges();
    const rangesLen = cellRanges.length;
    if (this.rangeCount < 1 || rangesLen < 1) {
      return false;
    }
    const cellRange = last(cellRanges);
    const cellPosition = this.cellCtrl.getCellPosition();
    const isFillHandleAvailable = gridOptionsService.get('enableFillHandle') && !this.cellCtrl.isSuppressFillHandle();
    const isRangeHandleAvailable = gridOptionsService.get('enableRangeHandle');
    let handleIsAvailable = rangesLen === 1 && !this.cellCtrl.isEditing() && (isFillHandleAvailable || isRangeHandleAvailable);
    if (this.hasChartRange) {
      const hasCategoryRange = cellRanges[0].type === CellRangeType.DIMENSION;
      const isCategoryCell = hasCategoryRange && rangeService.isCellInSpecificRange(cellPosition, cellRanges[0]);
      this.cellComp.addOrRemoveCssClass(CSS_CELL_RANGE_CHART_CATEGORY, isCategoryCell);
      handleIsAvailable = cellRange.type === CellRangeType.VALUE;
    }
    return handleIsAvailable && cellRange.endRow != null && rangeService.isContiguousRange(cellRange) && rangeService.isBottomRightCell(cellRange, cellPosition);
  }
  addSelectionHandle() {
    const {
      gridOptionsService,
      rangeService
    } = this.beans;
    const cellRangeType = last(rangeService.getCellRanges()).type;
    const selectionHandleFill = gridOptionsService.get('enableFillHandle') && missing(cellRangeType);
    const type = selectionHandleFill ? SelectionHandleType.FILL : SelectionHandleType.RANGE;
    if (this.selectionHandle && this.selectionHandle.getType() !== type) {
      this.selectionHandle = this.beans.context.destroyBean(this.selectionHandle);
    }
    if (!this.selectionHandle) {
      this.selectionHandle = this.beans.selectionHandleFactory.createSelectionHandle(type);
    }
    this.selectionHandle.refresh(this.cellCtrl);
  }
  destroy() {
    this.beans.context.destroyBean(this.selectionHandle);
  }
}