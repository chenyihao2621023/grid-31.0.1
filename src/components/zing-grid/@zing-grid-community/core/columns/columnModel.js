var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = this && this.__param || function (paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
};
var __rest = this && this.__rest || function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
};
import { ColumnGroup } from '../entities/columnGroup';
import { Column } from '../entities/column';
import { Events } from '../events';
import { BeanStub } from "../context/beanStub";
import { ProvidedColumnGroup } from '../entities/providedColumnGroup';
import { GroupInstanceIdCreator } from './groupInstanceIdCreator';
import { Autowired, Bean, Optional, PostConstruct, PreDestroy, Qualifier } from '../context/context';
import { GROUP_AUTO_COLUMN_ID } from './autoGroupColService';
import { areEqual, last, removeFromArray, moveInArray, includes, insertIntoArray, removeAllFromUnorderedArray, removeFromUnorderedArray } from '../utils/array';
import { missingOrEmpty, exists, missing, attrToBoolean, attrToNumber } from '../utils/generic';
import { camelCaseToHumanText } from '../utils/string';
import { convertToMap } from '../utils/map';
import { warnOnce } from '../utils/function';
let ColumnModel = class ColumnModel extends BeanStub {
  constructor() {
    super(...arguments);
    this.primaryHeaderRowCount = 0;
    this.secondaryHeaderRowCount = 0;
    this.gridHeaderRowCount = 0;
    this.displayedColumnsLeft = [];
    this.displayedColumnsRight = [];
    this.displayedColumnsCenter = [];
    this.displayedColumns = [];
    this.displayedColumnsAndGroupsMap = {};
    this.viewportColumns = [];
    this.viewportColumnsHash = '';
    this.headerViewportColumns = [];
    this.viewportColumnsCenter = [];
    this.headerViewportColumnsCenter = [];
    this.autoHeightActiveAtLeastOnce = false;
    this.rowGroupColumns = [];
    this.valueColumns = [];
    this.pivotColumns = [];
    this.ready = false;
    this.autoGroupsNeedBuilding = false;
    this.forceRecreateAutoGroups = false;
    this.pivotMode = false;
    this.bodyWidth = 0;
    this.leftWidth = 0;
    this.rightWidth = 0;
    this.bodyWidthDirty = true;
    this.shouldQueueResizeOperations = false;
    this.resizeOperationQueue = [];
  }
  init() {
    this.suppressColumnVirtualisation = this.gridOptionsService.get('suppressColumnVirtualisation');
    const pivotMode = this.gridOptionsService.get('pivotMode');
    if (this.isPivotSettingAllowed(pivotMode)) {
      this.pivotMode = pivotMode;
    }
    this.addManagedPropertyListeners(['groupDisplayType', 'treeData', 'treeDataDisplayType', 'groupHideOpenParents'], () => this.buildAutoGroupColumns());
    this.addManagedPropertyListener('autoGroupColumnDef', () => this.onAutoGroupColumnDefChanged());
    this.addManagedPropertyListeners(['defaultColDef', 'columnTypes', 'suppressFieldDotNotation'], params => this.onSharedColDefChanged(params.source));
    this.addManagedPropertyListener('pivotMode', event => this.setPivotMode(this.gridOptionsService.get('pivotMode'), event.source));
    this.addManagedListener(this.eventService, Events.EVENT_FIRST_DATA_RENDERED, () => this.onFirstDataRendered());
  }
  buildAutoGroupColumns() {
    if (!this.columnDefs) {
      return;
    }
    this.autoGroupsNeedBuilding = true;
    this.forceRecreateAutoGroups = true;
    this.updateGridColumns();
    this.updateDisplayedColumns('gridOptionsChanged');
  }
  onAutoGroupColumnDefChanged() {
    if (this.groupAutoColumns) {
      this.autoGroupColService.updateAutoGroupColumns(this.groupAutoColumns);
    }
  }
  onSharedColDefChanged(source = 'api') {
    if (!this.gridColumns) {
      return;
    }
    if (this.groupAutoColumns) {
      this.autoGroupColService.updateAutoGroupColumns(this.groupAutoColumns);
    }
    this.createColumnsFromColumnDefs(true, source);
  }
  setColumnDefs(columnDefs, source = 'api') {
    const colsPreviouslyExisted = !!this.columnDefs;
    this.columnDefs = columnDefs;
    this.createColumnsFromColumnDefs(colsPreviouslyExisted, source);
  }
  recreateColumnDefs(source = 'api') {
    this.onSharedColDefChanged(source);
  }
  destroyOldColumns(oldTree, newTree) {
    const oldObjectsById = {};
    if (!oldTree) {
      return;
    }
    this.columnUtils.depthFirstOriginalTreeSearch(null, oldTree, child => {
      oldObjectsById[child.getInstanceId()] = child;
    });
    if (newTree) {
      this.columnUtils.depthFirstOriginalTreeSearch(null, newTree, child => {
        oldObjectsById[child.getInstanceId()] = null;
      });
    }
    const colsToDestroy = Object.values(oldObjectsById).filter(item => item != null);
    this.destroyBeans(colsToDestroy);
  }
  destroyColumns() {
    this.destroyOldColumns(this.primaryColumnTree);
    this.destroyOldColumns(this.secondaryBalancedTree);
    this.destroyOldColumns(this.groupAutoColsBalancedTree);
  }
  createColumnsFromColumnDefs(colsPreviouslyExisted, source = 'api') {
    const dispatchEventsFunc = colsPreviouslyExisted ? this.compareColumnStatesAndDispatchEvents(source) : undefined;
    this.valueCache.expire();
    this.autoGroupsNeedBuilding = true;
    const oldPrimaryColumns = this.primaryColumns;
    const oldPrimaryTree = this.primaryColumnTree;
    const balancedTreeResult = this.columnFactory.createColumnTree(this.columnDefs, true, oldPrimaryTree);
    this.destroyOldColumns(this.primaryColumnTree, balancedTreeResult.columnTree);
    this.primaryColumnTree = balancedTreeResult.columnTree;
    this.primaryHeaderRowCount = balancedTreeResult.treeDept + 1;
    this.primaryColumns = this.getColumnsFromTree(this.primaryColumnTree);
    this.primaryColumnsMap = {};
    this.primaryColumns.forEach(col => this.primaryColumnsMap[col.getId()] = col);
    this.extractRowGroupColumns(source, oldPrimaryColumns);
    this.extractPivotColumns(source, oldPrimaryColumns);
    this.extractValueColumns(source, oldPrimaryColumns);
    this.ready = true;
    const gridColsNotProcessed = this.gridColsArePrimary === undefined;
    const processGridCols = this.gridColsArePrimary || gridColsNotProcessed || this.autoGroupsNeedBuilding;
    if (processGridCols) {
      this.updateGridColumns();
      if (colsPreviouslyExisted && this.gridColsArePrimary && !this.gridOptionsService.get('maintainColumnOrder')) {
        this.orderGridColumnsLikePrimary();
      }
      this.updateDisplayedColumns(source);
      this.checkViewportColumns();
    }
    this.dispatchEverythingChanged(source);
    if (dispatchEventsFunc) {
      dispatchEventsFunc();
    }
    this.dispatchNewColumnsLoaded(source);
  }
  dispatchNewColumnsLoaded(source) {
    const newColumnsLoadedEvent = {
      type: Events.EVENT_NEW_COLUMNS_LOADED,
      source
    };
    this.eventService.dispatchEvent(newColumnsLoadedEvent);
    if (source === 'gridInitializing') {
      this.onColumnsReady();
    }
  }
  dispatchEverythingChanged(source = 'api') {
    const eventEverythingChanged = {
      type: Events.EVENT_COLUMN_EVERYTHING_CHANGED,
      source
    };
    this.eventService.dispatchEvent(eventEverythingChanged);
  }
  orderGridColumnsLikePrimary() {
    const primaryColumns = this.primaryColumns;
    if (!primaryColumns) {
      return;
    }
    const primaryColsOrdered = primaryColumns.filter(col => this.gridColumns.indexOf(col) >= 0);
    const otherCols = this.gridColumns.filter(col => primaryColsOrdered.indexOf(col) < 0);
    this.gridColumns = [...otherCols, ...primaryColsOrdered];
    this.gridColumns = this.placeLockedColumns(this.gridColumns);
  }
  getAllDisplayedAutoHeightCols() {
    return this.displayedAutoHeightCols;
  }
  setViewport() {
    if (this.gridOptionsService.get('enableRtl')) {
      this.viewportLeft = this.bodyWidth - this.scrollPosition - this.scrollWidth;
      this.viewportRight = this.bodyWidth - this.scrollPosition;
    } else {
      this.viewportLeft = this.scrollPosition;
      this.viewportRight = this.scrollWidth + this.scrollPosition;
    }
  }
  getDisplayedColumnsStartingAt(column) {
    let currentColumn = column;
    const columns = [];
    while (currentColumn != null) {
      columns.push(currentColumn);
      currentColumn = this.getDisplayedColAfter(currentColumn);
    }
    return columns;
  }
  checkViewportColumns(afterScroll = false) {
    if (this.displayedColumnsCenter == null) {
      return;
    }
    const viewportColumnsChanged = this.extractViewport();
    if (!viewportColumnsChanged) {
      return;
    }
    const event = {
      type: Events.EVENT_VIRTUAL_COLUMNS_CHANGED,
      afterScroll
    };
    this.eventService.dispatchEvent(event);
  }
  setViewportPosition(scrollWidth, scrollPosition, afterScroll = false) {
    if (scrollWidth !== this.scrollWidth || scrollPosition !== this.scrollPosition || this.bodyWidthDirty) {
      this.scrollWidth = scrollWidth;
      this.scrollPosition = scrollPosition;
      this.bodyWidthDirty = true;
      this.setViewport();
      if (this.ready) {
        this.checkViewportColumns(afterScroll);
      }
    }
  }
  isPivotMode() {
    return this.pivotMode;
  }
  isPivotSettingAllowed(pivot) {
    if (pivot && this.gridOptionsService.get('treeData')) {
      console.warn("ZING Grid: Pivot mode not available in conjunction Tree Data i.e. 'gridOptions.treeData: true'");
      return false;
    }
    return true;
  }
  setPivotMode(pivotMode, source = 'api') {
    if (pivotMode === this.pivotMode || !this.isPivotSettingAllowed(this.pivotMode)) {
      return;
    }
    this.pivotMode = pivotMode;
    if (!this.gridColumns) {
      return;
    }
    this.autoGroupsNeedBuilding = true;
    this.updateGridColumns();
    this.updateDisplayedColumns(source);
    const event = {
      type: Events.EVENT_COLUMN_PIVOT_MODE_CHANGED
    };
    this.eventService.dispatchEvent(event);
  }
  getSecondaryPivotColumn(pivotKeys, valueColKey) {
    if (missing(this.secondaryColumns)) {
      return null;
    }
    const valueColumnToFind = this.getPrimaryColumn(valueColKey);
    let foundColumn = null;
    this.secondaryColumns.forEach(column => {
      const thisPivotKeys = column.getColDef().pivotKeys;
      const pivotValueColumn = column.getColDef().pivotValueColumn;
      const pivotKeyMatches = areEqual(thisPivotKeys, pivotKeys);
      const pivotValueMatches = pivotValueColumn === valueColumnToFind;
      if (pivotKeyMatches && pivotValueMatches) {
        foundColumn = column;
      }
    });
    return foundColumn;
  }
  setBeans(loggerFactory) {
    this.logger = loggerFactory.create('columnModel');
  }
  setFirstRightAndLastLeftPinned(source) {
    let lastLeft;
    let firstRight;
    if (this.gridOptionsService.get('enableRtl')) {
      lastLeft = this.displayedColumnsLeft ? this.displayedColumnsLeft[0] : null;
      firstRight = this.displayedColumnsRight ? last(this.displayedColumnsRight) : null;
    } else {
      lastLeft = this.displayedColumnsLeft ? last(this.displayedColumnsLeft) : null;
      firstRight = this.displayedColumnsRight ? this.displayedColumnsRight[0] : null;
    }
    this.gridColumns.forEach(column => {
      column.setLastLeftPinned(column === lastLeft, source);
      column.setFirstRightPinned(column === firstRight, source);
    });
  }
  autoSizeColumns(params) {
    if (this.shouldQueueResizeOperations) {
      this.resizeOperationQueue.push(() => this.autoSizeColumns(params));
      return;
    }
    const {
      columns,
      skipHeader,
      skipHeaderGroups,
      stopAtGroup,
      source = 'api'
    } = params;
    this.animationFrameService.flushAllFrames();
    const columnsAutosized = [];
    let changesThisTimeAround = -1;
    const shouldSkipHeader = skipHeader != null ? skipHeader : this.gridOptionsService.get('skipHeaderOnAutoSize');
    const shouldSkipHeaderGroups = skipHeaderGroups != null ? skipHeaderGroups : shouldSkipHeader;
    while (changesThisTimeAround !== 0) {
      changesThisTimeAround = 0;
      this.actionOnGridColumns(columns, column => {
        if (columnsAutosized.indexOf(column) >= 0) {
          return false;
        }
        const preferredWidth = this.autoWidthCalculator.getPreferredWidthForColumn(column, shouldSkipHeader);
        if (preferredWidth > 0) {
          const newWidth = this.normaliseColumnWidth(column, preferredWidth);
          column.setActualWidth(newWidth, source);
          columnsAutosized.push(column);
          changesThisTimeAround++;
        }
        return true;
      }, source);
    }
    if (!shouldSkipHeaderGroups) {
      this.autoSizeColumnGroupsByColumns(columns, source, stopAtGroup);
    }
    this.dispatchColumnResizedEvent(columnsAutosized, true, 'autosizeColumns');
  }
  dispatchColumnResizedEvent(columns, finished, source, flexColumns = null) {
    if (columns && columns.length) {
      const event = {
        type: Events.EVENT_COLUMN_RESIZED,
        columns: columns,
        column: columns.length === 1 ? columns[0] : null,
        flexColumns: flexColumns,
        finished: finished,
        source: source
      };
      this.eventService.dispatchEvent(event);
    }
  }
  dispatchColumnChangedEvent(type, columns, source) {
    const event = {
      type: type,
      columns: columns,
      column: columns && columns.length == 1 ? columns[0] : null,
      source: source
    };
    this.eventService.dispatchEvent(event);
  }
  dispatchColumnMovedEvent(params) {
    const {
      movedColumns,
      source,
      toIndex,
      finished
    } = params;
    const event = {
      type: Events.EVENT_COLUMN_MOVED,
      columns: movedColumns,
      column: movedColumns && movedColumns.length === 1 ? movedColumns[0] : null,
      toIndex,
      finished,
      source
    };
    this.eventService.dispatchEvent(event);
  }
  dispatchColumnPinnedEvent(changedColumns, source) {
    if (!changedColumns.length) {
      return;
    }
    const column = changedColumns.length === 1 ? changedColumns[0] : null;
    const pinned = this.getCommonValue(changedColumns, col => col.getPinned());
    const event = {
      type: Events.EVENT_COLUMN_PINNED,
      pinned: pinned != null ? pinned : null,
      columns: changedColumns,
      column,
      source: source
    };
    this.eventService.dispatchEvent(event);
  }
  dispatchColumnVisibleEvent(changedColumns, source) {
    if (!changedColumns.length) {
      return;
    }
    const column = changedColumns.length === 1 ? changedColumns[0] : null;
    const visible = this.getCommonValue(changedColumns, col => col.isVisible());
    const event = {
      type: Events.EVENT_COLUMN_VISIBLE,
      visible,
      columns: changedColumns,
      column,
      source: source
    };
    this.eventService.dispatchEvent(event);
  }
  autoSizeColumn(key, skipHeader, source = "api") {
    if (key) {
      this.autoSizeColumns({
        columns: [key],
        skipHeader,
        skipHeaderGroups: true,
        source
      });
    }
  }
  autoSizeColumnGroupsByColumns(keys, source, stopAtGroup) {
    const columnGroups = new Set();
    const columns = this.getGridColumns(keys);
    columns.forEach(col => {
      let parent = col.getParent();
      while (parent && parent != stopAtGroup) {
        if (!parent.isPadding()) {
          columnGroups.add(parent);
        }
        parent = parent.getParent();
      }
    });
    let headerGroupCtrl;
    const resizedColumns = [];
    for (const columnGroup of columnGroups) {
      for (const headerContainerCtrl of this.ctrlsService.getHeaderRowContainerCtrls()) {
        headerGroupCtrl = headerContainerCtrl.getHeaderCtrlForColumn(columnGroup);
        if (headerGroupCtrl) {
          break;
        }
      }
      if (headerGroupCtrl) {
        headerGroupCtrl.resizeLeafColumnsToFit(source);
      }
    }
    return resizedColumns;
  }
  autoSizeAllColumns(skipHeader, source = "api") {
    if (this.shouldQueueResizeOperations) {
      this.resizeOperationQueue.push(() => this.autoSizeAllColumns(skipHeader, source));
      return;
    }
    const allDisplayedColumns = this.getAllDisplayedColumns();
    this.autoSizeColumns({
      columns: allDisplayedColumns,
      skipHeader,
      source
    });
  }
  getColumnsFromTree(rootColumns) {
    const result = [];
    const recursiveFindColumns = childColumns => {
      for (let i = 0; i < childColumns.length; i++) {
        const child = childColumns[i];
        if (child instanceof Column) {
          result.push(child);
        } else if (child instanceof ProvidedColumnGroup) {
          recursiveFindColumns(child.getChildren());
        }
      }
    };
    recursiveFindColumns(rootColumns);
    return result;
  }
  getAllDisplayedTrees() {
    if (this.displayedTreeLeft && this.displayedTreeRight && this.displayedTreeCentre) {
      return this.displayedTreeLeft.concat(this.displayedTreeCentre).concat(this.displayedTreeRight);
    }
    return null;
  }
  getPrimaryColumnTree() {
    return this.primaryColumnTree;
  }
  getHeaderRowCount() {
    return this.gridHeaderRowCount;
  }
  getDisplayedTreeLeft() {
    return this.displayedTreeLeft;
  }
  getDisplayedTreeRight() {
    return this.displayedTreeRight;
  }
  getDisplayedTreeCentre() {
    return this.displayedTreeCentre;
  }
  isColumnDisplayed(column) {
    return this.getAllDisplayedColumns().indexOf(column) >= 0;
  }
  getAllDisplayedColumns() {
    return this.displayedColumns;
  }
  getViewportColumns() {
    return this.viewportColumns;
  }
  getDisplayedLeftColumnsForRow(rowNode) {
    if (!this.colSpanActive) {
      return this.displayedColumnsLeft;
    }
    return this.getDisplayedColumnsForRow(rowNode, this.displayedColumnsLeft);
  }
  getDisplayedRightColumnsForRow(rowNode) {
    if (!this.colSpanActive) {
      return this.displayedColumnsRight;
    }
    return this.getDisplayedColumnsForRow(rowNode, this.displayedColumnsRight);
  }
  isColSpanActive() {
    return this.colSpanActive;
  }
  getDisplayedColumnsForRow(rowNode, displayedColumns, filterCallback, emptySpaceBeforeColumn) {
    const result = [];
    let lastConsideredCol = null;
    for (let i = 0; i < displayedColumns.length; i++) {
      const col = displayedColumns[i];
      const maxAllowedColSpan = displayedColumns.length - i;
      const colSpan = Math.min(col.getColSpan(rowNode), maxAllowedColSpan);
      const columnsToCheckFilter = [col];
      if (colSpan > 1) {
        const colsToRemove = colSpan - 1;
        for (let j = 1; j <= colsToRemove; j++) {
          columnsToCheckFilter.push(displayedColumns[i + j]);
        }
        i += colsToRemove;
      }
      let filterPasses;
      if (filterCallback) {
        filterPasses = false;
        columnsToCheckFilter.forEach(colForFilter => {
          if (filterCallback(colForFilter)) {
            filterPasses = true;
          }
        });
      } else {
        filterPasses = true;
      }
      if (filterPasses) {
        if (result.length === 0 && lastConsideredCol) {
          const gapBeforeColumn = emptySpaceBeforeColumn ? emptySpaceBeforeColumn(col) : false;
          if (gapBeforeColumn) {
            result.push(lastConsideredCol);
          }
        }
        result.push(col);
      }
      lastConsideredCol = col;
    }
    return result;
  }
  getViewportCenterColumnsForRow(rowNode) {
    if (!this.colSpanActive) {
      return this.viewportColumnsCenter;
    }
    const emptySpaceBeforeColumn = col => {
      const left = col.getLeft();
      return exists(left) && left > this.viewportLeft;
    };
    const filterCallback = this.suppressColumnVirtualisation ? null : this.isColumnInRowViewport.bind(this);
    return this.getDisplayedColumnsForRow(rowNode, this.displayedColumnsCenter, filterCallback, emptySpaceBeforeColumn);
  }
  isColumnAtEdge(col, edge) {
    const allColumns = this.getAllDisplayedColumns();
    if (!allColumns.length) {
      return false;
    }
    const isFirst = edge === 'first';
    let columnToCompare;
    if (col instanceof ColumnGroup) {
      const leafColumns = col.getDisplayedLeafColumns();
      if (!leafColumns.length) {
        return false;
      }
      columnToCompare = isFirst ? leafColumns[0] : last(leafColumns);
    } else {
      columnToCompare = col;
    }
    return (isFirst ? allColumns[0] : last(allColumns)) === columnToCompare;
  }
  getAriaColumnIndex(col) {
    let targetColumn;
    if (col instanceof ColumnGroup) {
      targetColumn = col.getLeafColumns()[0];
    } else {
      targetColumn = col;
    }
    return this.getAllGridColumns().indexOf(targetColumn) + 1;
  }
  isColumnInHeaderViewport(col) {
    if (col.isAutoHeaderHeight()) {
      return true;
    }
    return this.isColumnInRowViewport(col);
  }
  isColumnInRowViewport(col) {
    if (col.isAutoHeight()) {
      return true;
    }
    const columnLeft = col.getLeft() || 0;
    const columnRight = columnLeft + col.getActualWidth();
    const leftBounds = this.viewportLeft - 200;
    const rightBounds = this.viewportRight + 200;
    const columnToMuchLeft = columnLeft < leftBounds && columnRight < leftBounds;
    const columnToMuchRight = columnLeft > rightBounds && columnRight > rightBounds;
    return !columnToMuchLeft && !columnToMuchRight;
  }
  getDisplayedColumnsLeftWidth() {
    return this.getWidthOfColsInList(this.displayedColumnsLeft);
  }
  getDisplayedColumnsRightWidth() {
    return this.getWidthOfColsInList(this.displayedColumnsRight);
  }
  updatePrimaryColumnList(keys, masterList, actionIsAdd, columnCallback, eventType, source = "api") {
    if (!keys || missingOrEmpty(keys)) {
      return;
    }
    let atLeastOne = false;
    keys.forEach(key => {
      const columnToAdd = this.getPrimaryColumn(key);
      if (!columnToAdd) {
        return;
      }
      if (actionIsAdd) {
        if (masterList.indexOf(columnToAdd) >= 0) {
          return;
        }
        masterList.push(columnToAdd);
      } else {
        if (masterList.indexOf(columnToAdd) < 0) {
          return;
        }
        removeFromArray(masterList, columnToAdd);
      }
      columnCallback(columnToAdd);
      atLeastOne = true;
    });
    if (!atLeastOne) {
      return;
    }
    if (this.autoGroupsNeedBuilding) {
      this.updateGridColumns();
    }
    this.updateDisplayedColumns(source);
    const event = {
      type: eventType,
      columns: masterList,
      column: masterList.length === 1 ? masterList[0] : null,
      source: source
    };
    this.eventService.dispatchEvent(event);
  }
  setRowGroupColumns(colKeys, source = "api") {
    this.autoGroupsNeedBuilding = true;
    this.setPrimaryColumnList(colKeys, this.rowGroupColumns, Events.EVENT_COLUMN_ROW_GROUP_CHANGED, true, this.setRowGroupActive.bind(this), source);
  }
  setRowGroupActive(active, column, source) {
    if (active === column.isRowGroupActive()) {
      return;
    }
    column.setRowGroupActive(active, source);
    if (active && !this.gridOptionsService.get('suppressRowGroupHidesColumns')) {
      this.setColumnVisible(column, false, source);
    }
    if (!active && !this.gridOptionsService.get('suppressMakeColumnVisibleAfterUnGroup')) {
      this.setColumnVisible(column, true, source);
    }
  }
  addRowGroupColumn(key, source = "api") {
    if (key) {
      this.addRowGroupColumns([key], source);
    }
  }
  addRowGroupColumns(keys, source = "api") {
    this.autoGroupsNeedBuilding = true;
    this.updatePrimaryColumnList(keys, this.rowGroupColumns, true, this.setRowGroupActive.bind(this, true), Events.EVENT_COLUMN_ROW_GROUP_CHANGED, source);
  }
  removeRowGroupColumns(keys, source = "api") {
    this.autoGroupsNeedBuilding = true;
    this.updatePrimaryColumnList(keys, this.rowGroupColumns, false, this.setRowGroupActive.bind(this, false), Events.EVENT_COLUMN_ROW_GROUP_CHANGED, source);
  }
  removeRowGroupColumn(key, source = "api") {
    if (key) {
      this.removeRowGroupColumns([key], source);
    }
  }
  addPivotColumns(keys, source = "api") {
    this.updatePrimaryColumnList(keys, this.pivotColumns, true, column => column.setPivotActive(true, source), Events.EVENT_COLUMN_PIVOT_CHANGED, source);
  }
  setPivotColumns(colKeys, source = "api") {
    this.setPrimaryColumnList(colKeys, this.pivotColumns, Events.EVENT_COLUMN_PIVOT_CHANGED, true, (added, column) => {
      column.setPivotActive(added, source);
    }, source);
  }
  addPivotColumn(key, source = "api") {
    this.addPivotColumns([key], source);
  }
  removePivotColumns(keys, source = "api") {
    this.updatePrimaryColumnList(keys, this.pivotColumns, false, column => column.setPivotActive(false, source), Events.EVENT_COLUMN_PIVOT_CHANGED, source);
  }
  removePivotColumn(key, source = "api") {
    this.removePivotColumns([key], source);
  }
  setPrimaryColumnList(colKeys, masterList, eventName, detectOrderChange, columnCallback, source) {
    if (!this.gridColumns) {
      return;
    }
    const changes = new Map();
    masterList.forEach((col, idx) => changes.set(col, idx));
    masterList.length = 0;
    if (exists(colKeys)) {
      colKeys.forEach(key => {
        const column = this.getPrimaryColumn(key);
        if (column) {
          masterList.push(column);
        }
      });
    }
    masterList.forEach((col, idx) => {
      const oldIndex = changes.get(col);
      if (oldIndex === undefined) {
        changes.set(col, 0);
        return;
      }
      if (detectOrderChange && oldIndex !== idx) {
        return;
      }
      changes.delete(col);
    });
    (this.primaryColumns || []).forEach(column => {
      const added = masterList.indexOf(column) >= 0;
      columnCallback(added, column);
    });
    if (this.autoGroupsNeedBuilding) {
      this.updateGridColumns();
    }
    this.updateDisplayedColumns(source);
    this.dispatchColumnChangedEvent(eventName, [...changes.keys()], source);
  }
  setValueColumns(colKeys, source = "api") {
    this.setPrimaryColumnList(colKeys, this.valueColumns, Events.EVENT_COLUMN_VALUE_CHANGED, false, this.setValueActive.bind(this), source);
  }
  setValueActive(active, column, source) {
    if (active === column.isValueActive()) {
      return;
    }
    column.setValueActive(active, source);
    if (active && !column.getAggFunc()) {
      const initialAggFunc = this.aggFuncService.getDefaultAggFunc(column);
      column.setAggFunc(initialAggFunc);
    }
  }
  addValueColumns(keys, source = "api") {
    this.updatePrimaryColumnList(keys, this.valueColumns, true, this.setValueActive.bind(this, true), Events.EVENT_COLUMN_VALUE_CHANGED, source);
  }
  addValueColumn(colKey, source = "api") {
    if (colKey) {
      this.addValueColumns([colKey], source);
    }
  }
  removeValueColumn(colKey, source = "api") {
    this.removeValueColumns([colKey], source);
  }
  removeValueColumns(keys, source = "api") {
    this.updatePrimaryColumnList(keys, this.valueColumns, false, this.setValueActive.bind(this, false), Events.EVENT_COLUMN_VALUE_CHANGED, source);
  }
  normaliseColumnWidth(column, newWidth) {
    const minWidth = column.getMinWidth();
    if (exists(minWidth) && newWidth < minWidth) {
      newWidth = minWidth;
    }
    const maxWidth = column.getMaxWidth();
    if (exists(maxWidth) && column.isGreaterThanMax(newWidth)) {
      newWidth = maxWidth;
    }
    return newWidth;
  }
  getPrimaryOrGridColumn(key) {
    const column = this.getPrimaryColumn(key);
    return column || this.getGridColumn(key);
  }
  setColumnWidths(columnWidths, shiftKey, finished, source = "api") {
    const sets = [];
    columnWidths.forEach(columnWidth => {
      const col = this.getPrimaryOrGridColumn(columnWidth.key);
      if (!col) {
        return;
      }
      sets.push({
        width: columnWidth.newWidth,
        ratios: [1],
        columns: [col]
      });
      const defaultIsShift = this.gridOptionsService.get('colResizeDefault') === 'shift';
      if (defaultIsShift) {
        shiftKey = !shiftKey;
      }
      if (shiftKey) {
        const otherCol = this.getDisplayedColAfter(col);
        if (!otherCol) {
          return;
        }
        const widthDiff = col.getActualWidth() - columnWidth.newWidth;
        const otherColWidth = otherCol.getActualWidth() + widthDiff;
        sets.push({
          width: otherColWidth,
          ratios: [1],
          columns: [otherCol]
        });
      }
    });
    if (sets.length === 0) {
      return;
    }
    this.resizeColumnSets({
      resizeSets: sets,
      finished,
      source
    });
  }
  checkMinAndMaxWidthsForSet(columnResizeSet) {
    const {
      columns,
      width
    } = columnResizeSet;
    let minWidthAccumulated = 0;
    let maxWidthAccumulated = 0;
    let maxWidthActive = true;
    columns.forEach(col => {
      const minWidth = col.getMinWidth();
      minWidthAccumulated += minWidth || 0;
      const maxWidth = col.getMaxWidth();
      if (exists(maxWidth) && maxWidth > 0) {
        maxWidthAccumulated += maxWidth;
      } else {
        maxWidthActive = false;
      }
    });
    const minWidthPasses = width >= minWidthAccumulated;
    const maxWidthPasses = !maxWidthActive || width <= maxWidthAccumulated;
    return minWidthPasses && maxWidthPasses;
  }
  resizeColumnSets(params) {
    const {
      resizeSets,
      finished,
      source
    } = params;
    const passMinMaxCheck = !resizeSets || resizeSets.every(columnResizeSet => this.checkMinAndMaxWidthsForSet(columnResizeSet));
    if (!passMinMaxCheck) {
      if (finished) {
        const columns = resizeSets && resizeSets.length > 0 ? resizeSets[0].columns : null;
        this.dispatchColumnResizedEvent(columns, finished, source);
      }
      return;
    }
    const changedCols = [];
    const allResizedCols = [];
    resizeSets.forEach(set => {
      const {
        width,
        columns,
        ratios
      } = set;
      const newWidths = {};
      const finishedCols = {};
      columns.forEach(col => allResizedCols.push(col));
      let finishedColsGrew = true;
      let loopCount = 0;
      while (finishedColsGrew) {
        loopCount++;
        if (loopCount > 1000) {
          console.error('ZING Grid: infinite loop in resizeColumnSets');
          break;
        }
        finishedColsGrew = false;
        const subsetCols = [];
        let subsetRatioTotal = 0;
        let pixelsToDistribute = width;
        columns.forEach((col, index) => {
          const thisColFinished = finishedCols[col.getId()];
          if (thisColFinished) {
            pixelsToDistribute -= newWidths[col.getId()];
          } else {
            subsetCols.push(col);
            const ratioThisCol = ratios[index];
            subsetRatioTotal += ratioThisCol;
          }
        });
        const ratioScale = 1 / subsetRatioTotal;
        subsetCols.forEach((col, index) => {
          const lastCol = index === subsetCols.length - 1;
          let colNewWidth;
          if (lastCol) {
            colNewWidth = pixelsToDistribute;
          } else {
            colNewWidth = Math.round(ratios[index] * width * ratioScale);
            pixelsToDistribute -= colNewWidth;
          }
          const minWidth = col.getMinWidth();
          const maxWidth = col.getMaxWidth();
          if (exists(minWidth) && colNewWidth < minWidth) {
            colNewWidth = minWidth;
            finishedCols[col.getId()] = true;
            finishedColsGrew = true;
          } else if (exists(maxWidth) && maxWidth > 0 && colNewWidth > maxWidth) {
            colNewWidth = maxWidth;
            finishedCols[col.getId()] = true;
            finishedColsGrew = true;
          }
          newWidths[col.getId()] = colNewWidth;
        });
      }
      columns.forEach(col => {
        const newWidth = newWidths[col.getId()];
        const actualWidth = col.getActualWidth();
        if (actualWidth !== newWidth) {
          col.setActualWidth(newWidth, source);
          changedCols.push(col);
        }
      });
    });
    const atLeastOneColChanged = changedCols.length > 0;
    let flexedCols = [];
    if (atLeastOneColChanged) {
      flexedCols = this.refreshFlexedColumns({
        resizingCols: allResizedCols,
        skipSetLeft: true
      });
      this.setLeftValues(source);
      this.updateBodyWidths();
      this.checkViewportColumns();
    }
    const colsForEvent = allResizedCols.concat(flexedCols);
    if (atLeastOneColChanged || finished) {
      this.dispatchColumnResizedEvent(colsForEvent, finished, source, flexedCols);
    }
  }
  setColumnAggFunc(key, aggFunc, source = "api") {
    if (!key) {
      return;
    }
    const column = this.getPrimaryColumn(key);
    if (!column) {
      return;
    }
    column.setAggFunc(aggFunc);
    this.dispatchColumnChangedEvent(Events.EVENT_COLUMN_VALUE_CHANGED, [column], source);
  }
  moveRowGroupColumn(fromIndex, toIndex, source = "api") {
    if (this.isRowGroupEmpty()) {
      return;
    }
    const column = this.rowGroupColumns[fromIndex];
    const impactedColumns = this.rowGroupColumns.slice(fromIndex, toIndex);
    this.rowGroupColumns.splice(fromIndex, 1);
    this.rowGroupColumns.splice(toIndex, 0, column);
    const event = {
      type: Events.EVENT_COLUMN_ROW_GROUP_CHANGED,
      columns: impactedColumns,
      column: impactedColumns.length === 1 ? impactedColumns[0] : null,
      source: source
    };
    this.eventService.dispatchEvent(event);
  }
  moveColumns(columnsToMoveKeys, toIndex, source = "api", finished = true) {
    if (!this.gridColumns) {
      return;
    }
    this.columnAnimationService.start();
    if (toIndex > this.gridColumns.length - columnsToMoveKeys.length) {
      console.warn('ZING Grid: tried to insert columns in invalid location, toIndex = ' + toIndex);
      console.warn('ZING Grid: remember that you should not count the moving columns when calculating the new index');
      return;
    }
    const movedColumns = this.getGridColumns(columnsToMoveKeys);
    const failedRules = !this.doesMovePassRules(movedColumns, toIndex);
    if (failedRules) {
      return;
    }
    moveInArray(this.gridColumns, movedColumns, toIndex);
    this.updateDisplayedColumns(source);
    this.dispatchColumnMovedEvent({
      movedColumns,
      source,
      toIndex,
      finished
    });
    this.columnAnimationService.finish();
  }
  doesMovePassRules(columnsToMove, toIndex) {
    const proposedColumnOrder = this.getProposedColumnOrder(columnsToMove, toIndex);
    return this.doesOrderPassRules(proposedColumnOrder);
  }
  doesOrderPassRules(gridOrder) {
    if (!this.doesMovePassMarryChildren(gridOrder)) {
      return false;
    }
    if (!this.doesMovePassLockedPositions(gridOrder)) {
      return false;
    }
    return true;
  }
  getProposedColumnOrder(columnsToMove, toIndex) {
    const proposedColumnOrder = this.gridColumns.slice();
    moveInArray(proposedColumnOrder, columnsToMove, toIndex);
    return proposedColumnOrder;
  }
  sortColumnsLikeGridColumns(cols) {
    if (!cols || cols.length <= 1) {
      return;
    }
    const notAllColsInGridColumns = cols.filter(c => this.gridColumns.indexOf(c) < 0).length > 0;
    if (notAllColsInGridColumns) {
      return;
    }
    cols.sort((a, b) => {
      const indexA = this.gridColumns.indexOf(a);
      const indexB = this.gridColumns.indexOf(b);
      return indexA - indexB;
    });
  }
  doesMovePassLockedPositions(proposedColumnOrder) {
    let lastPlacement = 0;
    let rulePassed = true;
    const lockPositionToPlacement = position => {
      if (!position) {
        return 1;
      }
      if (position === true) {
        return 0;
      }
      return position === 'left' ? 0 : 2;
    };
    proposedColumnOrder.forEach(col => {
      const placement = lockPositionToPlacement(col.getColDef().lockPosition);
      if (placement < lastPlacement) {
        rulePassed = false;
      }
      lastPlacement = placement;
    });
    return rulePassed;
  }
  doesMovePassMarryChildren(allColumnsCopy) {
    let rulePassed = true;
    this.columnUtils.depthFirstOriginalTreeSearch(null, this.gridBalancedTree, child => {
      if (!(child instanceof ProvidedColumnGroup)) {
        return;
      }
      const columnGroup = child;
      const colGroupDef = columnGroup.getColGroupDef();
      const marryChildren = colGroupDef && colGroupDef.marryChildren;
      if (!marryChildren) {
        return;
      }
      const newIndexes = [];
      columnGroup.getLeafColumns().forEach(col => {
        const newColIndex = allColumnsCopy.indexOf(col);
        newIndexes.push(newColIndex);
      });
      const maxIndex = Math.max.apply(Math, newIndexes);
      const minIndex = Math.min.apply(Math, newIndexes);
      const spread = maxIndex - minIndex;
      const maxSpread = columnGroup.getLeafColumns().length - 1;
      if (spread > maxSpread) {
        rulePassed = false;
      }
    });
    return rulePassed;
  }
  moveColumn(key, toIndex, source = "api") {
    this.moveColumns([key], toIndex, source);
  }
  moveColumnByIndex(fromIndex, toIndex, source = "api") {
    if (!this.gridColumns) {
      return;
    }
    const column = this.gridColumns[fromIndex];
    this.moveColumn(column, toIndex, source);
  }
  getColumnDefs() {
    if (!this.primaryColumns) {
      return;
    }
    const cols = this.primaryColumns.slice();
    if (this.gridColsArePrimary) {
      cols.sort((a, b) => this.gridColumns.indexOf(a) - this.gridColumns.indexOf(b));
    } else if (this.lastPrimaryOrder) {
      cols.sort((a, b) => this.lastPrimaryOrder.indexOf(a) - this.lastPrimaryOrder.indexOf(b));
    }
    return this.columnDefFactory.buildColumnDefs(cols, this.rowGroupColumns, this.pivotColumns);
  }
  getBodyContainerWidth() {
    return this.bodyWidth;
  }
  getContainerWidth(pinned) {
    switch (pinned) {
      case 'left':
        return this.leftWidth;
      case 'right':
        return this.rightWidth;
      default:
        return this.bodyWidth;
    }
  }
  updateBodyWidths() {
    const newBodyWidth = this.getWidthOfColsInList(this.displayedColumnsCenter);
    const newLeftWidth = this.getWidthOfColsInList(this.displayedColumnsLeft);
    const newRightWidth = this.getWidthOfColsInList(this.displayedColumnsRight);
    this.bodyWidthDirty = this.bodyWidth !== newBodyWidth;
    const atLeastOneChanged = this.bodyWidth !== newBodyWidth || this.leftWidth !== newLeftWidth || this.rightWidth !== newRightWidth;
    if (atLeastOneChanged) {
      this.bodyWidth = newBodyWidth;
      this.leftWidth = newLeftWidth;
      this.rightWidth = newRightWidth;
      const event = {
        type: Events.EVENT_DISPLAYED_COLUMNS_WIDTH_CHANGED
      };
      this.eventService.dispatchEvent(event);
    }
  }
  getValueColumns() {
    return this.valueColumns ? this.valueColumns : [];
  }
  getPivotColumns() {
    return this.pivotColumns ? this.pivotColumns : [];
  }
  isPivotActive() {
    return this.pivotColumns && this.pivotColumns.length > 0 && this.pivotMode;
  }
  getRowGroupColumns() {
    return this.rowGroupColumns ? this.rowGroupColumns : [];
  }
  getDisplayedCenterColumns() {
    return this.displayedColumnsCenter;
  }
  getDisplayedLeftColumns() {
    return this.displayedColumnsLeft;
  }
  getDisplayedRightColumns() {
    return this.displayedColumnsRight;
  }
  getDisplayedColumns(type) {
    switch (type) {
      case 'left':
        return this.getDisplayedLeftColumns();
      case 'right':
        return this.getDisplayedRightColumns();
      default:
        return this.getDisplayedCenterColumns();
    }
  }
  getAllPrimaryColumns() {
    return this.primaryColumns ? this.primaryColumns.slice() : null;
  }
  getSecondaryColumns() {
    return this.secondaryColumns ? this.secondaryColumns.slice() : null;
  }
  getAllColumnsForQuickFilter() {
    return this.columnsForQuickFilter;
  }
  getAllGridColumns() {
    var _a;
    return (_a = this.gridColumns) !== null && _a !== void 0 ? _a : [];
  }
  isEmpty() {
    return missingOrEmpty(this.gridColumns);
  }
  isRowGroupEmpty() {
    return missingOrEmpty(this.rowGroupColumns);
  }
  setColumnVisible(key, visible, source = "api") {
    this.setColumnsVisible([key], visible, source);
  }
  setColumnsVisible(keys, visible = false, source = "api") {
    this.applyColumnState({
      state: keys.map(key => ({
        colId: typeof key === 'string' ? key : key.getColId(),
        hide: !visible
      }))
    }, source);
  }
  setColumnPinned(key, pinned, source = "api") {
    if (key) {
      this.setColumnsPinned([key], pinned, source);
    }
  }
  setColumnsPinned(keys, pinned, source = "api") {
    if (!this.gridColumns) {
      return;
    }
    if (this.gridOptionsService.isDomLayout('print')) {
      console.warn(`ZING Grid: Changing the column pinning status is not allowed with domLayout='print'`);
      return;
    }
    this.columnAnimationService.start();
    let actualPinned;
    if (pinned === true || pinned === 'left') {
      actualPinned = 'left';
    } else if (pinned === 'right') {
      actualPinned = 'right';
    } else {
      actualPinned = null;
    }
    this.actionOnGridColumns(keys, col => {
      if (col.getPinned() !== actualPinned) {
        col.setPinned(actualPinned);
        return true;
      }
      return false;
    }, source, () => {
      const event = {
        type: Events.EVENT_COLUMN_PINNED,
        pinned: actualPinned,
        column: null,
        columns: null,
        source: source
      };
      return event;
    });
    this.columnAnimationService.finish();
  }
  actionOnGridColumns(keys, action, source, createEvent) {
    if (missingOrEmpty(keys)) {
      return;
    }
    const updatedColumns = [];
    keys.forEach(key => {
      const column = this.getGridColumn(key);
      if (!column) {
        return;
      }
      const resultOfAction = action(column);
      if (resultOfAction !== false) {
        updatedColumns.push(column);
      }
    });
    if (!updatedColumns.length) {
      return;
    }
    this.updateDisplayedColumns(source);
    if (exists(createEvent) && createEvent) {
      const event = createEvent();
      event.columns = updatedColumns;
      event.column = updatedColumns.length === 1 ? updatedColumns[0] : null;
      this.eventService.dispatchEvent(event);
    }
  }
  getDisplayedColBefore(col) {
    const allDisplayedColumns = this.getAllDisplayedColumns();
    const oldIndex = allDisplayedColumns.indexOf(col);
    if (oldIndex > 0) {
      return allDisplayedColumns[oldIndex - 1];
    }
    return null;
  }
  getDisplayedColAfter(col) {
    const allDisplayedColumns = this.getAllDisplayedColumns();
    const oldIndex = allDisplayedColumns.indexOf(col);
    if (oldIndex < allDisplayedColumns.length - 1) {
      return allDisplayedColumns[oldIndex + 1];
    }
    return null;
  }
  getDisplayedGroupAfter(columnGroup) {
    return this.getDisplayedGroupAtDirection(columnGroup, 'After');
  }
  getDisplayedGroupBefore(columnGroup) {
    return this.getDisplayedGroupAtDirection(columnGroup, 'Before');
  }
  getDisplayedGroupAtDirection(columnGroup, direction) {
    const requiredLevel = columnGroup.getProvidedColumnGroup().getLevel() + columnGroup.getPaddingLevel();
    const colGroupLeafColumns = columnGroup.getDisplayedLeafColumns();
    const col = direction === 'After' ? last(colGroupLeafColumns) : colGroupLeafColumns[0];
    const getDisplayColMethod = `getDisplayedCol${direction}`;
    while (true) {
      const column = this[getDisplayColMethod](col);
      if (!column) {
        return null;
      }
      const groupPointer = this.getColumnGroupAtLevel(column, requiredLevel);
      if (groupPointer !== columnGroup) {
        return groupPointer;
      }
    }
  }
  getColumnGroupAtLevel(column, level) {
    let groupPointer = column.getParent();
    let originalGroupLevel;
    let groupPointerLevel;
    while (true) {
      const groupPointerProvidedColumnGroup = groupPointer.getProvidedColumnGroup();
      originalGroupLevel = groupPointerProvidedColumnGroup.getLevel();
      groupPointerLevel = groupPointer.getPaddingLevel();
      if (originalGroupLevel + groupPointerLevel <= level) {
        break;
      }
      groupPointer = groupPointer.getParent();
    }
    return groupPointer;
  }
  isPinningLeft() {
    return this.displayedColumnsLeft.length > 0;
  }
  isPinningRight() {
    return this.displayedColumnsRight.length > 0;
  }
  getPrimaryAndSecondaryAndAutoColumns() {
    return [].concat(...[this.primaryColumns || [], this.groupAutoColumns || [], this.secondaryColumns || []]);
  }
  createStateItemFromColumn(column) {
    const rowGroupIndex = column.isRowGroupActive() ? this.rowGroupColumns.indexOf(column) : null;
    const pivotIndex = column.isPivotActive() ? this.pivotColumns.indexOf(column) : null;
    const aggFunc = column.isValueActive() ? column.getAggFunc() : null;
    const sort = column.getSort() != null ? column.getSort() : null;
    const sortIndex = column.getSortIndex() != null ? column.getSortIndex() : null;
    const flex = column.getFlex() != null && column.getFlex() > 0 ? column.getFlex() : null;
    const res = {
      colId: column.getColId(),
      width: column.getActualWidth(),
      hide: !column.isVisible(),
      pinned: column.getPinned(),
      sort,
      sortIndex,
      aggFunc,
      rowGroup: column.isRowGroupActive(),
      rowGroupIndex,
      pivot: column.isPivotActive(),
      pivotIndex: pivotIndex,
      flex
    };
    return res;
  }
  getColumnState() {
    if (missing(this.primaryColumns) || !this.isAlive()) {
      return [];
    }
    const colsForState = this.getPrimaryAndSecondaryAndAutoColumns();
    const res = colsForState.map(this.createStateItemFromColumn.bind(this));
    this.orderColumnStateList(res);
    return res;
  }
  orderColumnStateList(columnStateList) {
    const colIdToGridIndexMap = convertToMap(this.gridColumns.map((col, index) => [col.getColId(), index]));
    columnStateList.sort((itemA, itemB) => {
      const posA = colIdToGridIndexMap.has(itemA.colId) ? colIdToGridIndexMap.get(itemA.colId) : -1;
      const posB = colIdToGridIndexMap.has(itemB.colId) ? colIdToGridIndexMap.get(itemB.colId) : -1;
      return posA - posB;
    });
  }
  resetColumnState(source = "api") {
    if (missingOrEmpty(this.primaryColumns)) {
      return;
    }
    const primaryColumns = this.getColumnsFromTree(this.primaryColumnTree);
    const columnStates = [];
    let letRowGroupIndex = 1000;
    let letPivotIndex = 1000;
    let colsToProcess = [];
    if (this.groupAutoColumns) {
      colsToProcess = colsToProcess.concat(this.groupAutoColumns);
    }
    if (primaryColumns) {
      colsToProcess = colsToProcess.concat(primaryColumns);
    }
    colsToProcess.forEach(column => {
      const stateItem = this.getColumnStateFromColDef(column);
      if (missing(stateItem.rowGroupIndex) && stateItem.rowGroup) {
        stateItem.rowGroupIndex = letRowGroupIndex++;
      }
      if (missing(stateItem.pivotIndex) && stateItem.pivot) {
        stateItem.pivotIndex = letPivotIndex++;
      }
      columnStates.push(stateItem);
    });
    this.applyColumnState({
      state: columnStates,
      applyOrder: true
    }, source);
  }
  getColumnStateFromColDef(column) {
    const getValueOrNull = (a, b) => a != null ? a : b != null ? b : null;
    const colDef = column.getColDef();
    const sort = getValueOrNull(colDef.sort, colDef.initialSort);
    const sortIndex = getValueOrNull(colDef.sortIndex, colDef.initialSortIndex);
    const hide = getValueOrNull(colDef.hide, colDef.initialHide);
    const pinned = getValueOrNull(colDef.pinned, colDef.initialPinned);
    const width = getValueOrNull(colDef.width, colDef.initialWidth);
    const flex = getValueOrNull(colDef.flex, colDef.initialFlex);
    let rowGroupIndex = getValueOrNull(colDef.rowGroupIndex, colDef.initialRowGroupIndex);
    let rowGroup = getValueOrNull(colDef.rowGroup, colDef.initialRowGroup);
    if (rowGroupIndex == null && (rowGroup == null || rowGroup == false)) {
      rowGroupIndex = null;
      rowGroup = null;
    }
    let pivotIndex = getValueOrNull(colDef.pivotIndex, colDef.initialPivotIndex);
    let pivot = getValueOrNull(colDef.pivot, colDef.initialPivot);
    if (pivotIndex == null && (pivot == null || pivot == false)) {
      pivotIndex = null;
      pivot = null;
    }
    const aggFunc = getValueOrNull(colDef.aggFunc, colDef.initialAggFunc);
    return {
      colId: column.getColId(),
      sort,
      sortIndex,
      hide,
      pinned,
      width,
      flex,
      rowGroup,
      rowGroupIndex,
      pivot,
      pivotIndex,
      aggFunc
    };
  }
  applyColumnState(params, source) {
    if (missingOrEmpty(this.primaryColumns)) {
      return false;
    }
    if (params && params.state && !params.state.forEach) {
      console.warn('ZING Grid: applyColumnState() - the state attribute should be an array, however an array was not found. Please provide an array of items (one for each col you want to change) for state.');
      return false;
    }
    const applyStates = (states, existingColumns, getById) => {
      const dispatchEventsFunc = this.compareColumnStatesAndDispatchEvents(source);
      this.autoGroupsNeedBuilding = true;
      const columnsWithNoState = existingColumns.slice();
      const rowGroupIndexes = {};
      const pivotIndexes = {};
      const autoGroupColumnStates = [];
      const unmatchedAndAutoStates = [];
      let unmatchedCount = 0;
      const previousRowGroupCols = this.rowGroupColumns.slice();
      const previousPivotCols = this.pivotColumns.slice();
      states.forEach(state => {
        const colId = state.colId || '';
        const isAutoGroupColumn = colId.startsWith(GROUP_AUTO_COLUMN_ID);
        if (isAutoGroupColumn) {
          autoGroupColumnStates.push(state);
          unmatchedAndAutoStates.push(state);
          return;
        }
        const column = getById(colId);
        if (!column) {
          unmatchedAndAutoStates.push(state);
          unmatchedCount += 1;
        } else {
          this.syncColumnWithStateItem(column, state, params.defaultState, rowGroupIndexes, pivotIndexes, false, source);
          removeFromArray(columnsWithNoState, column);
        }
      });
      const applyDefaultsFunc = col => this.syncColumnWithStateItem(col, null, params.defaultState, rowGroupIndexes, pivotIndexes, false, source);
      columnsWithNoState.forEach(applyDefaultsFunc);
      const comparator = (indexes, oldList, colA, colB) => {
        const indexA = indexes[colA.getId()];
        const indexB = indexes[colB.getId()];
        const aHasIndex = indexA != null;
        const bHasIndex = indexB != null;
        if (aHasIndex && bHasIndex) {
          return indexA - indexB;
        }
        if (aHasIndex) {
          return -1;
        }
        if (bHasIndex) {
          return 1;
        }
        const oldIndexA = oldList.indexOf(colA);
        const oldIndexB = oldList.indexOf(colB);
        const aHasOldIndex = oldIndexA >= 0;
        const bHasOldIndex = oldIndexB >= 0;
        if (aHasOldIndex && bHasOldIndex) {
          return oldIndexA - oldIndexB;
        }
        if (aHasOldIndex) {
          return -1;
        }
        return 1;
      };
      this.rowGroupColumns.sort(comparator.bind(this, rowGroupIndexes, previousRowGroupCols));
      this.pivotColumns.sort(comparator.bind(this, pivotIndexes, previousPivotCols));
      this.updateGridColumns();
      const autoGroupColsCopy = this.groupAutoColumns ? this.groupAutoColumns.slice() : [];
      autoGroupColumnStates.forEach(stateItem => {
        const autoCol = this.getAutoColumn(stateItem.colId);
        removeFromArray(autoGroupColsCopy, autoCol);
        this.syncColumnWithStateItem(autoCol, stateItem, params.defaultState, null, null, true, source);
      });
      autoGroupColsCopy.forEach(applyDefaultsFunc);
      this.applyOrderAfterApplyState(params);
      this.updateDisplayedColumns(source);
      this.dispatchEverythingChanged(source);
      dispatchEventsFunc();
      return {
        unmatchedAndAutoStates,
        unmatchedCount
      };
    };
    this.columnAnimationService.start();
    let {
      unmatchedAndAutoStates,
      unmatchedCount
    } = applyStates(params.state || [], this.primaryColumns || [], id => this.getPrimaryColumn(id));
    if (unmatchedAndAutoStates.length > 0 || exists(params.defaultState)) {
      unmatchedCount = applyStates(unmatchedAndAutoStates, this.secondaryColumns || [], id => this.getSecondaryColumn(id)).unmatchedCount;
    }
    this.columnAnimationService.finish();
    return unmatchedCount === 0;
  }
  applyOrderAfterApplyState(params) {
    if (!params.applyOrder || !params.state) {
      return;
    }
    let newOrder = [];
    const processedColIds = {};
    params.state.forEach(item => {
      if (!item.colId || processedColIds[item.colId]) {
        return;
      }
      const col = this.gridColumnsMap[item.colId];
      if (col) {
        newOrder.push(col);
        processedColIds[item.colId] = true;
      }
    });
    let autoGroupInsertIndex = 0;
    this.gridColumns.forEach(col => {
      const colId = col.getColId();
      const alreadyProcessed = processedColIds[colId] != null;
      if (alreadyProcessed) {
        return;
      }
      const isAutoGroupCol = colId.startsWith(GROUP_AUTO_COLUMN_ID);
      if (isAutoGroupCol) {
        insertIntoArray(newOrder, col, autoGroupInsertIndex++);
      } else {
        newOrder.push(col);
      }
    });
    newOrder = this.placeLockedColumns(newOrder);
    if (!this.doesMovePassMarryChildren(newOrder)) {
      console.warn('ZING Grid: Applying column order broke a group where columns should be married together. Applying new order has been discarded.');
      return;
    }
    this.gridColumns = newOrder;
  }
  compareColumnStatesAndDispatchEvents(source) {
    const startState = {
      rowGroupColumns: this.rowGroupColumns.slice(),
      pivotColumns: this.pivotColumns.slice(),
      valueColumns: this.valueColumns.slice()
    };
    const columnStateBefore = this.getColumnState();
    const columnStateBeforeMap = {};
    columnStateBefore.forEach(col => {
      columnStateBeforeMap[col.colId] = col;
    });
    return () => {
      const colsForState = this.getPrimaryAndSecondaryAndAutoColumns();
      const dispatchWhenListsDifferent = (eventType, colsBefore, colsAfter, idMapper) => {
        const beforeList = colsBefore.map(idMapper);
        const afterList = colsAfter.map(idMapper);
        const unchanged = areEqual(beforeList, afterList);
        if (unchanged) {
          return;
        }
        const changes = new Set(colsBefore);
        colsAfter.forEach(id => {
          if (!changes.delete(id)) {
            changes.add(id);
          }
        });
        const changesArr = [...changes];
        const event = {
          type: eventType,
          columns: changesArr,
          column: changesArr.length === 1 ? changesArr[0] : null,
          source: source
        };
        this.eventService.dispatchEvent(event);
      };
      const getChangedColumns = changedPredicate => {
        const changedColumns = [];
        colsForState.forEach(column => {
          const colStateBefore = columnStateBeforeMap[column.getColId()];
          if (colStateBefore && changedPredicate(colStateBefore, column)) {
            changedColumns.push(column);
          }
        });
        return changedColumns;
      };
      const columnIdMapper = c => c.getColId();
      dispatchWhenListsDifferent(Events.EVENT_COLUMN_ROW_GROUP_CHANGED, startState.rowGroupColumns, this.rowGroupColumns, columnIdMapper);
      dispatchWhenListsDifferent(Events.EVENT_COLUMN_PIVOT_CHANGED, startState.pivotColumns, this.pivotColumns, columnIdMapper);
      const valueChangePredicate = (cs, c) => {
        const oldActive = cs.aggFunc != null;
        const activeChanged = oldActive != c.isValueActive();
        const aggFuncChanged = oldActive && cs.aggFunc != c.getAggFunc();
        return activeChanged || aggFuncChanged;
      };
      const changedValues = getChangedColumns(valueChangePredicate);
      if (changedValues.length > 0) {
        this.dispatchColumnChangedEvent(Events.EVENT_COLUMN_VALUE_CHANGED, changedValues, source);
      }
      const resizeChangePredicate = (cs, c) => cs.width != c.getActualWidth();
      this.dispatchColumnResizedEvent(getChangedColumns(resizeChangePredicate), true, source);
      const pinnedChangePredicate = (cs, c) => cs.pinned != c.getPinned();
      this.dispatchColumnPinnedEvent(getChangedColumns(pinnedChangePredicate), source);
      const visibilityChangePredicate = (cs, c) => cs.hide == c.isVisible();
      this.dispatchColumnVisibleEvent(getChangedColumns(visibilityChangePredicate), source);
      const sortChangePredicate = (cs, c) => cs.sort != c.getSort() || cs.sortIndex != c.getSortIndex();
      if (getChangedColumns(sortChangePredicate).length > 0) {
        this.sortController.dispatchSortChangedEvents(source);
      }
      this.normaliseColumnMovedEventForColumnState(columnStateBefore, source);
    };
  }
  getCommonValue(cols, valueGetter) {
    if (!cols || cols.length == 0) {
      return undefined;
    }
    const firstValue = valueGetter(cols[0]);
    for (let i = 1; i < cols.length; i++) {
      if (firstValue !== valueGetter(cols[i])) {
        return undefined;
      }
    }
    return firstValue;
  }
  normaliseColumnMovedEventForColumnState(colStateBefore, source) {
    const colStateAfter = this.getColumnState();
    const colStateAfterMapped = {};
    colStateAfter.forEach(s => colStateAfterMapped[s.colId] = s);
    const colsIntersectIds = {};
    colStateBefore.forEach(s => {
      if (colStateAfterMapped[s.colId]) {
        colsIntersectIds[s.colId] = true;
      }
    });
    const beforeFiltered = colStateBefore.filter(c => colsIntersectIds[c.colId]);
    const afterFiltered = colStateAfter.filter(c => colsIntersectIds[c.colId]);
    const movedColumns = [];
    afterFiltered.forEach((csAfter, index) => {
      const csBefore = beforeFiltered && beforeFiltered[index];
      if (csBefore && csBefore.colId !== csAfter.colId) {
        const gridCol = this.getGridColumn(csBefore.colId);
        if (gridCol) {
          movedColumns.push(gridCol);
        }
      }
    });
    if (!movedColumns.length) {
      return;
    }
    this.dispatchColumnMovedEvent({
      movedColumns,
      source,
      finished: true
    });
  }
  syncColumnWithStateItem(column, stateItem, defaultState, rowGroupIndexes, pivotIndexes, autoCol, source) {
    if (!column) {
      return;
    }
    const getValue = (key1, key2) => {
      const obj = {
        value1: undefined,
        value2: undefined
      };
      let calculated = false;
      if (stateItem) {
        if (stateItem[key1] !== undefined) {
          obj.value1 = stateItem[key1];
          calculated = true;
        }
        if (exists(key2) && stateItem[key2] !== undefined) {
          obj.value2 = stateItem[key2];
          calculated = true;
        }
      }
      if (!calculated && defaultState) {
        if (defaultState[key1] !== undefined) {
          obj.value1 = defaultState[key1];
        }
        if (exists(key2) && defaultState[key2] !== undefined) {
          obj.value2 = defaultState[key2];
        }
      }
      return obj;
    };
    const hide = getValue('hide').value1;
    if (hide !== undefined) {
      column.setVisible(!hide, source);
    }
    const pinned = getValue('pinned').value1;
    if (pinned !== undefined) {
      column.setPinned(pinned);
    }
    const minColWidth = this.columnUtils.calculateColMinWidth(column.getColDef());
    const flex = getValue('flex').value1;
    if (flex !== undefined) {
      column.setFlex(flex);
    }
    const noFlexThisCol = column.getFlex() <= 0;
    if (noFlexThisCol) {
      const width = getValue('width').value1;
      if (width != null) {
        if (minColWidth != null && width >= minColWidth) {
          column.setActualWidth(width, source);
        }
      }
    }
    const sort = getValue('sort').value1;
    if (sort !== undefined) {
      if (sort === 'desc' || sort === 'asc') {
        column.setSort(sort, source);
      } else {
        column.setSort(undefined, source);
      }
    }
    const sortIndex = getValue('sortIndex').value1;
    if (sortIndex !== undefined) {
      column.setSortIndex(sortIndex);
    }
    if (autoCol || !column.isPrimary()) {
      return;
    }
    const aggFunc = getValue('aggFunc').value1;
    if (aggFunc !== undefined) {
      if (typeof aggFunc === 'string') {
        column.setAggFunc(aggFunc);
        if (!column.isValueActive()) {
          column.setValueActive(true, source);
          this.valueColumns.push(column);
        }
      } else {
        if (exists(aggFunc)) {
          console.warn('ZING Grid: stateItem.aggFunc must be a string. if using your own aggregation ' + 'functions, register the functions first before using them in get/set state. This is because it is ' + 'intended for the column state to be stored and retrieved as simple JSON.');
        }
        if (column.isValueActive()) {
          column.setValueActive(false, source);
          removeFromArray(this.valueColumns, column);
        }
      }
    }
    const {
      value1: rowGroup,
      value2: rowGroupIndex
    } = getValue('rowGroup', 'rowGroupIndex');
    if (rowGroup !== undefined || rowGroupIndex !== undefined) {
      if (typeof rowGroupIndex === 'number' || rowGroup) {
        if (!column.isRowGroupActive()) {
          column.setRowGroupActive(true, source);
          this.rowGroupColumns.push(column);
        }
        if (rowGroupIndexes && typeof rowGroupIndex === 'number') {
          rowGroupIndexes[column.getId()] = rowGroupIndex;
        }
      } else {
        if (column.isRowGroupActive()) {
          column.setRowGroupActive(false, source);
          removeFromArray(this.rowGroupColumns, column);
        }
      }
    }
    const {
      value1: pivot,
      value2: pivotIndex
    } = getValue('pivot', 'pivotIndex');
    if (pivot !== undefined || pivotIndex !== undefined) {
      if (typeof pivotIndex === 'number' || pivot) {
        if (!column.isPivotActive()) {
          column.setPivotActive(true, source);
          this.pivotColumns.push(column);
        }
        if (pivotIndexes && typeof pivotIndex === 'number') {
          pivotIndexes[column.getId()] = pivotIndex;
        }
      } else {
        if (column.isPivotActive()) {
          column.setPivotActive(false, source);
          removeFromArray(this.pivotColumns, column);
        }
      }
    }
  }
  getGridColumns(keys) {
    return this.getColumns(keys, this.getGridColumn.bind(this));
  }
  getColumns(keys, columnLookupCallback) {
    const foundColumns = [];
    if (keys) {
      keys.forEach(key => {
        const column = columnLookupCallback(key);
        if (column) {
          foundColumns.push(column);
        }
      });
    }
    return foundColumns;
  }
  getColumnWithValidation(key) {
    if (key == null) {
      return null;
    }
    const column = this.getGridColumn(key);
    if (!column) {
      console.warn('ZING Grid: could not find column ' + key);
    }
    return column;
  }
  getPrimaryColumn(key) {
    if (!this.primaryColumns) {
      return null;
    }
    return this.getColumn(key, this.primaryColumns, this.primaryColumnsMap);
  }
  getGridColumn(key) {
    return this.getColumn(key, this.gridColumns, this.gridColumnsMap);
  }
  lookupGridColumn(key) {
    return this.gridColumnsMap[key];
  }
  getSecondaryColumn(key) {
    if (!this.secondaryColumns) {
      return null;
    }
    return this.getColumn(key, this.secondaryColumns, this.secondaryColumnsMap);
  }
  getColumn(key, columnList, columnMap) {
    if (!key || !columnMap) {
      return null;
    }
    if (typeof key == 'string' && columnMap[key]) {
      return columnMap[key];
    }
    for (let i = 0; i < columnList.length; i++) {
      if (this.columnsMatch(columnList[i], key)) {
        return columnList[i];
      }
    }
    return this.getAutoColumn(key);
  }
  getSourceColumnsForGroupColumn(groupCol) {
    const sourceColumnId = groupCol.getColDef().showRowGroup;
    if (!sourceColumnId) {
      return null;
    }
    if (sourceColumnId === true) {
      return this.rowGroupColumns.slice(0);
    }
    const column = this.getPrimaryColumn(sourceColumnId);
    return column ? [column] : null;
  }
  getAutoColumn(key) {
    if (!this.groupAutoColumns || !exists(this.groupAutoColumns) || missing(this.groupAutoColumns)) {
      return null;
    }
    return this.groupAutoColumns.find(groupCol => this.columnsMatch(groupCol, key)) || null;
  }
  columnsMatch(column, key) {
    const columnMatches = column === key;
    const colDefMatches = column.getColDef() === key;
    const idMatches = column.getColId() == key;
    return columnMatches || colDefMatches || idMatches;
  }
  getDisplayNameForColumn(column, location, includeAggFunc = false) {
    if (!column) {
      return null;
    }
    const headerName = this.getHeaderName(column.getColDef(), column, null, null, location);
    if (includeAggFunc) {
      return this.wrapHeaderNameWithAggFunc(column, headerName);
    }
    return headerName;
  }
  getDisplayNameForProvidedColumnGroup(columnGroup, providedColumnGroup, location) {
    const colGroupDef = providedColumnGroup ? providedColumnGroup.getColGroupDef() : null;
    if (colGroupDef) {
      return this.getHeaderName(colGroupDef, null, columnGroup, providedColumnGroup, location);
    }
    return null;
  }
  getDisplayNameForColumnGroup(columnGroup, location) {
    return this.getDisplayNameForProvidedColumnGroup(columnGroup, columnGroup.getProvidedColumnGroup(), location);
  }
  getHeaderName(colDef, column, columnGroup, providedColumnGroup, location) {
    const headerValueGetter = colDef.headerValueGetter;
    if (headerValueGetter) {
      const params = {
        colDef: colDef,
        column: column,
        columnGroup: columnGroup,
        providedColumnGroup: providedColumnGroup,
        location: location,
        api: this.gridOptionsService.api,
        columnApi: this.gridOptionsService.columnApi,
        context: this.gridOptionsService.context
      };
      if (typeof headerValueGetter === 'function') {
        return headerValueGetter(params);
      } else if (typeof headerValueGetter === 'string') {
        return this.expressionService.evaluate(headerValueGetter, params);
      }
      console.warn('ZING Grid: headerValueGetter must be a function or a string');
      return '';
    } else if (colDef.headerName != null) {
      return colDef.headerName;
    } else if (colDef.field) {
      return camelCaseToHumanText(colDef.field);
    }
    return '';
  }
  wrapHeaderNameWithAggFunc(column, headerName) {
    if (this.gridOptionsService.get('suppressAggFuncInHeader')) {
      return headerName;
    }
    const pivotValueColumn = column.getColDef().pivotValueColumn;
    const pivotActiveOnThisColumn = exists(pivotValueColumn);
    let aggFunc = null;
    let aggFuncFound;
    if (pivotActiveOnThisColumn) {
      const isCollapsedHeaderEnabled = this.gridOptionsService.get('removePivotHeaderRowWhenSingleValueColumn') && this.valueColumns.length === 1;
      const isTotalColumn = column.getColDef().pivotTotalColumnIds !== undefined;
      if (isCollapsedHeaderEnabled && !isTotalColumn) {
        return headerName;
      }
      aggFunc = pivotValueColumn ? pivotValueColumn.getAggFunc() : null;
      aggFuncFound = true;
    } else {
      const measureActive = column.isValueActive();
      const aggregationPresent = this.pivotMode || !this.isRowGroupEmpty();
      if (measureActive && aggregationPresent) {
        aggFunc = column.getAggFunc();
        aggFuncFound = true;
      } else {
        aggFuncFound = false;
      }
    }
    if (aggFuncFound) {
      const aggFuncString = typeof aggFunc === 'string' ? aggFunc : 'func';
      const localeTextFunc = this.localeService.getLocaleTextFunc();
      const aggFuncStringTranslated = localeTextFunc(aggFuncString, aggFuncString);
      return `${aggFuncStringTranslated}(${headerName})`;
    }
    return headerName;
  }
  getColumnGroup(colId, partId) {
    if (!colId) {
      return null;
    }
    if (colId instanceof ColumnGroup) {
      return colId;
    }
    const allColumnGroups = this.getAllDisplayedTrees();
    const checkPartId = typeof partId === 'number';
    let result = null;
    this.columnUtils.depthFirstAllColumnTreeSearch(allColumnGroups, child => {
      if (child instanceof ColumnGroup) {
        const columnGroup = child;
        let matched;
        if (checkPartId) {
          matched = colId === columnGroup.getGroupId() && partId === columnGroup.getPartId();
        } else {
          matched = colId === columnGroup.getGroupId();
        }
        if (matched) {
          result = columnGroup;
        }
      }
    });
    return result;
  }
  isReady() {
    return this.ready;
  }
  extractValueColumns(source, oldPrimaryColumns) {
    this.valueColumns = this.extractColumns(oldPrimaryColumns, this.valueColumns, (col, flag) => col.setValueActive(flag, source), () => undefined, () => undefined, colDef => {
      const aggFunc = colDef.aggFunc;
      if (aggFunc === null || aggFunc === '') {
        return null;
      }
      if (aggFunc === undefined) {
        return;
      }
      return !!aggFunc;
    }, colDef => {
      return colDef.initialAggFunc != null && colDef.initialAggFunc != '';
    });
    this.valueColumns.forEach(col => {
      const colDef = col.getColDef();
      if (colDef.aggFunc != null && colDef.aggFunc != '') {
        col.setAggFunc(colDef.aggFunc);
      } else {
        if (!col.getAggFunc()) {
          col.setAggFunc(colDef.initialAggFunc);
        }
      }
    });
  }
  extractRowGroupColumns(source, oldPrimaryColumns) {
    this.rowGroupColumns = this.extractColumns(oldPrimaryColumns, this.rowGroupColumns, (col, flag) => col.setRowGroupActive(flag, source), colDef => colDef.rowGroupIndex, colDef => colDef.initialRowGroupIndex, colDef => colDef.rowGroup, colDef => colDef.initialRowGroup);
  }
  extractColumns(oldPrimaryColumns = [], previousCols = [], setFlagFunc, getIndexFunc, getInitialIndexFunc, getValueFunc, getInitialValueFunc) {
    const colsWithIndex = [];
    const colsWithValue = [];
    (this.primaryColumns || []).forEach(col => {
      const colIsNew = oldPrimaryColumns.indexOf(col) < 0;
      const colDef = col.getColDef();
      const value = attrToBoolean(getValueFunc(colDef));
      const initialValue = attrToBoolean(getInitialValueFunc(colDef));
      const index = attrToNumber(getIndexFunc(colDef));
      const initialIndex = attrToNumber(getInitialIndexFunc(colDef));
      let include;
      const valuePresent = value !== undefined;
      const indexPresent = index !== undefined;
      const initialValuePresent = initialValue !== undefined;
      const initialIndexPresent = initialIndex !== undefined;
      if (valuePresent) {
        include = value;
      } else if (indexPresent) {
        if (index === null) {
          include = false;
        } else {
          include = index >= 0;
        }
      } else {
        if (colIsNew) {
          if (initialValuePresent) {
            include = initialValue;
          } else if (initialIndexPresent) {
            include = initialIndex != null && initialIndex >= 0;
          } else {
            include = false;
          }
        } else {
          include = previousCols.indexOf(col) >= 0;
        }
      }
      if (include) {
        const useIndex = colIsNew ? index != null || initialIndex != null : index != null;
        useIndex ? colsWithIndex.push(col) : colsWithValue.push(col);
      }
    });
    const getIndexForCol = col => {
      const index = getIndexFunc(col.getColDef());
      const defaultIndex = getInitialIndexFunc(col.getColDef());
      return index != null ? index : defaultIndex;
    };
    colsWithIndex.sort((colA, colB) => {
      const indexA = getIndexForCol(colA);
      const indexB = getIndexForCol(colB);
      if (indexA === indexB) {
        return 0;
      }
      if (indexA < indexB) {
        return -1;
      }
      return 1;
    });
    const res = [].concat(colsWithIndex);
    previousCols.forEach(col => {
      if (colsWithValue.indexOf(col) >= 0) {
        res.push(col);
      }
    });
    colsWithValue.forEach(col => {
      if (res.indexOf(col) < 0) {
        res.push(col);
      }
    });
    previousCols.forEach(col => {
      if (res.indexOf(col) < 0) {
        setFlagFunc(col, false);
      }
    });
    res.forEach(col => {
      if (previousCols.indexOf(col) < 0) {
        setFlagFunc(col, true);
      }
    });
    return res;
  }
  extractPivotColumns(source, oldPrimaryColumns) {
    this.pivotColumns = this.extractColumns(oldPrimaryColumns, this.pivotColumns, (col, flag) => col.setPivotActive(flag, source), colDef => colDef.pivotIndex, colDef => colDef.initialPivotIndex, colDef => colDef.pivot, colDef => colDef.initialPivot);
  }
  resetColumnGroupState(source = "api") {
    if (!this.primaryColumnTree) {
      return;
    }
    const stateItems = [];
    this.columnUtils.depthFirstOriginalTreeSearch(null, this.primaryColumnTree, child => {
      if (child instanceof ProvidedColumnGroup) {
        const colGroupDef = child.getColGroupDef();
        const groupState = {
          groupId: child.getGroupId(),
          open: !colGroupDef ? undefined : colGroupDef.openByDefault
        };
        stateItems.push(groupState);
      }
    });
    this.setColumnGroupState(stateItems, source);
  }
  getColumnGroupState() {
    const columnGroupState = [];
    this.columnUtils.depthFirstOriginalTreeSearch(null, this.gridBalancedTree, node => {
      if (node instanceof ProvidedColumnGroup) {
        columnGroupState.push({
          groupId: node.getGroupId(),
          open: node.isExpanded()
        });
      }
    });
    return columnGroupState;
  }
  setColumnGroupState(stateItems, source = "api") {
    if (!this.gridBalancedTree) {
      return;
    }
    this.columnAnimationService.start();
    const impactedGroups = [];
    stateItems.forEach(stateItem => {
      const groupKey = stateItem.groupId;
      const newValue = stateItem.open;
      const providedColumnGroup = this.getProvidedColumnGroup(groupKey);
      if (!providedColumnGroup) {
        return;
      }
      if (providedColumnGroup.isExpanded() === newValue) {
        return;
      }
      this.logger.log('columnGroupOpened(' + providedColumnGroup.getGroupId() + ',' + newValue + ')');
      providedColumnGroup.setExpanded(newValue);
      impactedGroups.push(providedColumnGroup);
    });
    this.updateGroupsAndDisplayedColumns(source);
    this.setFirstRightAndLastLeftPinned(source);
    if (impactedGroups.length) {
      const event = {
        type: Events.EVENT_COLUMN_GROUP_OPENED,
        columnGroup: ProvidedColumnGroup.length === 1 ? impactedGroups[0] : undefined,
        columnGroups: impactedGroups
      };
      this.eventService.dispatchEvent(event);
    }
    this.columnAnimationService.finish();
  }
  setColumnGroupOpened(key, newValue, source = "api") {
    let keyAsString;
    if (key instanceof ProvidedColumnGroup) {
      keyAsString = key.getId();
    } else {
      keyAsString = key || '';
    }
    this.setColumnGroupState([{
      groupId: keyAsString,
      open: newValue
    }], source);
  }
  getProvidedColumnGroup(key) {
    if (typeof key !== 'string') {
      console.error('ZING Grid: group key must be a string');
    }
    let res = null;
    this.columnUtils.depthFirstOriginalTreeSearch(null, this.gridBalancedTree, node => {
      if (node instanceof ProvidedColumnGroup) {
        if (node.getId() === key) {
          res = node;
        }
      }
    });
    return res;
  }
  calculateColumnsForDisplay() {
    let columnsForDisplay;
    if (this.pivotMode && missing(this.secondaryColumns)) {
      columnsForDisplay = this.gridColumns.filter(column => {
        const isAutoGroupCol = this.groupAutoColumns && includes(this.groupAutoColumns, column);
        const isValueCol = this.valueColumns && includes(this.valueColumns, column);
        return isAutoGroupCol || isValueCol;
      });
    } else {
      columnsForDisplay = this.gridColumns.filter(column => {
        const isAutoGroupCol = this.groupAutoColumns && includes(this.groupAutoColumns, column);
        return isAutoGroupCol || column.isVisible();
      });
    }
    return columnsForDisplay;
  }
  checkColSpanActiveInCols(columns) {
    let result = false;
    columns.forEach(col => {
      if (exists(col.getColDef().colSpan)) {
        result = true;
      }
    });
    return result;
  }
  calculateColumnsForGroupDisplay() {
    this.groupDisplayColumns = [];
    this.groupDisplayColumnsMap = {};
    const checkFunc = col => {
      const colDef = col.getColDef();
      const underlyingColumn = colDef.showRowGroup;
      if (colDef && exists(underlyingColumn)) {
        this.groupDisplayColumns.push(col);
        if (typeof underlyingColumn === 'string') {
          this.groupDisplayColumnsMap[underlyingColumn] = col;
        } else if (underlyingColumn === true) {
          this.getRowGroupColumns().forEach(rowGroupCol => {
            this.groupDisplayColumnsMap[rowGroupCol.getId()] = col;
          });
        }
      }
    };
    this.gridColumns.forEach(checkFunc);
  }
  getGroupDisplayColumns() {
    return this.groupDisplayColumns;
  }
  getGroupDisplayColumnForGroup(rowGroupColumnId) {
    return this.groupDisplayColumnsMap[rowGroupColumnId];
  }
  updateDisplayedColumns(source) {
    const columnsForDisplay = this.calculateColumnsForDisplay();
    this.buildDisplayedTrees(columnsForDisplay);
    this.updateGroupsAndDisplayedColumns(source);
    this.setFirstRightAndLastLeftPinned(source);
  }
  isSecondaryColumnsPresent() {
    return exists(this.secondaryColumns);
  }
  setSecondaryColumns(colDefs, source = "api") {
    if (!this.gridColumns) {
      return;
    }
    const newColsPresent = colDefs && colDefs.length > 0;
    if (!newColsPresent && missing(this.secondaryColumns)) {
      return;
    }
    if (newColsPresent) {
      this.processSecondaryColumnDefinitions(colDefs);
      const balancedTreeResult = this.columnFactory.createColumnTree(colDefs, false, this.secondaryBalancedTree || this.previousSecondaryColumns || undefined);
      this.destroyOldColumns(this.secondaryBalancedTree, balancedTreeResult.columnTree);
      this.secondaryBalancedTree = balancedTreeResult.columnTree;
      this.secondaryHeaderRowCount = balancedTreeResult.treeDept + 1;
      this.secondaryColumns = this.getColumnsFromTree(this.secondaryBalancedTree);
      this.secondaryColumnsMap = {};
      this.secondaryColumns.forEach(col => this.secondaryColumnsMap[col.getId()] = col);
      this.previousSecondaryColumns = null;
    } else {
      this.previousSecondaryColumns = this.secondaryBalancedTree;
      this.secondaryBalancedTree = null;
      this.secondaryHeaderRowCount = -1;
      this.secondaryColumns = null;
      this.secondaryColumnsMap = {};
    }
    this.updateGridColumns();
    this.updateDisplayedColumns(source);
  }
  processSecondaryColumnDefinitions(colDefs) {
    const columnCallback = this.gridOptionsService.get('processPivotResultColDef');
    const groupCallback = this.gridOptionsService.get('processPivotResultColGroupDef');
    if (!columnCallback && !groupCallback) {
      return undefined;
    }
    const searchForColDefs = colDefs2 => {
      colDefs2.forEach(abstractColDef => {
        const isGroup = exists(abstractColDef.children);
        if (isGroup) {
          const colGroupDef = abstractColDef;
          if (groupCallback) {
            groupCallback(colGroupDef);
          }
          searchForColDefs(colGroupDef.children);
        } else {
          const colDef = abstractColDef;
          if (columnCallback) {
            columnCallback(colDef);
          }
        }
      });
    };
    if (colDefs) {
      searchForColDefs(colDefs);
    }
  }
  updateGridColumns() {
    const prevGridCols = this.gridBalancedTree;
    if (this.gridColsArePrimary) {
      this.lastPrimaryOrder = this.gridColumns;
    } else {
      this.lastSecondaryOrder = this.gridColumns;
    }
    let sortOrderToRecover;
    if (this.secondaryColumns && this.secondaryBalancedTree) {
      const hasSameColumns = this.secondaryColumns.every(col => {
        return this.gridColumnsMap[col.getColId()] !== undefined;
      });
      this.gridBalancedTree = this.secondaryBalancedTree.slice();
      this.gridHeaderRowCount = this.secondaryHeaderRowCount;
      this.gridColumns = this.secondaryColumns.slice();
      this.gridColsArePrimary = false;
      if (hasSameColumns) {
        sortOrderToRecover = this.lastSecondaryOrder;
      }
    } else if (this.primaryColumns) {
      this.gridBalancedTree = this.primaryColumnTree.slice();
      this.gridHeaderRowCount = this.primaryHeaderRowCount;
      this.gridColumns = this.primaryColumns.slice();
      this.gridColsArePrimary = true;
      sortOrderToRecover = this.lastPrimaryOrder;
    }
    const areAutoColsChanged = this.createGroupAutoColumnsIfNeeded();
    if (areAutoColsChanged && sortOrderToRecover) {
      const groupAutoColsMap = convertToMap(this.groupAutoColumns.map(col => [col, true]));
      sortOrderToRecover = sortOrderToRecover.filter(col => !groupAutoColsMap.has(col));
      sortOrderToRecover = [...this.groupAutoColumns, ...sortOrderToRecover];
    }
    this.addAutoGroupToGridColumns();
    this.orderGridColsLike(sortOrderToRecover);
    this.gridColumns = this.placeLockedColumns(this.gridColumns);
    this.calculateColumnsForGroupDisplay();
    this.refreshQuickFilterColumns();
    this.clearDisplayedAndViewportColumns();
    this.colSpanActive = this.checkColSpanActiveInCols(this.gridColumns);
    this.gridColumnsMap = {};
    this.gridColumns.forEach(col => this.gridColumnsMap[col.getId()] = col);
    this.setAutoHeightActive();
    if (!areEqual(prevGridCols, this.gridBalancedTree)) {
      const event = {
        type: Events.EVENT_GRID_COLUMNS_CHANGED
      };
      this.eventService.dispatchEvent(event);
    }
  }
  setAutoHeightActive() {
    this.autoHeightActive = this.gridColumns.filter(col => col.isAutoHeight()).length > 0;
    if (this.autoHeightActive) {
      this.autoHeightActiveAtLeastOnce = true;
      const supportedRowModel = this.gridOptionsService.isRowModelType('clientSide') || this.gridOptionsService.isRowModelType('serverSide');
      if (!supportedRowModel) {
        warnOnce('autoHeight columns only work with Client Side Row Model and Server Side Row Model.');
      }
    }
  }
  orderGridColsLike(colsOrder) {
    if (missing(colsOrder)) {
      return;
    }
    const lastOrderMapped = convertToMap(colsOrder.map((col, index) => [col, index]));
    let noColsFound = true;
    this.gridColumns.forEach(col => {
      if (lastOrderMapped.has(col)) {
        noColsFound = false;
      }
    });
    if (noColsFound) {
      return;
    }
    const gridColsMap = convertToMap(this.gridColumns.map(col => [col, true]));
    const oldColsOrdered = colsOrder.filter(col => gridColsMap.has(col));
    const oldColsMap = convertToMap(oldColsOrdered.map(col => [col, true]));
    const newColsOrdered = this.gridColumns.filter(col => !oldColsMap.has(col));
    const newGridColumns = oldColsOrdered.slice();
    newColsOrdered.forEach(newCol => {
      let parent = newCol.getOriginalParent();
      if (!parent) {
        newGridColumns.push(newCol);
        return;
      }
      const siblings = [];
      while (!siblings.length && parent) {
        const leafCols = parent.getLeafColumns();
        leafCols.forEach(leafCol => {
          const presentInNewGriColumns = newGridColumns.indexOf(leafCol) >= 0;
          const noYetInSiblings = siblings.indexOf(leafCol) < 0;
          if (presentInNewGriColumns && noYetInSiblings) {
            siblings.push(leafCol);
          }
        });
        parent = parent.getOriginalParent();
      }
      if (!siblings.length) {
        newGridColumns.push(newCol);
        return;
      }
      const indexes = siblings.map(col => newGridColumns.indexOf(col));
      const lastIndex = Math.max(...indexes);
      insertIntoArray(newGridColumns, newCol, lastIndex + 1);
    });
    this.gridColumns = newGridColumns;
  }
  isPrimaryColumnGroupsPresent() {
    return this.primaryHeaderRowCount > 1;
  }
  refreshQuickFilterColumns() {
    var _a;
    let columnsForQuickFilter = (_a = this.isPivotMode() ? this.secondaryColumns : this.primaryColumns) !== null && _a !== void 0 ? _a : [];
    if (this.groupAutoColumns) {
      columnsForQuickFilter = columnsForQuickFilter.concat(this.groupAutoColumns);
    }
    this.columnsForQuickFilter = this.gridOptionsService.get('includeHiddenColumnsInQuickFilter') ? columnsForQuickFilter : columnsForQuickFilter.filter(col => col.isVisible() || col.isRowGroupActive());
  }
  placeLockedColumns(cols) {
    const left = [];
    const normal = [];
    const right = [];
    cols.forEach(col => {
      const position = col.getColDef().lockPosition;
      if (position === 'right') {
        right.push(col);
      } else if (position === 'left' || position === true) {
        left.push(col);
      } else {
        normal.push(col);
      }
    });
    return [...left, ...normal, ...right];
  }
  addAutoGroupToGridColumns() {
    if (missing(this.groupAutoColumns)) {
      this.destroyOldColumns(this.groupAutoColsBalancedTree);
      this.groupAutoColsBalancedTree = null;
      return;
    }
    this.gridColumns = this.groupAutoColumns ? this.groupAutoColumns.concat(this.gridColumns) : this.gridColumns;
    const newAutoColsTree = this.columnFactory.createForAutoGroups(this.groupAutoColumns, this.gridBalancedTree);
    this.destroyOldColumns(this.groupAutoColsBalancedTree, newAutoColsTree);
    this.groupAutoColsBalancedTree = newAutoColsTree;
    this.gridBalancedTree = newAutoColsTree.concat(this.gridBalancedTree);
  }
  clearDisplayedAndViewportColumns() {
    this.viewportRowLeft = {};
    this.viewportRowRight = {};
    this.viewportRowCenter = {};
    this.displayedColumnsLeft = [];
    this.displayedColumnsRight = [];
    this.displayedColumnsCenter = [];
    this.displayedColumns = [];
    this.viewportColumns = [];
    this.headerViewportColumns = [];
    this.viewportColumnsHash = '';
  }
  updateGroupsAndDisplayedColumns(source) {
    this.updateOpenClosedVisibilityInColumnGroups();
    this.deriveDisplayedColumns(source);
    this.refreshFlexedColumns();
    this.extractViewport();
    this.updateBodyWidths();
    const event = {
      type: Events.EVENT_DISPLAYED_COLUMNS_CHANGED
    };
    this.eventService.dispatchEvent(event);
  }
  deriveDisplayedColumns(source) {
    this.derivedDisplayedColumnsFromDisplayedTree(this.displayedTreeLeft, this.displayedColumnsLeft);
    this.derivedDisplayedColumnsFromDisplayedTree(this.displayedTreeCentre, this.displayedColumnsCenter);
    this.derivedDisplayedColumnsFromDisplayedTree(this.displayedTreeRight, this.displayedColumnsRight);
    this.joinDisplayedColumns();
    this.setLeftValues(source);
    this.displayedAutoHeightCols = this.displayedColumns.filter(col => col.isAutoHeight());
  }
  isAutoRowHeightActive() {
    return this.autoHeightActive;
  }
  wasAutoRowHeightEverActive() {
    return this.autoHeightActiveAtLeastOnce;
  }
  joinDisplayedColumns() {
    if (this.gridOptionsService.get('enableRtl')) {
      this.displayedColumns = this.displayedColumnsRight.concat(this.displayedColumnsCenter).concat(this.displayedColumnsLeft);
    } else {
      this.displayedColumns = this.displayedColumnsLeft.concat(this.displayedColumnsCenter).concat(this.displayedColumnsRight);
    }
  }
  setLeftValues(source) {
    this.setLeftValuesOfColumns(source);
    this.setLeftValuesOfGroups();
  }
  setLeftValuesOfColumns(source) {
    if (!this.primaryColumns) {
      return;
    }
    const allColumns = this.primaryColumns.slice(0);
    const doingRtl = this.gridOptionsService.get('enableRtl');
    [this.displayedColumnsLeft, this.displayedColumnsRight, this.displayedColumnsCenter].forEach(columns => {
      if (doingRtl) {
        let left = this.getWidthOfColsInList(columns);
        columns.forEach(column => {
          left -= column.getActualWidth();
          column.setLeft(left, source);
        });
      } else {
        let left = 0;
        columns.forEach(column => {
          column.setLeft(left, source);
          left += column.getActualWidth();
        });
      }
      removeAllFromUnorderedArray(allColumns, columns);
    });
    allColumns.forEach(column => {
      column.setLeft(null, source);
    });
  }
  setLeftValuesOfGroups() {
    [this.displayedTreeLeft, this.displayedTreeRight, this.displayedTreeCentre].forEach(columns => {
      columns.forEach(column => {
        if (column instanceof ColumnGroup) {
          const columnGroup = column;
          columnGroup.checkLeft();
        }
      });
    });
  }
  derivedDisplayedColumnsFromDisplayedTree(tree, columns) {
    columns.length = 0;
    this.columnUtils.depthFirstDisplayedColumnTreeSearch(tree, child => {
      if (child instanceof Column) {
        columns.push(child);
      }
    });
  }
  extractViewportColumns() {
    if (this.suppressColumnVirtualisation) {
      this.viewportColumnsCenter = this.displayedColumnsCenter;
      this.headerViewportColumnsCenter = this.displayedColumnsCenter;
    } else {
      this.viewportColumnsCenter = this.displayedColumnsCenter.filter(this.isColumnInRowViewport.bind(this));
      this.headerViewportColumnsCenter = this.displayedColumnsCenter.filter(this.isColumnInHeaderViewport.bind(this));
    }
    this.viewportColumns = this.viewportColumnsCenter.concat(this.displayedColumnsLeft).concat(this.displayedColumnsRight);
    this.headerViewportColumns = this.headerViewportColumnsCenter.concat(this.displayedColumnsLeft).concat(this.displayedColumnsRight);
  }
  getVirtualHeaderGroupRow(type, dept) {
    let result;
    switch (type) {
      case 'left':
        result = this.viewportRowLeft[dept];
        break;
      case 'right':
        result = this.viewportRowRight[dept];
        break;
      default:
        result = this.viewportRowCenter[dept];
        break;
    }
    if (missing(result)) {
      result = [];
    }
    return result;
  }
  calculateHeaderRows() {
    this.viewportRowLeft = {};
    this.viewportRowRight = {};
    this.viewportRowCenter = {};
    const virtualColIds = {};
    this.headerViewportColumns.forEach(col => virtualColIds[col.getId()] = true);
    const testGroup = (children, result, dept) => {
      let returnValue = false;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        let addThisItem = false;
        if (child instanceof Column) {
          addThisItem = virtualColIds[child.getId()] === true;
        } else {
          const columnGroup = child;
          const displayedChildren = columnGroup.getDisplayedChildren();
          if (displayedChildren) {
            addThisItem = testGroup(displayedChildren, result, dept + 1);
          }
        }
        if (addThisItem) {
          returnValue = true;
          if (!result[dept]) {
            result[dept] = [];
          }
          result[dept].push(child);
        }
      }
      return returnValue;
    };
    testGroup(this.displayedTreeLeft, this.viewportRowLeft, 0);
    testGroup(this.displayedTreeRight, this.viewportRowRight, 0);
    testGroup(this.displayedTreeCentre, this.viewportRowCenter, 0);
  }
  extractViewport() {
    const hashColumn = c => `${c.getId()}-${c.getPinned() || 'normal'}`;
    this.extractViewportColumns();
    const newHash = this.viewportColumns.map(hashColumn).join('#');
    const changed = this.viewportColumnsHash !== newHash;
    if (changed) {
      this.viewportColumnsHash = newHash;
      this.calculateHeaderRows();
    }
    return changed;
  }
  refreshFlexedColumns(params = {}) {
    var _a;
    const source = params.source ? params.source : 'flex';
    if (params.viewportWidth != null) {
      this.flexViewportWidth = params.viewportWidth;
    }
    if (!this.flexViewportWidth) {
      return [];
    }
    let flexAfterDisplayIndex = -1;
    if (params.resizingCols) {
      const allResizingCols = new Set(params.resizingCols);
      let displayedCols = this.displayedColumnsCenter;
      for (let i = displayedCols.length - 1; i >= 0; i--) {
        if (allResizingCols.has(displayedCols[i])) {
          flexAfterDisplayIndex = i;
          break;
        }
      }
    }
    let knownColumnsWidth = 0;
    let flexingColumns = [];
    let minimumFlexedWidth = 0;
    let totalFlex = 0;
    for (let i = 0; i < this.displayedColumnsCenter.length; i++) {
      const isFlex = this.displayedColumnsCenter[i].getFlex() && i > flexAfterDisplayIndex;
      if (isFlex) {
        flexingColumns.push(this.displayedColumnsCenter[i]);
        totalFlex += this.displayedColumnsCenter[i].getFlex();
        minimumFlexedWidth += (_a = this.displayedColumnsCenter[i].getMinWidth()) !== null && _a !== void 0 ? _a : 0;
      } else {
        knownColumnsWidth += this.displayedColumnsCenter[i].getActualWidth();
      }
    }
    ;
    if (!flexingColumns.length) {
      return [];
    }
    let changedColumns = [];
    if (knownColumnsWidth + minimumFlexedWidth > this.flexViewportWidth) {
      flexingColumns.forEach(col => {
        var _a;
        return col.setActualWidth((_a = col.getMinWidth()) !== null && _a !== void 0 ? _a : 0, source);
      });
      changedColumns = flexingColumns;
      flexingColumns = [];
    }
    const flexingColumnSizes = [];
    let spaceForFlexingColumns;
    outer: while (true) {
      spaceForFlexingColumns = this.flexViewportWidth - knownColumnsWidth;
      const spacePerFlex = spaceForFlexingColumns / totalFlex;
      for (let i = 0; i < flexingColumns.length; i++) {
        const col = flexingColumns[i];
        const widthByFlexRule = spacePerFlex * col.getFlex();
        let constrainedWidth = 0;
        const minWidth = col.getMinWidth();
        const maxWidth = col.getMaxWidth();
        if (exists(minWidth) && widthByFlexRule < minWidth) {
          constrainedWidth = minWidth;
        } else if (exists(maxWidth) && widthByFlexRule > maxWidth) {
          constrainedWidth = maxWidth;
        }
        if (constrainedWidth) {
          col.setActualWidth(constrainedWidth, source);
          removeFromUnorderedArray(flexingColumns, col);
          totalFlex -= col.getFlex();
          changedColumns.push(col);
          knownColumnsWidth += col.getActualWidth();
          continue outer;
        }
        flexingColumnSizes[i] = Math.round(widthByFlexRule);
      }
      break;
    }
    let remainingSpace = spaceForFlexingColumns;
    flexingColumns.forEach((col, i) => {
      col.setActualWidth(Math.min(flexingColumnSizes[i], remainingSpace), source);
      changedColumns.push(col);
      remainingSpace -= flexingColumnSizes[i];
    });
    if (!params.skipSetLeft) {
      this.setLeftValues(source);
    }
    if (params.updateBodyWidths) {
      this.updateBodyWidths();
    }
    if (params.fireResizedEvent) {
      this.dispatchColumnResizedEvent(changedColumns, true, source, flexingColumns);
    }
    return flexingColumns;
  }
  sizeColumnsToFit(gridWidth, source = "sizeColumnsToFit", silent, params) {
    var _a, _b, _c, _d, _e;
    if (this.shouldQueueResizeOperations) {
      this.resizeOperationQueue.push(() => this.sizeColumnsToFit(gridWidth, source, silent, params));
      return;
    }
    const limitsMap = {};
    if (params) {
      (_a = params === null || params === void 0 ? void 0 : params.columnLimits) === null || _a === void 0 ? void 0 : _a.forEach(_a => {
        var {
            key
          } = _a,
          dimensions = __rest(_a, ["key"]);
        limitsMap[typeof key === 'string' ? key : key.getColId()] = dimensions;
      });
    }
    const allDisplayedColumns = this.getAllDisplayedColumns();
    const doColumnsAlreadyFit = gridWidth === this.getWidthOfColsInList(allDisplayedColumns);
    if (gridWidth <= 0 || !allDisplayedColumns.length || doColumnsAlreadyFit) {
      return;
    }
    const colsToSpread = [];
    const colsToNotSpread = [];
    allDisplayedColumns.forEach(column => {
      if (column.getColDef().suppressSizeToFit === true) {
        colsToNotSpread.push(column);
      } else {
        colsToSpread.push(column);
      }
    });
    const colsToDispatchEventFor = colsToSpread.slice(0);
    let finishedResizing = false;
    const moveToNotSpread = column => {
      removeFromArray(colsToSpread, column);
      colsToNotSpread.push(column);
    };
    colsToSpread.forEach(column => {
      var _a, _b;
      column.resetActualWidth(source);
      const widthOverride = limitsMap === null || limitsMap === void 0 ? void 0 : limitsMap[column.getId()];
      const minOverride = (_a = widthOverride === null || widthOverride === void 0 ? void 0 : widthOverride.minWidth) !== null && _a !== void 0 ? _a : params === null || params === void 0 ? void 0 : params.defaultMinWidth;
      const maxOverride = (_b = widthOverride === null || widthOverride === void 0 ? void 0 : widthOverride.maxWidth) !== null && _b !== void 0 ? _b : params === null || params === void 0 ? void 0 : params.defaultMaxWidth;
      const colWidth = column.getActualWidth();
      if (typeof minOverride === 'number' && colWidth < minOverride) {
        column.setActualWidth(minOverride, source, true);
      } else if (typeof maxOverride === 'number' && colWidth > maxOverride) {
        column.setActualWidth(maxOverride, source, true);
      }
    });
    while (!finishedResizing) {
      finishedResizing = true;
      const availablePixels = gridWidth - this.getWidthOfColsInList(colsToNotSpread);
      if (availablePixels <= 0) {
        colsToSpread.forEach(column => {
          var _a, _b;
          const widthOverride = (_b = (_a = limitsMap === null || limitsMap === void 0 ? void 0 : limitsMap[column.getId()]) === null || _a === void 0 ? void 0 : _a.minWidth) !== null && _b !== void 0 ? _b : params === null || params === void 0 ? void 0 : params.defaultMinWidth;
          if (typeof widthOverride === 'number') {
            column.setActualWidth(widthOverride, source, true);
            return;
          }
          column.setMinimum(source);
        });
      } else {
        const scale = availablePixels / this.getWidthOfColsInList(colsToSpread);
        let pixelsForLastCol = availablePixels;
        for (let i = colsToSpread.length - 1; i >= 0; i--) {
          const column = colsToSpread[i];
          const widthOverride = limitsMap === null || limitsMap === void 0 ? void 0 : limitsMap[column.getId()];
          const minOverride = (_b = widthOverride === null || widthOverride === void 0 ? void 0 : widthOverride.minWidth) !== null && _b !== void 0 ? _b : params === null || params === void 0 ? void 0 : params.defaultMinWidth;
          const maxOverride = (_c = widthOverride === null || widthOverride === void 0 ? void 0 : widthOverride.maxWidth) !== null && _c !== void 0 ? _c : params === null || params === void 0 ? void 0 : params.defaultMaxWidth;
          const colMinWidth = (_d = column.getMinWidth()) !== null && _d !== void 0 ? _d : 0;
          const colMaxWidth = (_e = column.getMaxWidth()) !== null && _e !== void 0 ? _e : Number.MAX_VALUE;
          const minWidth = typeof minOverride === 'number' && minOverride > colMinWidth ? minOverride : column.getMinWidth();
          const maxWidth = typeof maxOverride === 'number' && maxOverride < colMaxWidth ? maxOverride : column.getMaxWidth();
          let newWidth = Math.round(column.getActualWidth() * scale);
          if (exists(minWidth) && newWidth < minWidth) {
            newWidth = minWidth;
            moveToNotSpread(column);
            finishedResizing = false;
          } else if (exists(maxWidth) && newWidth > maxWidth) {
            newWidth = maxWidth;
            moveToNotSpread(column);
            finishedResizing = false;
          } else if (i === 0) {
            newWidth = pixelsForLastCol;
          }
          column.setActualWidth(newWidth, source, true);
          pixelsForLastCol -= newWidth;
        }
      }
    }
    colsToDispatchEventFor.forEach(col => {
      col.fireColumnWidthChangedEvent(source);
    });
    this.setLeftValues(source);
    this.updateBodyWidths();
    if (silent) {
      return;
    }
    this.dispatchColumnResizedEvent(colsToDispatchEventFor, true, source);
  }
  buildDisplayedTrees(visibleColumns) {
    const leftVisibleColumns = [];
    const rightVisibleColumns = [];
    const centerVisibleColumns = [];
    visibleColumns.forEach(column => {
      switch (column.getPinned()) {
        case "left":
          leftVisibleColumns.push(column);
          break;
        case "right":
          rightVisibleColumns.push(column);
          break;
        default:
          centerVisibleColumns.push(column);
          break;
      }
    });
    const groupInstanceIdCreator = new GroupInstanceIdCreator();
    this.displayedTreeLeft = this.displayedGroupCreator.createDisplayedGroups(leftVisibleColumns, groupInstanceIdCreator, 'left', this.displayedTreeLeft);
    this.displayedTreeRight = this.displayedGroupCreator.createDisplayedGroups(rightVisibleColumns, groupInstanceIdCreator, 'right', this.displayedTreeRight);
    this.displayedTreeCentre = this.displayedGroupCreator.createDisplayedGroups(centerVisibleColumns, groupInstanceIdCreator, null, this.displayedTreeCentre);
    this.updateDisplayedMap();
  }
  updateDisplayedMap() {
    this.displayedColumnsAndGroupsMap = {};
    const func = child => {
      this.displayedColumnsAndGroupsMap[child.getUniqueId()] = child;
    };
    this.columnUtils.depthFirstAllColumnTreeSearch(this.displayedTreeCentre, func);
    this.columnUtils.depthFirstAllColumnTreeSearch(this.displayedTreeLeft, func);
    this.columnUtils.depthFirstAllColumnTreeSearch(this.displayedTreeRight, func);
  }
  isDisplayed(item) {
    const fromMap = this.displayedColumnsAndGroupsMap[item.getUniqueId()];
    return fromMap === item;
  }
  updateOpenClosedVisibilityInColumnGroups() {
    const allColumnGroups = this.getAllDisplayedTrees();
    this.columnUtils.depthFirstAllColumnTreeSearch(allColumnGroups, child => {
      if (child instanceof ColumnGroup) {
        child.calculateDisplayedColumns();
      }
    });
  }
  getGroupAutoColumns() {
    return this.groupAutoColumns;
  }
  createGroupAutoColumnsIfNeeded() {
    const forceRecreateAutoGroups = this.forceRecreateAutoGroups;
    this.forceRecreateAutoGroups = false;
    if (!this.autoGroupsNeedBuilding) {
      return false;
    }
    this.autoGroupsNeedBuilding = false;
    const groupFullWidthRow = this.gridOptionsService.isGroupUseEntireRow(this.pivotMode);
    const suppressAutoColumn = this.pivotMode ? this.gridOptionsService.get('pivotSuppressAutoColumn') : this.isGroupSuppressAutoColumn();
    const groupingActive = this.rowGroupColumns.length > 0 || this.gridOptionsService.get('treeData');
    const needAutoColumns = groupingActive && !suppressAutoColumn && !groupFullWidthRow;
    if (needAutoColumns) {
      const newAutoGroupCols = this.autoGroupColService.createAutoGroupColumns(this.rowGroupColumns);
      const autoColsDifferent = !this.autoColsEqual(newAutoGroupCols, this.groupAutoColumns);
      if (autoColsDifferent || forceRecreateAutoGroups) {
        this.groupAutoColumns = newAutoGroupCols;
        return true;
      }
    } else {
      this.groupAutoColumns = null;
    }
    return false;
  }
  isGroupSuppressAutoColumn() {
    const groupDisplayType = this.gridOptionsService.get('groupDisplayType');
    const isCustomRowGroups = groupDisplayType === 'custom';
    if (isCustomRowGroups) {
      return true;
    }
    const treeDataDisplayType = this.gridOptionsService.get('treeDataDisplayType');
    return treeDataDisplayType === 'custom';
  }
  autoColsEqual(colsA, colsB) {
    return areEqual(colsA, colsB, (a, b) => a.getColId() === b.getColId());
  }
  getWidthOfColsInList(columnList) {
    return columnList.reduce((width, col) => width + col.getActualWidth(), 0);
  }
  getFirstDisplayedColumn() {
    const isRtl = this.gridOptionsService.get('enableRtl');
    const queryOrder = ['getDisplayedLeftColumns', 'getDisplayedCenterColumns', 'getDisplayedRightColumns'];
    if (isRtl) {
      queryOrder.reverse();
    }
    for (let i = 0; i < queryOrder.length; i++) {
      const container = this[queryOrder[i]]();
      if (container.length) {
        return isRtl ? last(container) : container[0];
      }
    }
    return null;
  }
  setColumnHeaderHeight(col, height) {
    const changed = col.setAutoHeaderHeight(height);
    if (changed) {
      const event = {
        type: Events.EVENT_COLUMN_HEADER_HEIGHT_CHANGED,
        column: col,
        columns: [col],
        source: 'autosizeColumnHeaderHeight'
      };
      this.eventService.dispatchEvent(event);
    }
  }
  getColumnGroupHeaderRowHeight() {
    if (this.isPivotMode()) {
      return this.getPivotGroupHeaderHeight();
    }
    return this.getGroupHeaderHeight();
  }
  getColumnHeaderRowHeight() {
    const defaultHeight = this.isPivotMode() ? this.getPivotHeaderHeight() : this.getHeaderHeight();
    const displayedHeights = this.getAllDisplayedColumns().filter(col => col.isAutoHeaderHeight()).map(col => col.getAutoHeaderHeight() || 0);
    return Math.max(defaultHeight, ...displayedHeights);
  }
  getHeaderHeight() {
    var _a;
    return (_a = this.gridOptionsService.get('headerHeight')) !== null && _a !== void 0 ? _a : this.environment.getFromTheme(25, 'headerHeight');
  }
  getFloatingFiltersHeight() {
    var _a;
    return (_a = this.gridOptionsService.get('floatingFiltersHeight')) !== null && _a !== void 0 ? _a : this.getHeaderHeight();
  }
  getGroupHeaderHeight() {
    var _a;
    return (_a = this.gridOptionsService.get('groupHeaderHeight')) !== null && _a !== void 0 ? _a : this.getHeaderHeight();
  }
  getPivotHeaderHeight() {
    var _a;
    return (_a = this.gridOptionsService.get('pivotHeaderHeight')) !== null && _a !== void 0 ? _a : this.getHeaderHeight();
  }
  getPivotGroupHeaderHeight() {
    var _a;
    return (_a = this.gridOptionsService.get('pivotGroupHeaderHeight')) !== null && _a !== void 0 ? _a : this.getGroupHeaderHeight();
  }
  queueResizeOperations() {
    this.shouldQueueResizeOperations = true;
  }
  processResizeOperations() {
    this.shouldQueueResizeOperations = false;
    this.resizeOperationQueue.forEach(resizeOperation => resizeOperation());
    this.resizeOperationQueue = [];
  }
  resetColumnDefIntoColumn(column, source) {
    const userColDef = column.getUserProvidedColDef();
    if (!userColDef) {
      return false;
    }
    const newColDef = this.columnFactory.addColumnDefaultAndTypes(userColDef, column.getColId());
    column.setColDef(newColDef, userColDef, source);
    return true;
  }
  isColumnGroupingLocked(column) {
    const groupLockGroupColumns = this.gridOptionsService.get('groupLockGroupColumns');
    if (!column.isRowGroupActive() || groupLockGroupColumns === 0) {
      return false;
    }
    if (groupLockGroupColumns === -1) {
      return true;
    }
    const colIndex = this.rowGroupColumns.findIndex(groupCol => groupCol.getColId() === column.getColId());
    return groupLockGroupColumns > colIndex;
  }
  generateColumnStateForRowGroupAndPivotIndexes(updatedRowGroupColumnState, updatedPivotColumnState) {
    let existingColumnStateUpdates = {};
    const orderColumns = (updatedColumnState, colList, enableProp, initialEnableProp, indexProp, initialIndexProp) => {
      if (!colList.length || !this.primaryColumns) {
        return [];
      }
      const updatedColIdArray = Object.keys(updatedColumnState);
      const updatedColIds = new Set(updatedColIdArray);
      const newColIds = new Set(updatedColIdArray);
      const allColIds = new Set(colList.map(column => {
        const colId = column.getColId();
        newColIds.delete(colId);
        return colId;
      }).concat(updatedColIdArray));
      const colIdsInOriginalOrder = [];
      const originalOrderMap = {};
      let orderIndex = 0;
      for (let i = 0; i < this.primaryColumns.length; i++) {
        const colId = this.primaryColumns[i].getColId();
        if (allColIds.has(colId)) {
          colIdsInOriginalOrder.push(colId);
          originalOrderMap[colId] = orderIndex++;
        }
      }
      let index = 1000;
      let hasAddedNewCols = false;
      let lastIndex = 0;
      const processPrecedingNewCols = colId => {
        const originalOrderIndex = originalOrderMap[colId];
        for (let i = lastIndex; i < originalOrderIndex; i++) {
          const newColId = colIdsInOriginalOrder[i];
          if (newColIds.has(newColId)) {
            updatedColumnState[newColId][indexProp] = index++;
            newColIds.delete(newColId);
          }
        }
        lastIndex = originalOrderIndex;
      };
      colList.forEach(column => {
        const colId = column.getColId();
        if (updatedColIds.has(colId)) {
          processPrecedingNewCols(colId);
          updatedColumnState[colId][indexProp] = index++;
        } else {
          const colDef = column.getColDef();
          const missingIndex = colDef[indexProp] === null || colDef[indexProp] === undefined && colDef[initialIndexProp] == null;
          if (missingIndex) {
            if (!hasAddedNewCols) {
              const propEnabled = colDef[enableProp] || colDef[enableProp] === undefined && colDef[initialEnableProp];
              if (propEnabled) {
                processPrecedingNewCols(colId);
              } else {
                newColIds.forEach(newColId => {
                  updatedColumnState[newColId][indexProp] = index + originalOrderMap[newColId];
                });
                index += colIdsInOriginalOrder.length;
                hasAddedNewCols = true;
              }
            }
            if (!existingColumnStateUpdates[colId]) {
              existingColumnStateUpdates[colId] = {
                colId
              };
            }
            existingColumnStateUpdates[colId][indexProp] = index++;
          }
        }
      });
    };
    orderColumns(updatedRowGroupColumnState, this.rowGroupColumns, 'rowGroup', 'initialRowGroup', 'rowGroupIndex', 'initialRowGroupIndex');
    orderColumns(updatedPivotColumnState, this.pivotColumns, 'pivot', 'initialPivot', 'pivotIndex', 'initialPivotIndex');
    return Object.values(existingColumnStateUpdates);
  }
  onColumnsReady() {
    const autoSizeStrategy = this.gridOptionsService.get('autoSizeStrategy');
    if (!autoSizeStrategy) {
      return;
    }
    const {
      type
    } = autoSizeStrategy;
    setTimeout(() => {
      if (type === 'fitGridWidth') {
        const {
          columnLimits: propColumnLimits,
          defaultMinWidth,
          defaultMaxWidth
        } = autoSizeStrategy;
        const columnLimits = propColumnLimits === null || propColumnLimits === void 0 ? void 0 : propColumnLimits.map(({
          colId: key,
          minWidth,
          maxWidth
        }) => ({
          key,
          minWidth,
          maxWidth
        }));
        this.ctrlsService.getGridBodyCtrl().sizeColumnsToFit({
          defaultMinWidth,
          defaultMaxWidth,
          columnLimits
        });
      } else if (type === 'fitProvidedWidth') {
        this.sizeColumnsToFit(autoSizeStrategy.width, 'sizeColumnsToFit');
      }
    });
  }
  onFirstDataRendered() {
    const autoSizeStrategy = this.gridOptionsService.get('autoSizeStrategy');
    if ((autoSizeStrategy === null || autoSizeStrategy === void 0 ? void 0 : autoSizeStrategy.type) !== 'fitCellContents') {
      return;
    }
    const {
      colIds: columns,
      skipHeader
    } = autoSizeStrategy;
    setTimeout(() => {
      if (columns) {
        this.autoSizeColumns({
          columns,
          skipHeader,
          source: 'autosizeColumns'
        });
      } else {
        this.autoSizeAllColumns(skipHeader, 'autosizeColumns');
      }
    });
  }
};
__decorate([Autowired('expressionService')], ColumnModel.prototype, "expressionService", void 0);
__decorate([Autowired('columnFactory')], ColumnModel.prototype, "columnFactory", void 0);
__decorate([Autowired('displayedGroupCreator')], ColumnModel.prototype, "displayedGroupCreator", void 0);
__decorate([Autowired('ctrlsService')], ColumnModel.prototype, "ctrlsService", void 0);
__decorate([Autowired('autoWidthCalculator')], ColumnModel.prototype, "autoWidthCalculator", void 0);
__decorate([Autowired('columnUtils')], ColumnModel.prototype, "columnUtils", void 0);
__decorate([Autowired('columnAnimationService')], ColumnModel.prototype, "columnAnimationService", void 0);
__decorate([Autowired('autoGroupColService')], ColumnModel.prototype, "autoGroupColService", void 0);
__decorate([Optional('aggFuncService')], ColumnModel.prototype, "aggFuncService", void 0);
__decorate([Optional('valueCache')], ColumnModel.prototype, "valueCache", void 0);
__decorate([Optional('animationFrameService')], ColumnModel.prototype, "animationFrameService", void 0);
__decorate([Autowired('sortController')], ColumnModel.prototype, "sortController", void 0);
__decorate([Autowired('columnDefFactory')], ColumnModel.prototype, "columnDefFactory", void 0);
__decorate([PostConstruct], ColumnModel.prototype, "init", null);
__decorate([PreDestroy], ColumnModel.prototype, "destroyColumns", null);
__decorate([__param(0, Qualifier('loggerFactory'))], ColumnModel.prototype, "setBeans", null);
ColumnModel = __decorate([Bean('columnModel')], ColumnModel);
export { ColumnModel };