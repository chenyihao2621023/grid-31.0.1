var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ZingPromise, _ } from '../utils';
import { Column } from '../entities/column';
import { Autowired, Bean, Optional, PostConstruct } from '../context/context';
import { Events } from '../events';
import { ModuleNames } from '../modules/moduleNames';
import { ModuleRegistry } from '../modules/moduleRegistry';
import { BeanStub } from '../context/beanStub';
import { convertToSet } from '../utils/set';
import { exists } from '../utils/generic';
import { mergeDeep, cloneObject } from '../utils/object';
import { loadTemplate } from '../utils/dom';
import { FilterComponent } from '../components/framework/componentTypes';
import { unwrapUserComp } from '../gridApi';
import { warnOnce } from '../utils/function';
import { QuickFilterService } from './quickFilterService';
let FilterManager = class FilterManager extends BeanStub {
  constructor() {
    super(...arguments);
    this.allColumnFilters = new Map();
    this.allColumnListeners = new Map();
    this.activeAggregateFilters = [];
    this.activeColumnFilters = [];
    this.processingFilterChange = false;
    this.filterModelUpdateQueue = [];
    this.advancedFilterModelUpdateQueue = [];
  }
  init() {
    this.addManagedListener(this.eventService, Events.EVENT_GRID_COLUMNS_CHANGED, () => this.onColumnsChanged());
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_VALUE_CHANGED, () => this.refreshFiltersForAggregations());
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PIVOT_CHANGED, () => this.refreshFiltersForAggregations());
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PIVOT_MODE_CHANGED, () => this.refreshFiltersForAggregations());
    this.addManagedListener(this.eventService, Events.EVENT_NEW_COLUMNS_LOADED, () => this.updateAdvancedFilterColumns());
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_VISIBLE, () => this.updateAdvancedFilterColumns());
    this.addManagedListener(this.eventService, Events.EVENT_ROW_DATA_UPDATED, () => this.onNewRowsLoaded('rowDataUpdated'));
    this.externalFilterPresent = this.isExternalFilterPresentCallback();
    this.addManagedPropertyListeners(['isExternalFilterPresent', 'doesExternalFilterPass'], () => {
      this.onFilterChanged({
        source: 'api'
      });
    });
    this.updateAggFiltering();
    this.addManagedPropertyListener('groupAggFiltering', () => {
      this.updateAggFiltering();
      this.onFilterChanged();
    });
    this.addManagedPropertyListener('advancedFilterModel', event => this.setAdvancedFilterModel(event.currentValue));
    this.addManagedListener(this.eventService, Events.EVENT_ADVANCED_FILTER_ENABLED_CHANGED, ({
      enabled
    }) => this.onAdvancedFilterEnabledChanged(enabled));
    this.addManagedListener(this.eventService, Events.EVENT_DATA_TYPES_INFERRED, () => this.processFilterModelUpdateQueue());
    this.addManagedListener(this.quickFilterService, QuickFilterService.EVENT_QUICK_FILTER_CHANGED, () => this.onFilterChanged({
      source: 'quickFilter'
    }));
  }
  isExternalFilterPresentCallback() {
    const isFilterPresent = this.gridOptionsService.getCallback('isExternalFilterPresent');
    if (typeof isFilterPresent === 'function') {
      return isFilterPresent({});
    }
    return false;
  }
  doesExternalFilterPass(node) {
    const doesFilterPass = this.gridOptionsService.get('doesExternalFilterPass');
    if (typeof doesFilterPass === 'function') {
      return doesFilterPass(node);
    }
    return false;
  }
  setFilterModel(model, source = 'api') {
    if (this.isAdvancedFilterEnabled()) {
      this.warnAdvancedFilters();
      return;
    }
    if (this.dataTypeService.isPendingInference()) {
      this.filterModelUpdateQueue.push({
        model,
        source
      });
      return;
    }
    const allPromises = [];
    const previousModel = this.getFilterModel();
    if (model) {
      const modelKeys = convertToSet(Object.keys(model));
      this.allColumnFilters.forEach((filterWrapper, colId) => {
        const newModel = model[colId];
        allPromises.push(this.setModelOnFilterWrapper(filterWrapper.filterPromise, newModel));
        modelKeys.delete(colId);
      });
      modelKeys.forEach(colId => {
        const column = this.columnModel.getPrimaryColumn(colId) || this.columnModel.getGridColumn(colId);
        if (!column) {
          console.warn('ZING Grid: setFilterModel() - no column found for colId: ' + colId);
          return;
        }
        if (!column.isFilterAllowed()) {
          console.warn('ZING Grid: setFilterModel() - unable to fully apply model, filtering disabled for colId: ' + colId);
          return;
        }
        const filterWrapper = this.getOrCreateFilterWrapper(column, 'NO_UI');
        if (!filterWrapper) {
          console.warn('AG-Grid: setFilterModel() - unable to fully apply model, unable to create filter for colId: ' + colId);
          return;
        }
        allPromises.push(this.setModelOnFilterWrapper(filterWrapper.filterPromise, model[colId]));
      });
    } else {
      this.allColumnFilters.forEach(filterWrapper => {
        allPromises.push(this.setModelOnFilterWrapper(filterWrapper.filterPromise, null));
      });
    }
    ZingPromise.all(allPromises).then(() => {
      const currentModel = this.getFilterModel();
      const columns = [];
      this.allColumnFilters.forEach((filterWrapper, colId) => {
        const before = previousModel ? previousModel[colId] : null;
        const after = currentModel ? currentModel[colId] : null;
        if (!_.jsonEquals(before, after)) {
          columns.push(filterWrapper.column);
        }
      });
      if (columns.length > 0) {
        this.onFilterChanged({
          columns,
          source
        });
      }
    });
  }
  setModelOnFilterWrapper(filterPromise, newModel) {
    return new ZingPromise(resolve => {
      filterPromise.then(filter => {
        if (typeof filter.setModel !== 'function') {
          console.warn('ZING Grid: filter missing setModel method, which is needed for setFilterModel');
          resolve();
        }
        (filter.setModel(newModel) || ZingPromise.resolve()).then(() => resolve());
      });
    });
  }
  getFilterModel() {
    const result = {};
    this.allColumnFilters.forEach((filterWrapper, key) => {
      const filterPromise = filterWrapper.filterPromise;
      const filter = filterPromise.resolveNow(null, promiseFilter => promiseFilter);
      if (filter == null) {
        return null;
      }
      if (typeof filter.getModel !== 'function') {
        console.warn('ZING Grid: filter API missing getModel method, which is needed for getFilterModel');
        return;
      }
      const model = filter.getModel();
      if (exists(model)) {
        result[key] = model;
      }
    });
    return result;
  }
  isColumnFilterPresent() {
    return this.activeColumnFilters.length > 0;
  }
  isAggregateFilterPresent() {
    return !!this.activeAggregateFilters.length;
  }
  isExternalFilterPresent() {
    return this.externalFilterPresent;
  }
  isChildFilterPresent() {
    return this.isColumnFilterPresent() || this.isQuickFilterPresent() || this.isExternalFilterPresent() || this.isAdvancedFilterPresent();
  }
  isAdvancedFilterPresent() {
    return this.isAdvancedFilterEnabled() && this.advancedFilterService.isFilterPresent();
  }
  onAdvancedFilterEnabledChanged(enabled) {
    var _a;
    if (enabled) {
      if (this.allColumnFilters.size) {
        this.allColumnFilters.forEach(filterWrapper => this.disposeFilterWrapper(filterWrapper, 'advancedFilterEnabled'));
        this.onFilterChanged({
          source: 'advancedFilter'
        });
      }
    } else {
      if ((_a = this.advancedFilterService) === null || _a === void 0 ? void 0 : _a.isFilterPresent()) {
        this.advancedFilterService.setModel(null);
        this.onFilterChanged({
          source: 'advancedFilter'
        });
      }
    }
  }
  isAdvancedFilterEnabled() {
    var _a;
    return (_a = this.advancedFilterService) === null || _a === void 0 ? void 0 : _a.isEnabled();
  }
  isAdvancedFilterHeaderActive() {
    return this.isAdvancedFilterEnabled() && this.advancedFilterService.isHeaderActive();
  }
  doAggregateFiltersPass(node, filterToSkip) {
    return this.doColumnFiltersPass(node, filterToSkip, true);
  }
  updateActiveFilters() {
    this.activeColumnFilters.length = 0;
    this.activeAggregateFilters.length = 0;
    const isFilterActive = filter => {
      if (!filter) {
        return false;
      }
      if (!filter.isFilterActive) {
        console.warn('ZING Grid: Filter is missing isFilterActive() method');
        return false;
      }
      return filter.isFilterActive();
    };
    const groupFilterEnabled = !!this.gridOptionsService.getGroupAggFiltering();
    const isAggFilter = column => {
      const isSecondary = !column.isPrimary();
      if (isSecondary) {
        return true;
      }
      const isShowingPrimaryColumns = !this.columnModel.isPivotActive();
      const isValueActive = column.isValueActive();
      if (!isValueActive || !isShowingPrimaryColumns) {
        return false;
      }
      if (this.columnModel.isPivotMode()) {
        return true;
      }
      return groupFilterEnabled;
    };
    this.allColumnFilters.forEach(filterWrapper => {
      if (filterWrapper.filterPromise.resolveNow(false, isFilterActive)) {
        const filterComp = filterWrapper.filterPromise.resolveNow(null, filter => filter);
        if (isAggFilter(filterWrapper.column)) {
          this.activeAggregateFilters.push(filterComp);
        } else {
          this.activeColumnFilters.push(filterComp);
        }
      }
    });
  }
  updateFilterFlagInColumns(source, additionalEventAttributes) {
    this.allColumnFilters.forEach(filterWrapper => {
      const isFilterActive = filterWrapper.filterPromise.resolveNow(false, filter => filter.isFilterActive());
      filterWrapper.column.setFilterActive(isFilterActive, source, additionalEventAttributes);
    });
  }
  isAnyFilterPresent() {
    return this.isQuickFilterPresent() || this.isColumnFilterPresent() || this.isAggregateFilterPresent() || this.isExternalFilterPresent();
  }
  doColumnFiltersPass(node, filterToSkip, targetAggregates) {
    const {
      data,
      aggData
    } = node;
    const targetedFilters = targetAggregates ? this.activeAggregateFilters : this.activeColumnFilters;
    const targetedData = targetAggregates ? aggData : data;
    for (let i = 0; i < targetedFilters.length; i++) {
      const filter = targetedFilters[i];
      if (filter == null || filter === filterToSkip) {
        continue;
      }
      if (typeof filter.doesFilterPass !== 'function') {
        throw new Error('Filter is missing method doesFilterPass');
      }
      if (!filter.doesFilterPass({
        node,
        data: targetedData
      })) {
        return false;
      }
    }
    return true;
  }
  resetQuickFilterCache() {
    this.quickFilterService.resetQuickFilterCache();
  }
  refreshFiltersForAggregations() {
    const isAggFiltering = this.gridOptionsService.getGroupAggFiltering();
    if (isAggFiltering) {
      this.onFilterChanged();
    }
  }
  callOnFilterChangedOutsideRenderCycle(params) {
    const action = () => this.onFilterChanged(params);
    if (this.rowRenderer.isRefreshInProgress()) {
      setTimeout(action, 0);
    } else {
      action();
    }
  }
  onFilterChanged(params = {}) {
    const {
      source,
      filterInstance,
      additionalEventAttributes,
      columns
    } = params;
    this.updateDependantFilters();
    this.updateActiveFilters();
    this.updateFilterFlagInColumns('filterChanged', additionalEventAttributes);
    this.externalFilterPresent = this.isExternalFilterPresentCallback();
    this.allColumnFilters.forEach(filterWrapper => {
      if (!filterWrapper.filterPromise) {
        return;
      }
      filterWrapper.filterPromise.then(filter => {
        if (filter && filter !== filterInstance && filter.onAnyFilterChanged) {
          filter.onAnyFilterChanged();
        }
      });
    });
    const filterChangedEvent = {
      source,
      type: Events.EVENT_FILTER_CHANGED,
      columns: columns || []
    };
    if (additionalEventAttributes) {
      mergeDeep(filterChangedEvent, additionalEventAttributes);
    }
    this.processingFilterChange = true;
    this.eventService.dispatchEvent(filterChangedEvent);
    this.processingFilterChange = false;
  }
  isSuppressFlashingCellsBecauseFiltering() {
    var _a;
    const allowShowChangeAfterFilter = (_a = this.gridOptionsService.get('allowShowChangeAfterFilter')) !== null && _a !== void 0 ? _a : false;
    return !allowShowChangeAfterFilter && this.processingFilterChange;
  }
  isQuickFilterPresent() {
    return this.quickFilterService.isQuickFilterPresent();
  }
  updateAggFiltering() {
    this.aggFiltering = !!this.gridOptionsService.getGroupAggFiltering();
  }
  isAggregateQuickFilterPresent() {
    return this.isQuickFilterPresent() && (this.aggFiltering || this.columnModel.isPivotMode());
  }
  isNonAggregateQuickFilterPresent() {
    return this.isQuickFilterPresent() && !(this.aggFiltering || this.columnModel.isPivotMode());
  }
  doesRowPassOtherFilters(filterToSkip, node) {
    return this.doesRowPassFilter({
      rowNode: node,
      filterInstanceToSkip: filterToSkip
    });
  }
  doesRowPassAggregateFilters(params) {
    if (this.isAggregateQuickFilterPresent() && !this.quickFilterService.doesRowPassQuickFilter(params.rowNode)) {
      return false;
    }
    if (this.isAggregateFilterPresent() && !this.doAggregateFiltersPass(params.rowNode, params.filterInstanceToSkip)) {
      return false;
    }
    return true;
  }
  doesRowPassFilter(params) {
    if (this.isNonAggregateQuickFilterPresent() && !this.quickFilterService.doesRowPassQuickFilter(params.rowNode)) {
      return false;
    }
    if (this.isExternalFilterPresent() && !this.doesExternalFilterPass(params.rowNode)) {
      return false;
    }
    if (this.isColumnFilterPresent() && !this.doColumnFiltersPass(params.rowNode, params.filterInstanceToSkip)) {
      return false;
    }
    if (this.isAdvancedFilterPresent() && !this.advancedFilterService.doesFilterPass(params.rowNode)) {
      return false;
    }
    return true;
  }
  onNewRowsLoaded(source) {
    this.allColumnFilters.forEach(filterWrapper => {
      filterWrapper.filterPromise.then(filter => {
        if (filter.onNewRowsLoaded) {
          filter.onNewRowsLoaded();
        }
      });
    });
    this.updateFilterFlagInColumns(source, {
      afterDataChange: true
    });
    this.updateActiveFilters();
  }
  createValueGetter(column) {
    return ({
      node
    }) => this.valueService.getValue(column, node, true);
  }
  createGetValue(filterColumn) {
    return (rowNode, column) => {
      const columnToUse = column ? this.columnModel.getGridColumn(column) : filterColumn;
      return columnToUse ? this.valueService.getValue(columnToUse, rowNode, true) : undefined;
    };
  }
  getFilterComponent(column, source, createIfDoesNotExist = true) {
    var _a;
    if (createIfDoesNotExist) {
      return ((_a = this.getOrCreateFilterWrapper(column, source)) === null || _a === void 0 ? void 0 : _a.filterPromise) || null;
    }
    const filterWrapper = this.cachedFilter(column);
    return filterWrapper ? filterWrapper.filterPromise : null;
  }
  isFilterActive(column) {
    const filterWrapper = this.cachedFilter(column);
    return !!filterWrapper && filterWrapper.filterPromise.resolveNow(false, filter => filter.isFilterActive());
  }
  getOrCreateFilterWrapper(column, source) {
    if (!column.isFilterAllowed()) {
      return null;
    }
    let filterWrapper = this.cachedFilter(column);
    if (!filterWrapper) {
      filterWrapper = this.createFilterWrapper(column, source);
      this.setColumnFilterWrapper(column, filterWrapper);
    } else if (source !== 'NO_UI') {
      this.putIntoGui(filterWrapper, source);
    }
    return filterWrapper;
  }
  cachedFilter(column) {
    return this.allColumnFilters.get(column.getColId());
  }
  getDefaultFilter(column) {
    let defaultFilter;
    if (ModuleRegistry.__isRegistered(ModuleNames.SetFilterModule, this.context.getGridId())) {
      defaultFilter = 'zingSetColumnFilter';
    } else {
      const cellDataType = column.getColDef().cellDataType;
      if (cellDataType === 'number') {
        defaultFilter = 'zingNumberColumnFilter';
      } else if (cellDataType === 'date' || cellDataType === 'dateString') {
        defaultFilter = 'zingDateColumnFilter';
      } else {
        defaultFilter = 'zingTextColumnFilter';
      }
    }
    return defaultFilter;
  }
  getDefaultFloatingFilter(column) {
    let defaultFloatingFilterType;
    if (ModuleRegistry.__isRegistered(ModuleNames.SetFilterModule, this.context.getGridId())) {
      defaultFloatingFilterType = 'zingSetColumnFloatingFilter';
    } else {
      const cellDataType = column.getColDef().cellDataType;
      if (cellDataType === 'number') {
        defaultFloatingFilterType = 'zingNumberColumnFloatingFilter';
      } else if (cellDataType === 'date' || cellDataType === 'dateString') {
        defaultFloatingFilterType = 'zingDateColumnFloatingFilter';
      } else {
        defaultFloatingFilterType = 'zingTextColumnFloatingFilter';
      }
    }
    return defaultFloatingFilterType;
  }
  createFilterInstance(column) {
    const defaultFilter = this.getDefaultFilter(column);
    const colDef = column.getColDef();
    let filterInstance;
    const params = Object.assign(Object.assign({}, this.createFilterParams(column, colDef)), {
      filterModifiedCallback: () => this.filterModifiedCallbackFactory(filterInstance, column)(),
      filterChangedCallback: additionalEventAttributes => this.filterChangedCallbackFactory(filterInstance, column)(additionalEventAttributes),
      doesRowPassOtherFilter: node => this.doesRowPassOtherFilters(filterInstance, node)
    });
    const compDetails = this.userComponentFactory.getFilterDetails(colDef, params, defaultFilter);
    if (!compDetails) {
      return {
        filterPromise: null,
        compDetails: null
      };
    }
    return {
      filterPromise: () => {
        const filterPromise = compDetails.newZingStackInstance();
        if (filterPromise) {
          filterPromise.then(r => filterInstance = r);
        }
        return filterPromise;
      },
      compDetails
    };
  }
  createFilterParams(column, colDef) {
    const params = {
      column,
      colDef: cloneObject(colDef),
      rowModel: this.rowModel,
      filterChangedCallback: () => {},
      filterModifiedCallback: () => {},
      valueGetter: this.createValueGetter(column),
      getValue: this.createGetValue(column),
      doesRowPassOtherFilter: () => true,
      api: this.gridOptionsService.api,
      columnApi: this.gridOptionsService.columnApi,
      context: this.gridOptionsService.context
    };
    return params;
  }
  createFilterWrapper(column, source) {
    var _a;
    const filterWrapper = {
      column: column,
      filterPromise: null,
      compiledElement: null,
      guiPromise: ZingPromise.resolve(null),
      compDetails: null
    };
    const {
      filterPromise,
      compDetails
    } = this.createFilterInstance(column);
    filterWrapper.filterPromise = (_a = filterPromise === null || filterPromise === void 0 ? void 0 : filterPromise()) !== null && _a !== void 0 ? _a : null;
    filterWrapper.compDetails = compDetails;
    if (filterPromise) {
      this.putIntoGui(filterWrapper, source);
    }
    return filterWrapper;
  }
  putIntoGui(filterWrapper, source) {
    const eFilterGui = document.createElement('div');
    eFilterGui.className = 'zing-filter';
    filterWrapper.guiPromise = new ZingPromise(resolve => {
      filterWrapper.filterPromise.then(filter => {
        let guiFromFilter = filter.getGui();
        if (!exists(guiFromFilter)) {
          console.warn(`ZING Grid: getGui method from filter returned ${guiFromFilter}, it should be a DOM element or an HTML template string.`);
        }
        if (typeof guiFromFilter === 'string') {
          guiFromFilter = loadTemplate(guiFromFilter);
        }
        eFilterGui.appendChild(guiFromFilter);
        resolve(eFilterGui);
        const event = {
          type: Events.EVENT_FILTER_OPENED,
          column: filterWrapper.column,
          source,
          eGui: eFilterGui
        };
        this.eventService.dispatchEvent(event);
      });
    });
  }
  onColumnsChanged() {
    const columns = [];
    this.allColumnFilters.forEach((wrapper, colId) => {
      let currentColumn;
      if (wrapper.column.isPrimary()) {
        currentColumn = this.columnModel.getPrimaryColumn(colId);
      } else {
        currentColumn = this.columnModel.getGridColumn(colId);
      }
      if (currentColumn) {
        return;
      }
      columns.push(wrapper.column);
      this.disposeFilterWrapper(wrapper, 'columnChanged');
      this.disposeColumnListener(colId);
    });
    if (columns.length > 0) {
      this.onFilterChanged({
        columns,
        source: 'api'
      });
    } else {
      this.updateDependantFilters();
    }
  }
  updateDependantFilters() {
    const groupColumns = this.columnModel.getGroupAutoColumns();
    groupColumns === null || groupColumns === void 0 ? void 0 : groupColumns.forEach(groupColumn => {
      if (groupColumn.getColDef().filter === 'zingGroupColumnFilter') {
        this.getOrCreateFilterWrapper(groupColumn, 'NO_UI');
      }
    });
  }
  isFilterAllowed(column) {
    var _a, _b;
    if (this.isAdvancedFilterEnabled()) {
      return false;
    }
    const isFilterAllowed = column.isFilterAllowed();
    if (!isFilterAllowed) {
      return false;
    }
    const filterWrapper = this.allColumnFilters.get(column.getColId());
    return (_b = (_a = filterWrapper === null || filterWrapper === void 0 ? void 0 : filterWrapper.filterPromise) === null || _a === void 0 ? void 0 : _a.resolveNow(true, filter => typeof (filter === null || filter === void 0 ? void 0 : filter.isFilterAllowed) === 'function' ? filter === null || filter === void 0 ? void 0 : filter.isFilterAllowed() : true)) !== null && _b !== void 0 ? _b : true;
  }
  getFloatingFilterCompDetails(column, showParentFilter) {
    const colDef = column.getColDef();
    const filterParams = this.createFilterParams(column, colDef);
    const finalFilterParams = this.userComponentFactory.mergeParamsWithApplicationProvidedParams(colDef, FilterComponent, filterParams);
    let defaultFloatingFilterType = this.userComponentFactory.getDefaultFloatingFilterType(colDef, () => this.getDefaultFloatingFilter(column));
    if (defaultFloatingFilterType == null) {
      defaultFloatingFilterType = 'zingReadOnlyFloatingFilter';
    }
    const parentFilterInstance = callback => {
      const filterComponent = this.getFilterComponent(column, 'NO_UI');
      if (filterComponent == null) {
        return;
      }
      filterComponent.then(instance => {
        callback(unwrapUserComp(instance));
      });
    };
    const params = {
      column: column,
      filterParams: finalFilterParams,
      currentParentModel: () => this.getCurrentFloatingFilterParentModel(column),
      parentFilterInstance,
      showParentFilter,
      suppressFilterButton: false
    };
    return this.userComponentFactory.getFloatingFilterCompDetails(colDef, params, defaultFloatingFilterType);
  }
  getCurrentFloatingFilterParentModel(column) {
    const filterComponent = this.getFilterComponent(column, 'NO_UI', false);
    return filterComponent ? filterComponent.resolveNow(null, filter => filter && filter.getModel()) : null;
  }
  destroyFilter(column, source = 'api') {
    const colId = column.getColId();
    const filterWrapper = this.allColumnFilters.get(colId);
    this.disposeColumnListener(colId);
    if (filterWrapper) {
      this.disposeFilterWrapper(filterWrapper, source);
      this.onFilterChanged({
        columns: [column],
        source: 'api'
      });
    }
  }
  disposeColumnListener(colId) {
    const columnListener = this.allColumnListeners.get(colId);
    if (columnListener) {
      this.allColumnListeners.delete(colId);
      columnListener();
    }
  }
  disposeFilterWrapper(filterWrapper, source) {
    filterWrapper.filterPromise.then(filter => {
      this.getContext().destroyBean(filter);
      filterWrapper.column.setFilterActive(false, 'filterDestroyed');
      this.allColumnFilters.delete(filterWrapper.column.getColId());
      const event = {
        type: Events.EVENT_FILTER_DESTROYED,
        source,
        column: filterWrapper.column
      };
      this.eventService.dispatchEvent(event);
    });
  }
  filterModifiedCallbackFactory(filter, column) {
    return () => {
      const event = {
        type: Events.EVENT_FILTER_MODIFIED,
        column,
        filterInstance: filter
      };
      this.eventService.dispatchEvent(event);
    };
  }
  filterChangedCallbackFactory(filter, column) {
    return additionalEventAttributes => {
      var _a;
      const source = (_a = additionalEventAttributes === null || additionalEventAttributes === void 0 ? void 0 : additionalEventAttributes.source) !== null && _a !== void 0 ? _a : 'api';
      const params = {
        filter,
        additionalEventAttributes,
        columns: [column],
        source
      };
      this.callOnFilterChangedOutsideRenderCycle(params);
    };
  }
  checkDestroyFilter(colId) {
    const filterWrapper = this.allColumnFilters.get(colId);
    if (!filterWrapper) {
      return;
    }
    const column = filterWrapper.column;
    const {
      compDetails
    } = column.isFilterAllowed() ? this.createFilterInstance(column) : {
      compDetails: null
    };
    if (this.areFilterCompsDifferent(filterWrapper.compDetails, compDetails)) {
      this.destroyFilter(column, 'columnChanged');
      return;
    }
    const newFilterParams = column.getColDef().filterParams;
    if (!filterWrapper.filterPromise) {
      this.destroyFilter(column, 'columnChanged');
      return;
    }
    filterWrapper.filterPromise.then(filter => {
      const shouldRefreshFilter = (filter === null || filter === void 0 ? void 0 : filter.refresh) ? filter.refresh(Object.assign(Object.assign(Object.assign({}, this.createFilterParams(column, column.getColDef())), {
        filterModifiedCallback: this.filterModifiedCallbackFactory(filter, column),
        filterChangedCallback: this.filterChangedCallbackFactory(filter, column),
        doesRowPassOtherFilter: node => this.doesRowPassOtherFilters(filter, node)
      }), newFilterParams)) : true;
      if (!shouldRefreshFilter) {
        this.destroyFilter(column, 'columnChanged');
      }
    });
  }
  setColumnFilterWrapper(column, filterWrapper) {
    const colId = column.getColId();
    this.allColumnFilters.set(colId, filterWrapper);
    this.allColumnListeners.set(colId, this.addManagedListener(column, Column.EVENT_COL_DEF_CHANGED, () => this.checkDestroyFilter(colId)));
  }
  areFilterCompsDifferent(oldCompDetails, newCompDetails) {
    if (!newCompDetails || !oldCompDetails) {
      return true;
    }
    const {
      componentClass: oldComponentClass
    } = oldCompDetails;
    const {
      componentClass: newComponentClass
    } = newCompDetails;
    const isSameComponentClass = oldComponentClass === newComponentClass || (oldComponentClass === null || oldComponentClass === void 0 ? void 0 : oldComponentClass.render) && (newComponentClass === null || newComponentClass === void 0 ? void 0 : newComponentClass.render) && oldComponentClass.render === newComponentClass.render;
    return !isSameComponentClass;
  }
  getAdvancedFilterModel() {
    return this.isAdvancedFilterEnabled() ? this.advancedFilterService.getModel() : null;
  }
  setAdvancedFilterModel(expression) {
    if (!this.isAdvancedFilterEnabled()) {
      return;
    }
    if (this.dataTypeService.isPendingInference()) {
      this.advancedFilterModelUpdateQueue.push(expression);
      return;
    }
    this.advancedFilterService.setModel(expression !== null && expression !== void 0 ? expression : null);
    this.onFilterChanged({
      source: 'advancedFilter'
    });
  }
  showAdvancedFilterBuilder(source) {
    if (!this.isAdvancedFilterEnabled()) {
      return;
    }
    this.advancedFilterService.getCtrl().toggleFilterBuilder(source, true);
  }
  updateAdvancedFilterColumns() {
    if (!this.isAdvancedFilterEnabled()) {
      return;
    }
    if (this.advancedFilterService.updateValidity()) {
      this.onFilterChanged({
        source: 'advancedFilter'
      });
    }
  }
  hasFloatingFilters() {
    if (this.isAdvancedFilterEnabled()) {
      return false;
    }
    const gridColumns = this.columnModel.getAllGridColumns();
    return gridColumns.some(col => col.getColDef().floatingFilter);
  }
  getFilterInstance(key, callback) {
    if (this.isAdvancedFilterEnabled()) {
      this.warnAdvancedFilters();
      return undefined;
    }
    const res = this.getFilterInstanceImpl(key, instance => {
      if (!callback) {
        return;
      }
      const unwrapped = unwrapUserComp(instance);
      callback(unwrapped);
    });
    const unwrapped = unwrapUserComp(res);
    return unwrapped;
  }
  getFilterInstanceImpl(key, callback) {
    const column = this.columnModel.getPrimaryColumn(key);
    if (!column) {
      return undefined;
    }
    const filterPromise = this.getFilterComponent(column, 'NO_UI');
    const currentValue = filterPromise && filterPromise.resolveNow(null, filterComp => filterComp);
    if (currentValue) {
      setTimeout(callback, 0, currentValue);
    } else if (filterPromise) {
      filterPromise.then(comp => {
        callback(comp);
      });
    }
    return currentValue;
  }
  warnAdvancedFilters() {
    warnOnce('Column Filter API methods have been disabled as Advanced Filters are enabled.');
  }
  setupAdvancedFilterHeaderComp(eCompToInsertBefore) {
    var _a;
    (_a = this.advancedFilterService) === null || _a === void 0 ? void 0 : _a.getCtrl().setupHeaderComp(eCompToInsertBefore);
  }
  getHeaderRowCount() {
    return this.isAdvancedFilterHeaderActive() ? 1 : 0;
  }
  getHeaderHeight() {
    return this.isAdvancedFilterHeaderActive() ? this.advancedFilterService.getCtrl().getHeaderHeight() : 0;
  }
  processFilterModelUpdateQueue() {
    this.filterModelUpdateQueue.forEach(({
      model,
      source
    }) => this.setFilterModel(model, source));
    this.filterModelUpdateQueue = [];
    this.advancedFilterModelUpdateQueue.forEach(model => this.setAdvancedFilterModel(model));
    this.advancedFilterModelUpdateQueue = [];
  }
  destroy() {
    super.destroy();
    this.allColumnFilters.forEach(filterWrapper => this.disposeFilterWrapper(filterWrapper, 'gridDestroyed'));
    this.allColumnListeners.clear();
  }
};
__decorate([Autowired('valueService')], FilterManager.prototype, "valueService", void 0);
__decorate([Autowired('columnModel')], FilterManager.prototype, "columnModel", void 0);
__decorate([Autowired('rowModel')], FilterManager.prototype, "rowModel", void 0);
__decorate([Autowired('userComponentFactory')], FilterManager.prototype, "userComponentFactory", void 0);
__decorate([Autowired('rowRenderer')], FilterManager.prototype, "rowRenderer", void 0);
__decorate([Autowired('dataTypeService')], FilterManager.prototype, "dataTypeService", void 0);
__decorate([Autowired('quickFilterService')], FilterManager.prototype, "quickFilterService", void 0);
__decorate([Optional('advancedFilterService')], FilterManager.prototype, "advancedFilterService", void 0);
__decorate([PostConstruct], FilterManager.prototype, "init", null);
FilterManager = __decorate([Bean('filterManager')], FilterManager);
export { FilterManager };