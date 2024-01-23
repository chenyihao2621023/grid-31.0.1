var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, Bean, BeanStub, Events, NumberSequence, PostConstruct, PreDestroy, RowNode, Optional } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { FullStore } from "./stores/fullStore";
import { LazyStore } from "./stores/lazy/lazyStore";
let ServerSideRowModel = class ServerSideRowModel extends BeanStub {
  constructor() {
    super(...arguments);
    this.onRowHeightChanged_debounced = _.debounce(this.onRowHeightChanged.bind(this), 100);
    this.pauseStoreUpdateListening = false;
    this.started = false;
    this.managingPivotResultColumns = false;
  }
  ensureRowHeightsValid() {
    return false;
  }
  start() {
    this.started = true;
    this.updateDatasource();
  }
  destroyDatasource() {
    if (!this.datasource) {
      return;
    }
    if (this.datasource.destroy) {
      this.datasource.destroy();
    }
    this.rowRenderer.datasourceChanged();
    this.datasource = undefined;
  }
  addEventListeners() {
    this.addManagedListener(this.eventService, Events.EVENT_NEW_COLUMNS_LOADED, this.onColumnEverything.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_STORE_UPDATED, this.onStoreUpdated.bind(this));
    const resetListener = this.resetRootStore.bind(this);
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_VALUE_CHANGED, resetListener);
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PIVOT_CHANGED, resetListener);
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_ROW_GROUP_CHANGED, resetListener);
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PIVOT_MODE_CHANGED, resetListener);
    this.addManagedPropertyListeners(['masterDetail', 'treeData', 'removePivotHeaderRowWhenSingleValueColumn', 'suppressServerSideInfiniteScroll', 'cacheBlockSize'], resetListener);
    this.addManagedPropertyListener('rowHeight', () => this.resetRowHeights());
    this.verifyProps();
    this.addManagedPropertyListener('serverSideDatasource', () => this.updateDatasource());
  }
  updateDatasource() {
    const datasource = this.gridOptionsService.get('serverSideDatasource');
    if (datasource) {
      this.setDatasource(datasource);
    }
  }
  verifyProps() {
    if (this.gridOptionsService.exists('initialGroupOrderComparator')) {
      _.warnOnce(`initialGroupOrderComparator cannot be used with Server Side Row Model.`);
    }
    if (this.gridOptionsService.isRowSelection() && !this.gridOptionsService.exists('getRowId')) {
      _.warnOnce(`getRowId callback must be provided for Server Side Row Model selection to work correctly.`);
    }
  }
  setDatasource(datasource) {
    if (!this.started) {
      return;
    }
    this.destroyDatasource();
    this.datasource = datasource;
    this.resetRootStore();
  }
  applyRowData(rowDataParams, startRow, route) {
    const rootStore = this.getRootStore();
    if (!rootStore) {
      return;
    }
    const storeToExecuteOn = rootStore.getChildStore(route);
    if (!storeToExecuteOn) {
      return;
    }
    ;
    if (storeToExecuteOn instanceof LazyStore) {
      storeToExecuteOn.applyRowData(rowDataParams, startRow, rowDataParams.rowData.length);
    } else if (storeToExecuteOn instanceof FullStore) {
      storeToExecuteOn.processServerResult(rowDataParams);
    }
  }
  isLastRowIndexKnown() {
    const cache = this.getRootStore();
    if (!cache) {
      return false;
    }
    return cache.isLastRowIndexKnown();
  }
  onColumnEverything() {
    if (!this.storeParams) {
      this.resetRootStore();
      return;
    }
    const rowGroupColumnVos = this.columnsToValueObjects(this.columnModel.getRowGroupColumns());
    const valueColumnVos = this.columnsToValueObjects(this.columnModel.getValueColumns());
    const pivotColumnVos = this.columnsToValueObjects(this.columnModel.getPivotColumns());
    const areColsSame = params => {
      const oldColsMap = {};
      params.oldCols.forEach(col => oldColsMap[col.id] = col);
      const allColsUnchanged = params.newCols.every(col => {
        const equivalentCol = oldColsMap[col.id];
        if (equivalentCol) {
          delete oldColsMap[col.id];
        }
        return equivalentCol && equivalentCol.field === col.field && equivalentCol.aggFunc === col.aggFunc;
      });
      const missingCols = !params.allowRemovedColumns && !!Object.values(oldColsMap).length;
      return allColsUnchanged && !missingCols;
    };
    const sortModelDifferent = !_.jsonEquals(this.storeParams.sortModel, this.sortController.getSortModel());
    const rowGroupDifferent = !areColsSame({
      oldCols: this.storeParams.rowGroupCols,
      newCols: rowGroupColumnVos
    });
    const pivotDifferent = !areColsSame({
      oldCols: this.storeParams.pivotCols,
      newCols: pivotColumnVos
    });
    const valuesDifferent = !!(rowGroupColumnVos === null || rowGroupColumnVos === void 0 ? void 0 : rowGroupColumnVos.length) && !areColsSame({
      oldCols: this.storeParams.valueCols,
      newCols: valueColumnVos,
      allowRemovedColumns: true
    });
    const resetRequired = sortModelDifferent || rowGroupDifferent || pivotDifferent || valuesDifferent;
    if (resetRequired) {
      this.resetRootStore();
    } else {
      const newParams = this.createStoreParams();
      this.storeParams.rowGroupCols = newParams.rowGroupCols;
      this.storeParams.pivotCols = newParams.pivotCols;
      this.storeParams.valueCols = newParams.valueCols;
    }
  }
  destroyRootStore() {
    if (!this.rootNode || !this.rootNode.childStore) {
      return;
    }
    this.rootNode.childStore = this.destroyBean(this.rootNode.childStore);
    this.nodeManager.clear();
  }
  refreshAfterSort(newSortModel, params) {
    if (this.storeParams) {
      this.storeParams.sortModel = newSortModel;
    }
    const rootStore = this.getRootStore();
    if (!rootStore) {
      return;
    }
    rootStore.refreshAfterSort(params);
    this.onStoreUpdated();
  }
  generateSecondaryColumns(pivotFields) {
    const pivotColumnGroupDefs = this.pivotColDefService.createColDefsFromFields(pivotFields);
    this.managingPivotResultColumns = true;
    this.columnModel.setSecondaryColumns(pivotColumnGroupDefs, "rowModelUpdated");
  }
  resetRowHeights() {
    const atLeastOne = this.resetRowHeightsForAllRowNodes();
    const rootNodeHeight = this.gridOptionsService.getRowHeightForNode(this.rootNode);
    this.rootNode.setRowHeight(rootNodeHeight.height, rootNodeHeight.estimated);
    if (this.rootNode.sibling) {
      const rootNodeSibling = this.gridOptionsService.getRowHeightForNode(this.rootNode.sibling);
      this.rootNode.sibling.setRowHeight(rootNodeSibling.height, rootNodeSibling.estimated);
    }
    if (atLeastOne) {
      this.onRowHeightChanged();
    }
  }
  resetRowHeightsForAllRowNodes() {
    let atLeastOne = false;
    this.forEachNode(rowNode => {
      const rowHeightForNode = this.gridOptionsService.getRowHeightForNode(rowNode);
      rowNode.setRowHeight(rowHeightForNode.height, rowHeightForNode.estimated);
      const detailNode = rowNode.detailNode;
      if (detailNode) {
        const detailRowHeight = this.gridOptionsService.getRowHeightForNode(detailNode);
        detailNode.setRowHeight(detailRowHeight.height, detailRowHeight.estimated);
      }
      if (rowNode.sibling) {
        const siblingRowHeight = this.gridOptionsService.getRowHeightForNode(rowNode.sibling);
        detailNode.setRowHeight(siblingRowHeight.height, siblingRowHeight.estimated);
      }
      atLeastOne = true;
    });
    return atLeastOne;
  }
  resetRootStore() {
    this.destroyRootStore();
    this.rootNode = new RowNode(this.beans);
    this.rootNode.group = true;
    this.rootNode.level = -1;
    if (this.datasource) {
      this.storeParams = this.createStoreParams();
      this.rootNode.childStore = this.createBean(this.storeFactory.createStore(this.storeParams, this.rootNode));
      this.updateRowIndexesAndBounds();
    }
    if (this.managingPivotResultColumns) {
      this.columnModel.setSecondaryColumns(null);
      this.managingPivotResultColumns = false;
    }
    this.dispatchModelUpdated(true);
  }
  columnsToValueObjects(columns) {
    return columns.map(col => ({
      id: col.getId(),
      aggFunc: col.getAggFunc(),
      displayName: this.columnModel.getDisplayNameForColumn(col, 'model'),
      field: col.getColDef().field
    }));
  }
  createStoreParams() {
    const rowGroupColumnVos = this.columnsToValueObjects(this.columnModel.getRowGroupColumns());
    const valueColumnVos = this.columnsToValueObjects(this.columnModel.getValueColumns());
    const pivotColumnVos = this.columnsToValueObjects(this.columnModel.getPivotColumns());
    const dynamicRowHeight = this.gridOptionsService.isGetRowHeightFunction();
    const params = {
      valueCols: valueColumnVos,
      rowGroupCols: rowGroupColumnVos,
      pivotCols: pivotColumnVos,
      pivotMode: this.columnModel.isPivotMode(),
      filterModel: this.filterManager.isAdvancedFilterEnabled() ? this.filterManager.getAdvancedFilterModel() : this.filterManager.getFilterModel(),
      sortModel: this.sortController.getSortModel(),
      datasource: this.datasource,
      lastAccessedSequence: new NumberSequence(),
      dynamicRowHeight: dynamicRowHeight
    };
    return params;
  }
  getParams() {
    return this.storeParams;
  }
  dispatchModelUpdated(reset = false) {
    const modelUpdatedEvent = {
      type: Events.EVENT_MODEL_UPDATED,
      animate: !reset,
      keepRenderedRows: !reset,
      newPage: false,
      newData: false
    };
    this.eventService.dispatchEvent(modelUpdatedEvent);
  }
  onStoreUpdated() {
    if (this.pauseStoreUpdateListening) {
      return;
    }
    this.updateRowIndexesAndBounds();
    this.dispatchModelUpdated();
  }
  onRowHeightChangedDebounced() {
    this.onRowHeightChanged_debounced();
  }
  onRowHeightChanged() {
    this.updateRowIndexesAndBounds();
    this.dispatchModelUpdated();
  }
  updateRowIndexesAndBounds() {
    const rootStore = this.getRootStore();
    if (!rootStore) {
      return;
    }
    rootStore.setDisplayIndexes(new NumberSequence(), {
      value: 0
    });
  }
  retryLoads() {
    const rootStore = this.getRootStore();
    if (!rootStore) {
      return;
    }
    rootStore.retryLoads();
    this.onStoreUpdated();
  }
  getRow(index) {
    const rootStore = this.getRootStore();
    if (!rootStore) {
      return undefined;
    }
    return rootStore.getRowUsingDisplayIndex(index);
  }
  expandAll(value) {
    this.pauseStoreUpdateListening = true;
    this.forEachNode(node => {
      if (node.stub) {
        return;
      }
      if (node.hasChildren()) {
        node.setExpanded(value);
      }
    });
    this.pauseStoreUpdateListening = false;
    this.onStoreUpdated();
  }
  refreshAfterFilter(newFilterModel, params) {
    if (this.storeParams) {
      this.storeParams.filterModel = newFilterModel;
    }
    const rootStore = this.getRootStore();
    if (!rootStore) {
      return;
    }
    rootStore.refreshAfterFilter(params);
    this.onStoreUpdated();
  }
  getRootStore() {
    if (this.rootNode && this.rootNode.childStore) {
      return this.rootNode.childStore;
    }
  }
  getRowCount() {
    const rootStore = this.getRootStore();
    if (!rootStore) {
      return 0;
    }
    return rootStore.getDisplayIndexEnd();
  }
  getTopLevelRowCount() {
    const rootStore = this.getRootStore();
    if (!rootStore) {
      return 1;
    }
    return rootStore.getRowCount();
  }
  getTopLevelRowDisplayedIndex(topLevelIndex) {
    const rootStore = this.getRootStore();
    if (!rootStore) {
      return topLevelIndex;
    }
    return rootStore.getTopLevelRowDisplayedIndex(topLevelIndex);
  }
  getRowBounds(index) {
    const rootStore = this.getRootStore();
    if (!rootStore) {
      const rowHeight = this.gridOptionsService.getRowHeightAsNumber();
      return {
        rowTop: 0,
        rowHeight: rowHeight
      };
    }
    return rootStore.getRowBounds(index);
  }
  getBlockStates() {
    const root = this.getRootStore();
    if (!root) {
      return undefined;
    }
    const states = {};
    root.forEachStoreDeep(store => {
      if (store instanceof FullStore) {
        const {
          id,
          state
        } = store.getBlockStateJson();
        states[id] = state;
      } else if (store instanceof LazyStore) {
        Object.entries(store.getBlockStates()).forEach(([block, state]) => {
          states[block] = state;
        });
      } else {
        throw new Error('ZING Grid: Unsupported store type');
      }
    });
    return states;
  }
  getRowIndexAtPixel(pixel) {
    const rootStore = this.getRootStore();
    if (pixel <= 0 || !rootStore) {
      return 0;
    }
    return rootStore.getRowIndexAtPixel(pixel);
  }
  isEmpty() {
    return false;
  }
  isRowsToRender() {
    return this.getRootStore() != null && this.getRowCount() > 0;
  }
  getType() {
    return 'serverSide';
  }
  forEachNode(callback) {
    const rootStore = this.getRootStore();
    if (!rootStore) {
      return;
    }
    rootStore.forEachNodeDeep(callback);
  }
  forEachNodeAfterFilterAndSort(callback, includeFooterNodes = false) {
    const rootStore = this.getRootStore();
    if (!rootStore) {
      return;
    }
    rootStore.forEachNodeDeepAfterFilterAndSort(callback, undefined, includeFooterNodes);
  }
  executeOnStore(route, callback) {
    if (!this.started) {
      return false;
    }
    const rootStore = this.getRootStore();
    if (!rootStore) {
      return true;
    }
    const storeToExecuteOn = rootStore.getChildStore(route);
    if (storeToExecuteOn) {
      callback(storeToExecuteOn);
    }
    return true;
  }
  refreshStore(params = {}) {
    const route = params.route ? params.route : [];
    this.executeOnStore(route, store => store.refreshStore(params.purge == true));
  }
  getStoreState() {
    const res = [];
    const rootStore = this.getRootStore();
    if (rootStore) {
      rootStore.addStoreStates(res);
    }
    return res;
  }
  getNodesInRangeForSelection(firstInRange, lastInRange) {
    if (!_.exists(firstInRange)) {
      return [];
    }
    if (!lastInRange) {
      return [firstInRange];
    }
    const startIndex = firstInRange.rowIndex;
    const endIndex = lastInRange.rowIndex;
    if (startIndex === null || endIndex === null) {
      return [firstInRange];
    }
    const nodeRange = [];
    const [firstIndex, lastIndex] = [startIndex, endIndex].sort((a, b) => a - b);
    this.forEachNode(node => {
      const thisRowIndex = node.rowIndex;
      if (thisRowIndex == null || node.stub) {
        return;
      }
      if (thisRowIndex >= firstIndex && thisRowIndex <= lastIndex) {
        nodeRange.push(node);
      }
    });
    if (nodeRange.length !== lastIndex - firstIndex + 1) {
      return [firstInRange];
    }
    return nodeRange;
  }
  getRowNode(id) {
    let result;
    this.forEachNode(rowNode => {
      if (rowNode.id === id) {
        result = rowNode;
      }
      if (rowNode.detailNode && rowNode.detailNode.id === id) {
        result = rowNode.detailNode;
      }
    });
    return result;
  }
  isRowPresent(rowNode) {
    const foundRowNode = this.getRowNode(rowNode.id);
    return !!foundRowNode;
  }
  setRowCount(rowCount, lastRowIndexKnown) {
    const rootStore = this.getRootStore();
    if (rootStore) {
      if (rootStore instanceof LazyStore) {
        rootStore.setRowCount(rowCount, lastRowIndexKnown);
        return;
      }
      console.error('ZING Grid: Infinite scrolling must be enabled in order to set the row count.');
    }
  }
};
__decorate([Autowired('columnModel')], ServerSideRowModel.prototype, "columnModel", void 0);
__decorate([Autowired('filterManager')], ServerSideRowModel.prototype, "filterManager", void 0);
__decorate([Autowired('sortController')], ServerSideRowModel.prototype, "sortController", void 0);
__decorate([Autowired('rowRenderer')], ServerSideRowModel.prototype, "rowRenderer", void 0);
__decorate([Autowired('ssrmSortService')], ServerSideRowModel.prototype, "sortListener", void 0);
__decorate([Autowired('ssrmNodeManager')], ServerSideRowModel.prototype, "nodeManager", void 0);
__decorate([Autowired('ssrmStoreFactory')], ServerSideRowModel.prototype, "storeFactory", void 0);
__decorate([Autowired('beans')], ServerSideRowModel.prototype, "beans", void 0);
__decorate([Optional('pivotColDefService')], ServerSideRowModel.prototype, "pivotColDefService", void 0);
__decorate([PreDestroy], ServerSideRowModel.prototype, "destroyDatasource", null);
__decorate([PostConstruct], ServerSideRowModel.prototype, "addEventListeners", null);
__decorate([PreDestroy], ServerSideRowModel.prototype, "destroyRootStore", null);
ServerSideRowModel = __decorate([Bean('rowModel')], ServerSideRowModel);
export { ServerSideRowModel };