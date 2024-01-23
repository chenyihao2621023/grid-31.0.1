import { _, ZingPromise, TextFilter, EventService } from '@/components/zing-grid/@zing-grid-community/core/main.js';
import { ClientSideValuesExtractor } from '../clientSideValueExtractor';
import { FlatSetDisplayValueModel } from './flatSetDisplayValueModel';
import { TreeSetDisplayValueModel } from './treeSetDisplayValueModel';
import { SetValueModelFilteringKeys } from './filteringKeys';
export var SetFilterModelValuesType;
(function (SetFilterModelValuesType) {
  SetFilterModelValuesType[SetFilterModelValuesType["PROVIDED_LIST"] = 0] = "PROVIDED_LIST";
  SetFilterModelValuesType[SetFilterModelValuesType["PROVIDED_CALLBACK"] = 1] = "PROVIDED_CALLBACK";
  SetFilterModelValuesType[SetFilterModelValuesType["TAKEN_FROM_GRID_VALUES"] = 2] = "TAKEN_FROM_GRID_VALUES";
})(SetFilterModelValuesType || (SetFilterModelValuesType = {}));
export class SetValueModel {
  constructor(params) {
    var _a;
    this.localEventService = new EventService();
    this.miniFilterText = null;
    this.addCurrentSelectionToFilter = false;
    this.providedValues = null;
    this.allValues = new Map();
    this.availableKeys = new Set();
    this.selectedKeys = new Set();
    this.initialised = false;
    const {
      usingComplexObjects,
      columnModel,
      valueService,
      treeDataTreeList,
      groupingTreeList,
      filterParams,
      gridOptionsService,
      valueFormatterService,
      valueFormatter,
      addManagedListener
    } = params;
    const {
      column,
      colDef,
      textFormatter,
      doesRowPassOtherFilter,
      suppressSorting,
      comparator,
      rowModel,
      values,
      caseSensitive,
      convertValuesToStrings,
      treeList,
      treeListPathGetter,
      treeListFormatter
    } = filterParams;
    this.filterParams = filterParams;
    this.gridOptionsService = gridOptionsService;
    this.setIsLoading = params.setIsLoading;
    this.translate = params.translate;
    this.caseFormat = params.caseFormat;
    this.createKey = params.createKey;
    this.usingComplexObjects = !!params.usingComplexObjects;
    this.formatter = textFormatter || TextFilter.DEFAULT_FORMATTER;
    this.doesRowPassOtherFilters = doesRowPassOtherFilter;
    this.suppressSorting = suppressSorting || false;
    this.convertValuesToStrings = !!convertValuesToStrings;
    this.filteringKeys = new SetValueModelFilteringKeys({
      caseFormat: this.caseFormat
    });
    const keyComparator = comparator !== null && comparator !== void 0 ? comparator : colDef.comparator;
    const treeDataOrGrouping = !!treeDataTreeList || !!groupingTreeList;
    this.compareByValue = !!(usingComplexObjects && keyComparator || treeDataOrGrouping || treeList && !treeListPathGetter);
    if (treeDataOrGrouping && !keyComparator) {
      this.entryComparator = this.createTreeDataOrGroupingComparator();
    } else if (treeList && !treeListPathGetter && !keyComparator) {
      this.entryComparator = ([_aKey, aValue], [_bKey, bValue]) => _.defaultComparator(aValue, bValue);
    } else {
      this.entryComparator = ([_aKey, aValue], [_bKey, bValue]) => keyComparator(aValue, bValue);
    }
    this.keyComparator = (_a = keyComparator) !== null && _a !== void 0 ? _a : _.defaultComparator;
    this.caseSensitive = !!caseSensitive;
    const getDataPath = gridOptionsService.get('getDataPath');
    const groupAllowUnbalanced = gridOptionsService.get('groupAllowUnbalanced');
    if (rowModel.getType() === 'clientSide') {
      this.clientSideValuesExtractor = new ClientSideValuesExtractor(rowModel, this.filterParams, this.createKey, this.caseFormat, columnModel, valueService, treeDataOrGrouping, !!treeDataTreeList, getDataPath, groupAllowUnbalanced, addManagedListener);
    }
    if (values == null) {
      this.valuesType = SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES;
    } else {
      this.valuesType = Array.isArray(values) ? SetFilterModelValuesType.PROVIDED_LIST : SetFilterModelValuesType.PROVIDED_CALLBACK;
      this.providedValues = values;
    }
    this.displayValueModel = treeList ? new TreeSetDisplayValueModel(this.formatter, treeListPathGetter, treeListFormatter, treeDataTreeList || groupingTreeList) : new FlatSetDisplayValueModel(valueFormatterService, valueFormatter, this.formatter, column);
    this.updateAllValues().then(updatedKeys => this.resetSelectionState(updatedKeys || []));
  }
  addEventListener(eventType, listener, async) {
    this.localEventService.addEventListener(eventType, listener, async);
  }
  removeEventListener(eventType, listener, async) {
    this.localEventService.removeEventListener(eventType, listener, async);
  }
  updateOnParamsChange(filterParams) {
    return new ZingPromise(resolve => {
      const {
        values,
        textFormatter,
        suppressSorting
      } = filterParams;
      const currentProvidedValues = this.providedValues;
      const currentSuppressSorting = this.suppressSorting;
      this.filterParams = filterParams;
      this.formatter = textFormatter || TextFilter.DEFAULT_FORMATTER;
      this.suppressSorting = suppressSorting || false;
      this.providedValues = values !== null && values !== void 0 ? values : null;
      if (this.providedValues !== currentProvidedValues || this.suppressSorting !== currentSuppressSorting) {
        if (!values || values.length === 0) {
          this.valuesType = SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES;
          this.providedValues = null;
        } else {
          const isArrayOfCallback = Array.isArray(values) && values.length > 0 && typeof values[0] === 'function';
          this.valuesType = isArrayOfCallback ? SetFilterModelValuesType.PROVIDED_CALLBACK : SetFilterModelValuesType.PROVIDED_LIST;
        }
        const currentModel = this.getModel();
        this.updateAllValues().then(updatedKeys => {
          this.setModel(currentModel).then(() => resolve());
        });
      } else {
        resolve();
      }
    });
  }
  refreshValues() {
    return new ZingPromise(resolve => {
      this.allValuesPromise.then(() => {
        const currentModel = this.getModel();
        this.updateAllValues();
        this.setModel(currentModel).then(() => resolve());
      });
    });
  }
  overrideValues(valuesToUse) {
    return new ZingPromise(resolve => {
      this.allValuesPromise.then(() => {
        this.valuesType = SetFilterModelValuesType.PROVIDED_LIST;
        this.providedValues = valuesToUse;
        this.refreshValues().then(() => resolve());
      });
    });
  }
  refreshAfterAnyFilterChanged() {
    if (this.showAvailableOnly()) {
      return this.allValuesPromise.then(keys => {
        this.updateAvailableKeys(keys !== null && keys !== void 0 ? keys : [], 'otherFilter');
        return true;
      });
    }
    return ZingPromise.resolve(false);
  }
  isInitialised() {
    return this.initialised;
  }
  updateAllValues() {
    this.allValuesPromise = new ZingPromise(resolve => {
      switch (this.valuesType) {
        case SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES:
          this.getValuesFromRowsAsync(false).then(values => resolve(this.processAllValues(values)));
          break;
        case SetFilterModelValuesType.PROVIDED_LIST:
          {
            resolve(this.processAllValues(this.uniqueValues(this.validateProvidedValues(this.providedValues))));
            break;
          }
        case SetFilterModelValuesType.PROVIDED_CALLBACK:
          {
            this.setIsLoading(true);
            const callback = this.providedValues;
            const {
              columnApi,
              api,
              column,
              colDef
            } = this.filterParams;
            const {
              context
            } = this.gridOptionsService;
            const params = {
              success: values => {
                this.setIsLoading(false);
                resolve(this.processAllValues(this.uniqueValues(this.validateProvidedValues(values))));
              },
              colDef,
              column,
              columnApi,
              api,
              context
            };
            window.setTimeout(() => callback(params), 0);
            break;
          }
        default:
          throw new Error('Unrecognised valuesType');
      }
    });
    this.allValuesPromise.then(values => this.updateAvailableKeys(values || [], 'reload')).then(() => this.initialised = true);
    return this.allValuesPromise;
  }
  processAllValues(values) {
    const sortedKeys = this.sortKeys(values);
    this.allValues = values !== null && values !== void 0 ? values : new Map();
    return sortedKeys;
  }
  validateProvidedValues(values) {
    if (this.usingComplexObjects && (values === null || values === void 0 ? void 0 : values.length)) {
      const firstValue = values[0];
      if (firstValue && typeof firstValue !== 'object' && typeof firstValue !== 'function') {
        const firstKey = this.createKey(firstValue);
        if (firstKey == null) {
          _.warnOnce('Set Filter Key Creator is returning null for provided values and provided values are primitives. Please provide complex objects or set convertValuesToStrings=true in the filterParams. See https://www.zing-grid.com/javascript-data-grid/filter-set-filter-list/#filter-value-types');
        } else {
          _.warnOnce('Set Filter has a Key Creator, but provided values are primitives. Did you mean to provide complex objects or enable convertValuesToStrings?');
        }
      }
    }
    return values;
  }
  setValuesType(value) {
    this.valuesType = value;
  }
  getValuesType() {
    return this.valuesType;
  }
  isKeyAvailable(key) {
    return this.availableKeys.has(key);
  }
  showAvailableOnly() {
    return this.valuesType === SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES;
  }
  updateAvailableKeys(allKeys, source) {
    const availableKeys = this.showAvailableOnly() ? this.sortKeys(this.getValuesFromRows(true)) : allKeys;
    this.availableKeys = new Set(availableKeys);
    this.localEventService.dispatchEvent({
      type: SetValueModel.EVENT_AVAILABLE_VALUES_CHANGED
    });
    this.updateDisplayedValues(source, allKeys);
  }
  sortKeys(nullableValues) {
    const values = nullableValues !== null && nullableValues !== void 0 ? nullableValues : new Map();
    if (this.suppressSorting) {
      return Array.from(values.keys());
    }
    let sortedKeys;
    if (this.compareByValue) {
      sortedKeys = Array.from(values.entries()).sort(this.entryComparator).map(([key]) => key);
    } else {
      sortedKeys = Array.from(values.keys()).sort(this.keyComparator);
    }
    if (this.filterParams.excelMode && values.has(null)) {
      sortedKeys = sortedKeys.filter(v => v != null);
      sortedKeys.push(null);
    }
    return sortedKeys;
  }
  getParamsForValuesFromRows(removeUnavailableValues = false) {
    if (!this.clientSideValuesExtractor) {
      _.doOnce(() => {
        console.error('ZING Grid: Set Filter cannot initialise because you are using a row model that does not contain all rows in the browser. Either use a different filter type, or configure Set Filter such that you provide it with values');
      }, 'setFilterValueNotCSRM');
      return null;
    }
    const predicate = node => !removeUnavailableValues || this.doesRowPassOtherFilters(node);
    const existingValues = removeUnavailableValues && !this.caseSensitive ? this.allValues : undefined;
    return {
      predicate,
      existingValues
    };
  }
  getValuesFromRows(removeUnavailableValues = false) {
    const params = this.getParamsForValuesFromRows(removeUnavailableValues);
    if (!params) {
      return null;
    }
    return this.clientSideValuesExtractor.extractUniqueValues(params.predicate, params.existingValues);
  }
  getValuesFromRowsAsync(removeUnavailableValues = false) {
    const params = this.getParamsForValuesFromRows(removeUnavailableValues);
    if (!params) {
      return ZingPromise.resolve(null);
    }
    return this.clientSideValuesExtractor.extractUniqueValuesAsync(params.predicate, params.existingValues);
  }
  setMiniFilter(value) {
    value = _.makeNull(value);
    if (this.miniFilterText === value) {
      return false;
    }
    if (value === null) {
      this.setAddCurrentSelectionToFilter(false);
    }
    this.miniFilterText = value;
    this.updateDisplayedValues('miniFilter');
    return true;
  }
  getMiniFilter() {
    return this.miniFilterText;
  }
  updateDisplayedValues(source, allKeys) {
    if (source === 'expansion') {
      this.displayValueModel.refresh();
      return;
    }
    if (this.miniFilterText == null) {
      this.displayValueModel.updateDisplayedValuesToAllAvailable(key => this.getValue(key), allKeys, this.availableKeys, source);
      return;
    }
    const formattedFilterText = this.caseFormat(this.formatter(this.miniFilterText) || '');
    const matchesFilter = valueToCheck => valueToCheck != null && this.caseFormat(valueToCheck).indexOf(formattedFilterText) >= 0;
    const nullMatchesFilter = !!this.filterParams.excelMode && matchesFilter(this.translate('blanks'));
    this.displayValueModel.updateDisplayedValuesToMatchMiniFilter(key => this.getValue(key), allKeys, this.availableKeys, matchesFilter, nullMatchesFilter, source);
  }
  getDisplayedValueCount() {
    return this.displayValueModel.getDisplayedValueCount();
  }
  getDisplayedItem(index) {
    return this.displayValueModel.getDisplayedItem(index);
  }
  getSelectAllItem() {
    return this.displayValueModel.getSelectAllItem();
  }
  getAddSelectionToFilterItem() {
    return this.displayValueModel.getAddSelectionToFilterItem();
  }
  hasSelections() {
    return this.filterParams.defaultToNothingSelected ? this.selectedKeys.size > 0 : this.allValues.size !== this.selectedKeys.size;
  }
  getKeys() {
    return Array.from(this.allValues.keys());
  }
  getValues() {
    return Array.from(this.allValues.values());
  }
  getValue(key) {
    return this.allValues.get(key);
  }
  setAddCurrentSelectionToFilter(value) {
    this.addCurrentSelectionToFilter = value;
  }
  isInWindowsExcelMode() {
    return this.filterParams.excelMode === 'windows';
  }
  isAddCurrentSelectionToFilterChecked() {
    return this.isInWindowsExcelMode() && this.addCurrentSelectionToFilter;
  }
  showAddCurrentSelectionToFilter() {
    return this.isInWindowsExcelMode() && _.exists(this.miniFilterText) && this.miniFilterText.length > 0;
  }
  selectAllMatchingMiniFilter(clearExistingSelection = false) {
    if (this.miniFilterText == null) {
      this.selectedKeys = new Set(this.allValues.keys());
    } else {
      if (clearExistingSelection) {
        this.selectedKeys.clear();
      }
      this.displayValueModel.forEachDisplayedKey(key => this.selectedKeys.add(key));
    }
  }
  deselectAllMatchingMiniFilter() {
    if (this.miniFilterText == null) {
      this.selectedKeys.clear();
    } else {
      this.displayValueModel.forEachDisplayedKey(key => this.selectedKeys.delete(key));
    }
  }
  selectKey(key) {
    this.selectedKeys.add(key);
  }
  deselectKey(key) {
    if (this.filterParams.excelMode && this.isEverythingVisibleSelected()) {
      this.resetSelectionState(this.displayValueModel.getDisplayedKeys());
    }
    this.selectedKeys.delete(key);
  }
  isKeySelected(key) {
    return this.selectedKeys.has(key);
  }
  isEverythingVisibleSelected() {
    return !this.displayValueModel.someDisplayedKey(it => !this.isKeySelected(it));
  }
  isNothingVisibleSelected() {
    return !this.displayValueModel.someDisplayedKey(it => this.isKeySelected(it));
  }
  getModel() {
    if (!this.hasSelections()) {
      return null;
    }
    const filteringKeys = this.isAddCurrentSelectionToFilterChecked() ? this.filteringKeys.allFilteringKeys() : null;
    if (filteringKeys && filteringKeys.size > 0) {
      if (this.selectedKeys) {
        const modelKeys = new Set([...Array.from(filteringKeys), ...Array.from(this.selectedKeys).filter(key => !filteringKeys.has(key))]);
        return Array.from(modelKeys);
      }
      return Array.from(filteringKeys);
    }
    return Array.from(this.selectedKeys);
  }
  setModel(model) {
    return this.allValuesPromise.then(keys => {
      if (model == null) {
        this.resetSelectionState(keys !== null && keys !== void 0 ? keys : []);
      } else {
        this.selectedKeys.clear();
        const existingFormattedKeys = new Map();
        this.allValues.forEach((_value, key) => {
          existingFormattedKeys.set(this.caseFormat(key), key);
        });
        model.forEach(unformattedKey => {
          const formattedKey = this.caseFormat(_.makeNull(unformattedKey));
          const existingUnformattedKey = existingFormattedKeys.get(formattedKey);
          if (existingUnformattedKey !== undefined) {
            this.selectKey(existingUnformattedKey);
          }
        });
      }
    });
  }
  uniqueValues(values) {
    const uniqueValues = new Map();
    const formattedKeys = new Set();
    (values !== null && values !== void 0 ? values : []).forEach(value => {
      const valueToUse = _.makeNull(value);
      const unformattedKey = this.convertAndGetKey(valueToUse);
      const formattedKey = this.caseFormat(unformattedKey);
      if (!formattedKeys.has(formattedKey)) {
        formattedKeys.add(formattedKey);
        uniqueValues.set(unformattedKey, valueToUse);
      }
    });
    return uniqueValues;
  }
  convertAndGetKey(value) {
    return this.convertValuesToStrings ? value : this.createKey(value);
  }
  resetSelectionState(keys) {
    if (this.filterParams.defaultToNothingSelected) {
      this.selectedKeys.clear();
    } else {
      this.selectedKeys = new Set(keys);
    }
  }
  hasGroups() {
    return this.displayValueModel.hasGroups();
  }
  createTreeDataOrGroupingComparator() {
    return ([_aKey, aValue], [_bKey, bValue]) => {
      if (aValue == null) {
        return bValue == null ? 0 : -1;
      } else if (bValue == null) {
        return 1;
      }
      for (let i = 0; i < aValue.length; i++) {
        if (i >= bValue.length) {
          return 1;
        }
        const diff = _.defaultComparator(aValue[i], bValue[i]);
        if (diff !== 0) {
          return diff;
        }
      }
      return 0;
    };
  }
  setAppliedModelKeys(appliedModelKeys) {
    this.filteringKeys.setFilteringKeys(appliedModelKeys);
  }
  addToAppliedModelKeys(appliedModelKey) {
    this.filteringKeys.addFilteringKey(appliedModelKey);
  }
  getAppliedModelKeys() {
    return this.filteringKeys.allFilteringKeys();
  }
  getCaseFormattedAppliedModelKeys() {
    return this.filteringKeys.allFilteringKeysCaseFormatted();
  }
  hasAppliedModelKey(appliedModelKey) {
    return this.filteringKeys.hasCaseFormattedFilteringKey(appliedModelKey);
  }
  hasAnyAppliedModelKey() {
    return !this.filteringKeys.noAppliedFilteringKeys();
  }
}
SetValueModel.EVENT_AVAILABLE_VALUES_CHANGED = 'availableValuesChanged';