var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean } from "../context/context";
import { warnOnce } from "../utils/function";
let ColumnApi = class ColumnApi {
  constructor(gridAp) {
    this.viaApi = (funcName, ...args) => {
      warnOnce(`Since v31, 'columnApi.${funcName}' is deprecated and moved to 'api.${funcName}'.`);
      return this.api[funcName](...args);
    };
    this.api = gridAp;
  }
  sizeColumnsToFit(gridWidth) {
    this.viaApi('sizeColumnsToFit', gridWidth);
  }
  setColumnGroupOpened(group, newValue) {
    this.viaApi('setColumnGroupOpened', group, newValue);
  }
  getColumnGroup(name, instanceId) {
    return this.viaApi('getColumnGroup', name, instanceId);
  }
  getProvidedColumnGroup(name) {
    return this.viaApi('getProvidedColumnGroup', name);
  }
  getDisplayNameForColumn(column, location) {
    return this.viaApi('getDisplayNameForColumn', column, location);
  }
  getDisplayNameForColumnGroup(columnGroup, location) {
    return this.viaApi('getDisplayNameForColumnGroup', columnGroup, location);
  }
  getColumn(key) {
    return this.viaApi('getColumn', key);
  }
  getColumns() {
    return this.viaApi('getColumns');
  }
  applyColumnState(params) {
    return this.viaApi('applyColumnState', params);
  }
  getColumnState() {
    return this.viaApi('getColumnState');
  }
  resetColumnState() {
    this.viaApi('resetColumnState');
  }
  getColumnGroupState() {
    return this.viaApi('getColumnGroupState');
  }
  setColumnGroupState(stateItems) {
    this.viaApi('setColumnGroupState', stateItems);
  }
  resetColumnGroupState() {
    this.viaApi('resetColumnGroupState');
  }
  isPinning() {
    return this.viaApi('isPinning');
  }
  isPinningLeft() {
    return this.viaApi('isPinningLeft');
  }
  isPinningRight() {
    return this.viaApi('isPinningRight');
  }
  getDisplayedColAfter(col) {
    return this.viaApi('getDisplayedColAfter', col);
  }
  getDisplayedColBefore(col) {
    return this.viaApi('getDisplayedColBefore', col);
  }
  setColumnVisible(key, visible) {
    this.viaApi('setColumnVisible', key, visible);
  }
  setColumnsVisible(keys, visible) {
    this.viaApi('setColumnsVisible', keys, visible);
  }
  setColumnPinned(key, pinned) {
    this.viaApi('setColumnPinned', key, pinned);
  }
  setColumnsPinned(keys, pinned) {
    this.viaApi('setColumnsPinned', keys, pinned);
  }
  getAllGridColumns() {
    return this.viaApi('getAllGridColumns');
  }
  getDisplayedLeftColumns() {
    return this.viaApi('getDisplayedLeftColumns');
  }
  getDisplayedCenterColumns() {
    return this.viaApi('getDisplayedCenterColumns');
  }
  getDisplayedRightColumns() {
    return this.viaApi('getDisplayedRightColumns');
  }
  getAllDisplayedColumns() {
    return this.viaApi('getAllDisplayedColumns');
  }
  getAllDisplayedVirtualColumns() {
    return this.viaApi('getAllDisplayedVirtualColumns');
  }
  moveColumn(key, toIndex) {
    this.viaApi('moveColumn', key, toIndex);
  }
  moveColumnByIndex(fromIndex, toIndex) {
    this.viaApi('moveColumnByIndex', fromIndex, toIndex);
  }
  moveColumns(columnsToMoveKeys, toIndex) {
    this.viaApi('moveColumns', columnsToMoveKeys, toIndex);
  }
  moveRowGroupColumn(fromIndex, toIndex) {
    this.viaApi('moveRowGroupColumn', fromIndex, toIndex);
  }
  setColumnAggFunc(key, aggFunc) {
    this.viaApi('setColumnAggFunc', key, aggFunc);
  }
  setColumnWidth(key, newWidth, finished = true, source) {
    this.viaApi('setColumnWidth', key, newWidth, finished, source);
  }
  setColumnWidths(columnWidths, finished = true, source) {
    this.viaApi('setColumnWidths', columnWidths, finished, source);
  }
  setPivotMode(pivotMode) {
    this.viaApi('setPivotMode', pivotMode);
  }
  isPivotMode() {
    return this.viaApi('isPivotMode');
  }
  getPivotResultColumn(pivotKeys, valueColKey) {
    return this.viaApi('getPivotResultColumn', pivotKeys, valueColKey);
  }
  setValueColumns(colKeys) {
    this.viaApi('setValueColumns', colKeys);
  }
  getValueColumns() {
    return this.viaApi('getValueColumns');
  }
  removeValueColumn(colKey) {
    this.viaApi('removeValueColumn', colKey);
  }
  removeValueColumns(colKeys) {
    this.viaApi('removeValueColumns', colKeys);
  }
  addValueColumn(colKey) {
    this.viaApi('addValueColumn', colKey);
  }
  addValueColumns(colKeys) {
    this.viaApi('addValueColumns', colKeys);
  }
  setRowGroupColumns(colKeys) {
    this.viaApi('setRowGroupColumns', colKeys);
  }
  removeRowGroupColumn(colKey) {
    this.viaApi('removeRowGroupColumn', colKey);
  }
  removeRowGroupColumns(colKeys) {
    this.viaApi('removeRowGroupColumns', colKeys);
  }
  addRowGroupColumn(colKey) {
    this.viaApi('addRowGroupColumn', colKey);
  }
  addRowGroupColumns(colKeys) {
    this.viaApi('addRowGroupColumns', colKeys);
  }
  getRowGroupColumns() {
    return this.viaApi('getRowGroupColumns');
  }
  setPivotColumns(colKeys) {
    this.viaApi('setPivotColumns', colKeys);
  }
  removePivotColumn(colKey) {
    this.viaApi('removePivotColumn', colKey);
  }
  removePivotColumns(colKeys) {
    this.viaApi('removePivotColumns', colKeys);
  }
  addPivotColumn(colKey) {
    this.viaApi('addPivotColumn', colKey);
  }
  addPivotColumns(colKeys) {
    this.viaApi('addPivotColumns', colKeys);
  }
  getPivotColumns() {
    return this.viaApi('getPivotColumns');
  }
  getLeftDisplayedColumnGroups() {
    return this.viaApi('getLeftDisplayedColumnGroups');
  }
  getCenterDisplayedColumnGroups() {
    return this.viaApi('getCenterDisplayedColumnGroups');
  }
  getRightDisplayedColumnGroups() {
    return this.viaApi('getRightDisplayedColumnGroups');
  }
  getAllDisplayedColumnGroups() {
    return this.viaApi('getAllDisplayedColumnGroups');
  }
  autoSizeColumn(key, skipHeader) {
    return this.viaApi('autoSizeColumn', key, skipHeader);
  }
  autoSizeColumns(keys, skipHeader) {
    this.viaApi('autoSizeColumns', keys, skipHeader);
  }
  autoSizeAllColumns(skipHeader) {
    this.viaApi('autoSizeAllColumns', skipHeader);
  }
  setPivotResultColumns(colDefs) {
    this.viaApi('setPivotResultColumns', colDefs);
  }
  getPivotResultColumns() {
    return this.viaApi('getPivotResultColumns');
  }
};
__decorate([Autowired('gridApi')], ColumnApi.prototype, "api", void 0);
ColumnApi = __decorate([Bean('columnApi')], ColumnApi);
export { ColumnApi };