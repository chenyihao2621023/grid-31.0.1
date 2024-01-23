var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, Bean, BeanStub, Events, NumberSequence, PostConstruct, PreDestroy } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { InfiniteCache } from "./infiniteCache";
let InfiniteRowModel = class InfiniteRowModel extends BeanStub {
  getRowBounds(index) {
    return {
      rowHeight: this.rowHeight,
      rowTop: this.rowHeight * index
    };
  }
  ensureRowHeightsValid(startPixel, endPixel, startLimitIndex, endLimitIndex) {
    return false;
  }
  init() {
    if (!this.gridOptionsService.isRowModelType('infinite')) {
      return;
    }
    this.rowHeight = this.gridOptionsService.getRowHeightAsNumber();
    this.addEventListeners();
    this.addDestroyFunc(() => this.destroyCache());
    this.verifyProps();
  }
  verifyProps() {
    if (this.gridOptionsService.exists('initialGroupOrderComparator')) {
      _.warnOnce('initialGroupOrderComparator cannot be used with Infinite Row Model as sorting is done on the server side');
    }
  }
  start() {
    this.setDatasource(this.gridOptionsService.get('datasource'));
  }
  destroyDatasource() {
    if (this.datasource) {
      this.getContext().destroyBean(this.datasource);
      this.rowRenderer.datasourceChanged();
      this.datasource = null;
    }
  }
  addEventListeners() {
    this.addManagedListener(this.eventService, Events.EVENT_FILTER_CHANGED, this.onFilterChanged.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_SORT_CHANGED, this.onSortChanged.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_NEW_COLUMNS_LOADED, this.onColumnEverything.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_STORE_UPDATED, this.onCacheUpdated.bind(this));
    this.addManagedPropertyListener('datasource', () => this.setDatasource(this.gridOptionsService.get('datasource')));
    this.addManagedPropertyListener('cacheBlockSize', () => this.resetCache());
    this.addManagedPropertyListener('rowHeight', () => {
      this.rowHeight = this.gridOptionsService.getRowHeightAsNumber();
      this.cacheParams.rowHeight = this.rowHeight;
      this.updateRowHeights();
    });
  }
  onFilterChanged() {
    this.reset();
  }
  onSortChanged() {
    this.reset();
  }
  onColumnEverything() {
    let resetRequired;
    if (this.cacheParams) {
      resetRequired = this.isSortModelDifferent();
    } else {
      resetRequired = true;
    }
    if (resetRequired) {
      this.reset();
    }
  }
  isSortModelDifferent() {
    return !_.jsonEquals(this.cacheParams.sortModel, this.sortController.getSortModel());
  }
  getType() {
    return 'infinite';
  }
  setDatasource(datasource) {
    this.destroyDatasource();
    this.datasource = datasource;
    if (datasource) {
      this.reset();
    }
  }
  isEmpty() {
    return !this.infiniteCache;
  }
  isRowsToRender() {
    return !!this.infiniteCache;
  }
  getNodesInRangeForSelection(firstInRange, lastInRange) {
    return this.infiniteCache ? this.infiniteCache.getRowNodesInRange(firstInRange, lastInRange) : [];
  }
  reset() {
    if (!this.datasource) {
      return;
    }
    const getRowIdFunc = this.gridOptionsService.getCallback('getRowId');
    const userGeneratingIds = getRowIdFunc != null;
    if (!userGeneratingIds) {
      this.selectionService.reset('rowDataChanged');
    }
    this.resetCache();
  }
  createModelUpdatedEvent() {
    return {
      type: Events.EVENT_MODEL_UPDATED,
      newPage: false,
      newPageSize: false,
      newData: false,
      keepRenderedRows: true,
      animate: false
    };
  }
  resetCache() {
    this.destroyCache();
    this.cacheParams = {
      datasource: this.datasource,
      filterModel: this.filterManager.getFilterModel(),
      sortModel: this.sortController.getSortModel(),
      rowNodeBlockLoader: this.rowNodeBlockLoader,
      initialRowCount: this.gridOptionsService.get('infiniteInitialRowCount'),
      maxBlocksInCache: this.gridOptionsService.get('maxBlocksInCache'),
      rowHeight: this.gridOptionsService.getRowHeightAsNumber(),
      overflowSize: this.gridOptionsService.get('cacheOverflowSize'),
      blockSize: this.gridOptionsService.get('cacheBlockSize'),
      lastAccessedSequence: new NumberSequence()
    };
    this.infiniteCache = this.createBean(new InfiniteCache(this.cacheParams));
    this.eventService.dispatchEventOnce({
      type: Events.EVENT_ROW_COUNT_READY
    });
    const event = this.createModelUpdatedEvent();
    this.eventService.dispatchEvent(event);
  }
  updateRowHeights() {
    this.forEachNode(node => {
      node.setRowHeight(this.rowHeight);
      node.setRowTop(this.rowHeight * node.rowIndex);
    });
    const event = this.createModelUpdatedEvent();
    this.eventService.dispatchEvent(event);
  }
  destroyCache() {
    if (this.infiniteCache) {
      this.infiniteCache = this.destroyBean(this.infiniteCache);
    }
  }
  onCacheUpdated() {
    const event = this.createModelUpdatedEvent();
    this.eventService.dispatchEvent(event);
  }
  getRow(rowIndex) {
    if (!this.infiniteCache) {
      return undefined;
    }
    if (rowIndex >= this.infiniteCache.getRowCount()) {
      return undefined;
    }
    return this.infiniteCache.getRow(rowIndex);
  }
  getRowNode(id) {
    let result;
    this.forEachNode(rowNode => {
      if (rowNode.id === id) {
        result = rowNode;
      }
    });
    return result;
  }
  forEachNode(callback) {
    if (this.infiniteCache) {
      this.infiniteCache.forEachNodeDeep(callback);
    }
  }
  getTopLevelRowCount() {
    return this.getRowCount();
  }
  getTopLevelRowDisplayedIndex(topLevelIndex) {
    return topLevelIndex;
  }
  getRowIndexAtPixel(pixel) {
    if (this.rowHeight !== 0) {
      const rowIndexForPixel = Math.floor(pixel / this.rowHeight);
      const lastRowIndex = this.getRowCount() - 1;
      if (rowIndexForPixel > lastRowIndex) {
        return lastRowIndex;
      }
      return rowIndexForPixel;
    }
    return 0;
  }
  getRowCount() {
    return this.infiniteCache ? this.infiniteCache.getRowCount() : 0;
  }
  isRowPresent(rowNode) {
    const foundRowNode = this.getRowNode(rowNode.id);
    return !!foundRowNode;
  }
  refreshCache() {
    if (this.infiniteCache) {
      this.infiniteCache.refreshCache();
    }
  }
  purgeCache() {
    if (this.infiniteCache) {
      this.infiniteCache.purgeCache();
    }
  }
  isLastRowIndexKnown() {
    if (this.infiniteCache) {
      return this.infiniteCache.isLastRowIndexKnown();
    }
    return false;
  }
  setRowCount(rowCount, lastRowIndexKnown) {
    if (this.infiniteCache) {
      this.infiniteCache.setRowCount(rowCount, lastRowIndexKnown);
    }
  }
};
__decorate([Autowired('filterManager')], InfiniteRowModel.prototype, "filterManager", void 0);
__decorate([Autowired('sortController')], InfiniteRowModel.prototype, "sortController", void 0);
__decorate([Autowired('selectionService')], InfiniteRowModel.prototype, "selectionService", void 0);
__decorate([Autowired('rowRenderer')], InfiniteRowModel.prototype, "rowRenderer", void 0);
__decorate([Autowired('rowNodeBlockLoader')], InfiniteRowModel.prototype, "rowNodeBlockLoader", void 0);
__decorate([PostConstruct], InfiniteRowModel.prototype, "init", null);
__decorate([PreDestroy], InfiniteRowModel.prototype, "destroyDatasource", null);
InfiniteRowModel = __decorate([Bean('rowModel')], InfiniteRowModel);
export { InfiniteRowModel };