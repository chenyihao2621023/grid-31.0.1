var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Events, ProvidedFilter, RefSelector, VirtualList, ZingPromise, KeyCode, _, GROUP_AUTO_COLUMN_ID } from '@/components/zing-grid/@zing-grid-community/core/main.js';
import { SetFilterModelValuesType, SetValueModel } from './setValueModel';
import { SetFilterListItem } from './setFilterListItem';
import { DEFAULT_LOCALE_TEXT } from './localeText';
import { SetFilterDisplayValue } from './iSetDisplayValueModel';
import { SetFilterModelFormatter } from './setFilterModelFormatter';
export class SetFilter extends ProvidedFilter {
  constructor() {
    super('setFilter');
    this.valueModel = null;
    this.setFilterParams = null;
    this.virtualList = null;
    this.caseSensitive = false;
    this.convertValuesToStrings = false;
    this.treeDataTreeList = false;
    this.groupingTreeList = false;
    this.hardRefreshVirtualList = false;
    this.noValueFormatterSupplied = false;
    this.filterModelFormatter = new SetFilterModelFormatter();
    this.updateSetFilterOnParamsChange = newParams => {
      var _a;
      this.setFilterParams = newParams;
      this.convertValuesToStrings = !!newParams.convertValuesToStrings;
      this.caseSensitive = !!newParams.caseSensitive;
      const keyCreator = (_a = newParams.keyCreator) !== null && _a !== void 0 ? _a : newParams.colDef.keyCreator;
      this.setValueFormatter(newParams.valueFormatter, keyCreator, this.convertValuesToStrings, !!newParams.treeList, !!newParams.colDef.refData);
      const isGroupCol = newParams.column.getId().startsWith(GROUP_AUTO_COLUMN_ID);
      this.treeDataTreeList = this.gridOptionsService.get('treeData') && !!newParams.treeList && isGroupCol;
      this.getDataPath = this.gridOptionsService.get('getDataPath');
      this.groupingTreeList = !!this.columnModel.getRowGroupColumns().length && !!newParams.treeList && isGroupCol;
      this.createKey = this.generateCreateKey(keyCreator, this.convertValuesToStrings, this.treeDataTreeList || this.groupingTreeList);
    };
  }
  postConstruct() {
    super.postConstruct();
  }
  updateUiVisibility() {}
  createBodyTemplate() {
    return `
            <div class="zing-set-filter">
                <div ref="eFilterLoading" class="zing-filter-loading zing-hidden">${this.translateForSetFilter('loadingOoo')}</div>
                <zing-input-text-field class="zing-mini-filter" ref="eMiniFilter"></zing-input-text-field>
                <div ref="eFilterNoMatches" class="zing-filter-no-matches zing-hidden">${this.translateForSetFilter('noMatches')}</div>
                <div ref="eSetFilterList" class="zing-set-filter-list" role="presentation"></div>
            </div>`;
  }
  handleKeyDown(e) {
    super.handleKeyDown(e);
    if (e.defaultPrevented) {
      return;
    }
    switch (e.key) {
      case KeyCode.SPACE:
        this.handleKeySpace(e);
        break;
      case KeyCode.ENTER:
        this.handleKeyEnter(e);
        break;
      case KeyCode.LEFT:
        this.handleKeyLeft(e);
        break;
      case KeyCode.RIGHT:
        this.handleKeyRight(e);
        break;
    }
  }
  handleKeySpace(e) {
    var _a;
    (_a = this.getComponentForKeyEvent(e)) === null || _a === void 0 ? void 0 : _a.toggleSelected();
  }
  handleKeyEnter(e) {
    if (!this.setFilterParams) {
      return;
    }
    const {
      excelMode,
      readOnly
    } = this.setFilterParams || {};
    if (!excelMode || !!readOnly) {
      return;
    }
    e.preventDefault();
    this.onBtApply(false, false, e);
    if (this.setFilterParams.excelMode === 'mac') {
      this.eMiniFilter.getInputElement().select();
    }
  }
  handleKeyLeft(e) {
    var _a;
    (_a = this.getComponentForKeyEvent(e)) === null || _a === void 0 ? void 0 : _a.setExpanded(false);
  }
  handleKeyRight(e) {
    var _a;
    (_a = this.getComponentForKeyEvent(e)) === null || _a === void 0 ? void 0 : _a.setExpanded(true);
  }
  getComponentForKeyEvent(e) {
    var _a;
    const eDocument = this.gridOptionsService.getDocument();
    if (!this.eSetFilterList.contains(eDocument.activeElement) || !this.virtualList) {
      return;
    }
    const currentItem = this.virtualList.getLastFocusedRow();
    if (currentItem == null) {
      return;
    }
    const component = this.virtualList.getComponentAt(currentItem);
    if (component == null) {
      return;
    }
    e.preventDefault();
    const {
      readOnly
    } = (_a = this.setFilterParams) !== null && _a !== void 0 ? _a : {};
    if (!!readOnly) {
      return;
    }
    return component;
  }
  getCssIdentifier() {
    return 'set-filter';
  }
  setModel(model) {
    var _a;
    if (model == null && ((_a = this.valueModel) === null || _a === void 0 ? void 0 : _a.getModel()) == null) {
      this.setMiniFilter(null);
      return ZingPromise.resolve();
    }
    return super.setModel(model);
  }
  refresh(params) {
    var _a, _b, _c;
    if (!super.refresh(params)) {
      return false;
    }
    const paramsThatForceReload = ['treeList', 'treeListFormatter', 'treeListPathGetter', 'keyCreator', 'convertValuesToStrings', 'caseSensitive', 'comparator', 'suppressSelectAll', 'excelMode'];
    if (paramsThatForceReload.some(param => {
      var _a;
      return params[param] !== ((_a = this.setFilterParams) === null || _a === void 0 ? void 0 : _a[param]);
    })) {
      return false;
    }
    if (this.haveColDefParamsChanged(params.colDef)) {
      return false;
    }
    super.updateParams(params);
    this.updateSetFilterOnParamsChange(params);
    this.updateMiniFilter();
    if (params.cellRenderer !== ((_a = this.setFilterParams) === null || _a === void 0 ? void 0 : _a.cellRenderer) || params.valueFormatter !== ((_b = this.setFilterParams) === null || _b === void 0 ? void 0 : _b.valueFormatter)) {
      this.checkAndRefreshVirtualList();
    }
    (_c = this.valueModel) === null || _c === void 0 ? void 0 : _c.updateOnParamsChange(params).then(() => {
      var _a;
      if ((_a = this.valueModel) === null || _a === void 0 ? void 0 : _a.hasSelections()) {
        this.refreshFilterValues();
      }
    });
    return true;
  }
  haveColDefParamsChanged(colDef) {
    var _a;
    const paramsThatForceReload = ['keyCreator', 'filterValueGetter'];
    const existingColDef = (_a = this.setFilterParams) === null || _a === void 0 ? void 0 : _a.colDef;
    return paramsThatForceReload.some(param => colDef[param] !== (existingColDef === null || existingColDef === void 0 ? void 0 : existingColDef[param]));
  }
  setModelAndRefresh(values) {
    return this.valueModel ? this.valueModel.setModel(values).then(() => this.checkAndRefreshVirtualList()) : ZingPromise.resolve();
  }
  resetUiToDefaults() {
    this.setMiniFilter(null);
    return this.setModelAndRefresh(null);
  }
  setModelIntoUi(model) {
    this.setMiniFilter(null);
    const values = model == null ? null : model.values;
    return this.setModelAndRefresh(values);
  }
  getModelFromUi() {
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    const values = this.valueModel.getModel();
    if (!values) {
      return null;
    }
    return {
      values,
      filterType: this.getFilterType()
    };
  }
  getFilterType() {
    return 'set';
  }
  getValueModel() {
    return this.valueModel;
  }
  areModelsEqual(a, b) {
    if (a == null && b == null) {
      return true;
    }
    return a != null && b != null && _.areEqual(a.values, b.values);
  }
  setParams(params) {
    var _a;
    this.applyExcelModeOptions(params);
    super.setParams(params);
    this.updateSetFilterOnParamsChange(params);
    const keyCreator = (_a = params.keyCreator) !== null && _a !== void 0 ? _a : params.colDef.keyCreator;
    this.valueModel = new SetValueModel({
      filterParams: params,
      setIsLoading: loading => this.setIsLoading(loading),
      valueFormatterService: this.valueFormatterService,
      translate: key => this.translateForSetFilter(key),
      caseFormat: v => this.caseFormat(v),
      createKey: this.createKey,
      valueFormatter: this.valueFormatter,
      usingComplexObjects: !!keyCreator,
      gridOptionsService: this.gridOptionsService,
      columnModel: this.columnModel,
      valueService: this.valueService,
      treeDataTreeList: this.treeDataTreeList,
      groupingTreeList: this.groupingTreeList,
      addManagedListener: (event, listener) => this.addManagedListener(this.eventService, event, listener)
    });
    this.initialiseFilterBodyUi();
    this.addEventListenersForDataChanges();
  }
  onAddCurrentSelectionToFilterChange(newValue) {
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    this.valueModel.setAddCurrentSelectionToFilter(newValue);
  }
  setValueFormatter(providedValueFormatter, keyCreator, convertValuesToStrings, treeList, isRefData) {
    let valueFormatter = providedValueFormatter;
    if (!valueFormatter) {
      if (keyCreator && !convertValuesToStrings && !treeList) {
        throw new Error('ZING Grid: Must supply a Value Formatter in Set Filter params when using a Key Creator unless convertValuesToStrings is enabled');
      }
      this.noValueFormatterSupplied = true;
      if (!isRefData) {
        valueFormatter = params => _.toStringOrNull(params.value);
      }
    }
    this.valueFormatter = valueFormatter;
  }
  generateCreateKey(keyCreator, convertValuesToStrings, treeDataOrGrouping) {
    if (treeDataOrGrouping && !keyCreator) {
      throw new Error('ZING Grid: Must supply a Key Creator in Set Filter params when `treeList = true` on a group column, and Tree Data or Row Grouping is enabled.');
    }
    if (keyCreator) {
      return (value, node = null) => {
        const params = this.getKeyCreatorParams(value, node);
        return _.makeNull(keyCreator(params));
      };
    }
    if (convertValuesToStrings) {
      return value => Array.isArray(value) ? value : _.makeNull(_.toStringOrNull(value));
    } else {
      return value => _.makeNull(_.toStringOrNull(value));
    }
  }
  getFormattedValue(key) {
    var _a;
    let value = this.valueModel.getValue(key);
    if (this.noValueFormatterSupplied && (this.treeDataTreeList || this.groupingTreeList) && Array.isArray(value)) {
      value = _.last(value);
    }
    const formattedValue = this.valueFormatterService.formatValue(this.setFilterParams.column, null, value, this.valueFormatter, false);
    return (_a = formattedValue == null ? _.toStringOrNull(value) : formattedValue) !== null && _a !== void 0 ? _a : this.translateForSetFilter('blanks');
  }
  applyExcelModeOptions(params) {
    if (params.excelMode === 'windows') {
      if (!params.buttons) {
        params.buttons = ['apply', 'cancel'];
      }
      if (params.closeOnApply == null) {
        params.closeOnApply = true;
      }
    } else if (params.excelMode === 'mac') {
      if (!params.buttons) {
        params.buttons = ['reset'];
      }
      if (params.applyMiniFilterWhileTyping == null) {
        params.applyMiniFilterWhileTyping = true;
      }
      if (params.debounceMs == null) {
        params.debounceMs = 500;
      }
    }
    if (params.excelMode && params.defaultToNothingSelected) {
      params.defaultToNothingSelected = false;
      _.warnOnce('The Set Filter Parameter "defaultToNothingSelected" value was ignored because it does not work when "excelMode" is used.');
    }
  }
  addEventListenersForDataChanges() {
    if (!this.isValuesTakenFromGrid()) {
      return;
    }
    this.addManagedListener(this.eventService, Events.EVENT_CELL_VALUE_CHANGED, event => {
      if (this.setFilterParams && event.column === this.setFilterParams.column) {
        this.syncAfterDataChange();
      }
    });
    this.addManagedPropertyListeners(['treeData', 'getDataPath', 'groupAllowUnbalanced'], () => {
      this.syncAfterDataChange();
    });
  }
  syncAfterDataChange() {
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    let promise = this.valueModel.refreshValues();
    return promise.then(() => {
      this.checkAndRefreshVirtualList();
      this.onBtApply(false, true);
    });
  }
  setIsLoading(isLoading) {
    _.setDisplayed(this.eFilterLoading, isLoading);
    if (!isLoading) {
      this.hardRefreshVirtualList = true;
    }
  }
  initialiseFilterBodyUi() {
    this.initVirtualList();
    this.initMiniFilter();
  }
  initVirtualList() {
    if (!this.setFilterParams) {
      throw new Error('Set filter params have not been provided.');
    }
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    const translate = this.localeService.getLocaleTextFunc();
    const filterListName = translate('ariaFilterList', 'Filter List');
    const isTree = !!this.setFilterParams.treeList;
    const virtualList = this.virtualList = this.createBean(new VirtualList({
      cssIdentifier: 'filter',
      ariaRole: isTree ? 'tree' : 'listbox',
      listName: filterListName
    }));
    const eSetFilterList = this.getRefElement('eSetFilterList');
    if (isTree) {
      eSetFilterList.classList.add('zing-set-filter-tree-list');
    }
    if (eSetFilterList) {
      eSetFilterList.appendChild(virtualList.getGui());
    }
    const {
      cellHeight
    } = this.setFilterParams;
    if (cellHeight != null) {
      virtualList.setRowHeight(cellHeight);
    }
    const componentCreator = (item, listItemElement) => this.createSetListItem(item, isTree, listItemElement);
    virtualList.setComponentCreator(componentCreator);
    const componentUpdater = (item, component) => this.updateSetListItem(item, component);
    virtualList.setComponentUpdater(componentUpdater);
    let model;
    if (this.setFilterParams.suppressSelectAll) {
      model = new ModelWrapper(this.valueModel);
    } else {
      model = new ModelWrapperWithSelectAll(this.valueModel, () => this.isSelectAllSelected());
    }
    if (isTree) {
      model = new TreeModelWrapper(model);
    }
    virtualList.setModel(model);
  }
  getSelectAllLabel() {
    if (!this.setFilterParams) {
      throw new Error('Set filter params have not been provided.');
    }
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    const key = this.valueModel.getMiniFilter() == null || !this.setFilterParams.excelMode ? 'selectAll' : 'selectAllSearchResults';
    return this.translateForSetFilter(key);
  }
  getAddSelectionToFilterLabel() {
    if (!this.setFilterParams) {
      throw new Error('Set filter params have not been provided.');
    }
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    return this.translateForSetFilter('addCurrentSelectionToFilter');
  }
  createSetListItem(item, isTree, focusWrapper) {
    if (!this.setFilterParams) {
      throw new Error('Set filter params have not been provided.');
    }
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    const groupsExist = this.valueModel.hasGroups();
    const {
      isSelected,
      isExpanded
    } = this.isSelectedExpanded(item);
    const {
      value,
      depth,
      isGroup,
      hasIndeterminateExpandState,
      selectedListener,
      expandedListener
    } = this.newSetListItemAttributes(item, isTree);
    const itemParams = {
      focusWrapper,
      value,
      params: this.setFilterParams,
      translate: translateKey => this.translateForSetFilter(translateKey),
      valueFormatter: this.valueFormatter,
      item,
      isSelected,
      isTree,
      depth,
      groupsExist,
      isGroup,
      isExpanded,
      hasIndeterminateExpandState
    };
    const listItem = this.createBean(new SetFilterListItem(itemParams));
    listItem.addEventListener(SetFilterListItem.EVENT_SELECTION_CHANGED, selectedListener);
    if (expandedListener) {
      listItem.addEventListener(SetFilterListItem.EVENT_EXPANDED_CHANGED, expandedListener);
    }
    return listItem;
  }
  newSetTreeItemAttributes(item, isTree) {
    var _a, _b, _c, _d, _e, _f;
    if (!this.setFilterParams) {
      throw new Error('Set filter params have not been provided.');
    }
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    const groupsExist = this.valueModel.hasGroups();
    if (item.key === SetFilterDisplayValue.SELECT_ALL) {
      return {
        value: () => this.getSelectAllLabel(),
        isGroup: groupsExist,
        depth: item.depth,
        hasIndeterminateExpandState: true,
        selectedListener: e => this.onSelectAll(e.isSelected),
        expandedListener: e => this.onExpandAll(e.item, e.isExpanded)
      };
    }
    if (item.key === SetFilterDisplayValue.ADD_SELECTION_TO_FILTER) {
      return {
        value: () => this.getAddSelectionToFilterLabel(),
        depth: item.depth,
        isGroup: false,
        hasIndeterminateExpandState: false,
        selectedListener: e => {
          this.onAddCurrentSelectionToFilterChange(e.isSelected);
        }
      };
    }
    if (item.children) {
      return {
        value: (_c = (_b = (_a = this.setFilterParams).treeListFormatter) === null || _b === void 0 ? void 0 : _b.call(_a, item.treeKey, item.depth, item.parentTreeKeys)) !== null && _c !== void 0 ? _c : item.treeKey,
        depth: item.depth,
        isGroup: true,
        selectedListener: e => this.onGroupItemSelected(e.item, e.isSelected),
        expandedListener: e => this.onExpandedChanged(e.item, e.isExpanded)
      };
    }
    return {
      value: (_f = (_e = (_d = this.setFilterParams).treeListFormatter) === null || _e === void 0 ? void 0 : _e.call(_d, item.treeKey, item.depth, item.parentTreeKeys)) !== null && _f !== void 0 ? _f : item.treeKey,
      depth: item.depth,
      selectedListener: e => this.onItemSelected(e.item.key, e.isSelected)
    };
  }
  newSetListItemAttributes(item, isTree) {
    if (!this.setFilterParams) {
      throw new Error('Set filter params have not been provided.');
    }
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    if (this.isSetFilterModelTreeItem(item)) {
      return this.newSetTreeItemAttributes(item, isTree);
    }
    if (item === SetFilterDisplayValue.SELECT_ALL) {
      return {
        value: () => this.getSelectAllLabel(),
        selectedListener: e => this.onSelectAll(e.isSelected)
      };
    }
    if (item === SetFilterDisplayValue.ADD_SELECTION_TO_FILTER) {
      return {
        value: () => this.getAddSelectionToFilterLabel(),
        selectedListener: e => {
          this.onAddCurrentSelectionToFilterChange(e.isSelected);
        }
      };
    }
    return {
      value: this.valueModel.getValue(item),
      selectedListener: e => this.onItemSelected(e.item, e.isSelected)
    };
  }
  updateSetListItem(item, component) {
    const {
      isSelected,
      isExpanded
    } = this.isSelectedExpanded(item);
    component.refresh(item, isSelected, isExpanded);
  }
  isSelectedExpanded(item) {
    let isSelected;
    let isExpanded;
    if (this.isSetFilterModelTreeItem(item)) {
      isExpanded = item.expanded;
      if (item.key === SetFilterDisplayValue.SELECT_ALL) {
        isSelected = this.isSelectAllSelected();
      } else if (item.key === SetFilterDisplayValue.ADD_SELECTION_TO_FILTER) {
        isSelected = this.valueModel.isAddCurrentSelectionToFilterChecked();
      } else if (item.children) {
        isSelected = this.areAllChildrenSelected(item);
      } else {
        isSelected = this.valueModel.isKeySelected(item.key);
      }
    } else {
      if (item === SetFilterDisplayValue.SELECT_ALL) {
        isSelected = this.isSelectAllSelected();
      } else if (item === SetFilterDisplayValue.ADD_SELECTION_TO_FILTER) {
        isSelected = this.valueModel.isAddCurrentSelectionToFilterChecked();
      } else {
        isSelected = this.valueModel.isKeySelected(item);
      }
    }
    return {
      isSelected,
      isExpanded
    };
  }
  isSetFilterModelTreeItem(item) {
    return (item === null || item === void 0 ? void 0 : item.treeKey) !== undefined;
  }
  initMiniFilter() {
    if (!this.setFilterParams) {
      throw new Error('Set filter params have not been provided.');
    }
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    const {
      eMiniFilter,
      localeService
    } = this;
    const translate = localeService.getLocaleTextFunc();
    eMiniFilter.setDisplayed(!this.setFilterParams.suppressMiniFilter);
    eMiniFilter.setValue(this.valueModel.getMiniFilter());
    eMiniFilter.onValueChange(() => this.onMiniFilterInput());
    eMiniFilter.setInputAriaLabel(translate('ariaSearchFilterValues', 'Search filter values'));
    this.addManagedListener(eMiniFilter.getInputElement(), 'keydown', e => this.onMiniFilterKeyDown(e));
  }
  updateMiniFilter() {
    if (!this.setFilterParams) {
      throw new Error('Set filter params have not been provided.');
    }
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    const {
      eMiniFilter
    } = this;
    if (eMiniFilter.isDisplayed() !== !this.setFilterParams.suppressMiniFilter) {
      eMiniFilter.setDisplayed(!this.setFilterParams.suppressMiniFilter);
    }
    const miniFilterValue = this.valueModel.getMiniFilter();
    if (eMiniFilter.getValue() !== miniFilterValue) {
      eMiniFilter.setValue(miniFilterValue);
    }
  }
  afterGuiAttached(params) {
    if (!this.setFilterParams) {
      throw new Error('Set filter params have not been provided.');
    }
    super.afterGuiAttached(params);
    this.resetExpansion();
    this.refreshVirtualList();
    const {
      eMiniFilter
    } = this;
    eMiniFilter.setInputPlaceholder(this.translateForSetFilter('searchOoo'));
    if (!params || !params.suppressFocus) {
      eMiniFilter.getFocusableElement().focus();
    }
  }
  afterGuiDetached() {
    var _a, _b;
    super.afterGuiDetached();
    if ((_a = this.setFilterParams) === null || _a === void 0 ? void 0 : _a.excelMode) {
      this.resetMiniFilter();
    }
    const appliedModel = this.getModel();
    if (((_b = this.setFilterParams) === null || _b === void 0 ? void 0 : _b.excelMode) || !this.areModelsEqual(appliedModel, this.getModelFromUi())) {
      this.resetUiToActiveModel(appliedModel);
      this.showOrHideResults();
    }
  }
  applyModel(source = 'api') {
    if (!this.setFilterParams) {
      throw new Error('Set filter params have not been provided.');
    }
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    if (this.setFilterParams.excelMode && source !== 'rowDataUpdated' && this.valueModel.isEverythingVisibleSelected()) {
      this.valueModel.selectAllMatchingMiniFilter();
    }
    const shouldKeepCurrentSelection = this.valueModel.showAddCurrentSelectionToFilter() && this.valueModel.isAddCurrentSelectionToFilterChecked();
    if (shouldKeepCurrentSelection && !this.getModel()) {
      return false;
    }
    const result = super.applyModel(source);
    const appliedModel = this.getModel();
    if (appliedModel) {
      if (!shouldKeepCurrentSelection) {
        this.valueModel.setAppliedModelKeys(new Set());
      }
      appliedModel.values.forEach(key => {
        this.valueModel.addToAppliedModelKeys(key);
      });
    } else {
      if (!shouldKeepCurrentSelection) {
        this.valueModel.setAppliedModelKeys(null);
      }
    }
    return result;
  }
  isModelValid(model) {
    return this.setFilterParams && this.setFilterParams.excelMode ? model == null || model.values.length > 0 : true;
  }
  doesFilterPass(params) {
    if (!this.setFilterParams || !this.valueModel || !this.valueModel.getCaseFormattedAppliedModelKeys()) {
      return true;
    }
    if (!this.valueModel.hasAnyAppliedModelKey()) {
      return false;
    }
    const {
      node,
      data
    } = params;
    if (this.treeDataTreeList) {
      return this.doesFilterPassForTreeData(node, data);
    }
    if (this.groupingTreeList) {
      return this.doesFilterPassForGrouping(node);
    }
    let value = this.getValueFromNode(node);
    if (this.convertValuesToStrings) {
      return this.doesFilterPassForConvertValuesToString(node, value);
    }
    if (value != null && Array.isArray(value)) {
      if (value.length === 0) {
        return this.valueModel.hasAppliedModelKey(null);
      }
      return value.some(v => this.isInAppliedModel(this.createKey(v, node)));
    }
    return this.isInAppliedModel(this.createKey(value, node));
  }
  doesFilterPassForConvertValuesToString(node, value) {
    const key = this.createKey(value, node);
    if (key != null && Array.isArray(key)) {
      if (key.length === 0) {
        return this.valueModel.hasAppliedModelKey(null);
      }
      return key.some(v => this.isInAppliedModel(v));
    }
    return this.isInAppliedModel(key);
  }
  doesFilterPassForTreeData(node, data) {
    var _a;
    if ((_a = node.childrenAfterGroup) === null || _a === void 0 ? void 0 : _a.length) {
      return false;
    }
    return this.isInAppliedModel(this.createKey(this.checkMakeNullDataPath(this.getDataPath(data))));
  }
  doesFilterPassForGrouping(node) {
    const dataPath = this.columnModel.getRowGroupColumns().map(groupCol => this.valueService.getKeyForNode(groupCol, node));
    dataPath.push(this.getValueFromNode(node));
    return this.isInAppliedModel(this.createKey(this.checkMakeNullDataPath(dataPath)));
  }
  checkMakeNullDataPath(dataPath) {
    if (dataPath) {
      dataPath = dataPath.map(treeKey => _.toStringOrNull(_.makeNull(treeKey)));
    }
    if (dataPath === null || dataPath === void 0 ? void 0 : dataPath.some(treeKey => treeKey == null)) {
      return null;
    }
    return dataPath;
  }
  isInAppliedModel(key) {
    return this.valueModel.hasAppliedModelKey(key);
  }
  getValueFromNode(node) {
    return this.setFilterParams.getValue(node);
  }
  getKeyCreatorParams(value, node = null) {
    return {
      value,
      colDef: this.setFilterParams.colDef,
      column: this.setFilterParams.column,
      node: node,
      data: node === null || node === void 0 ? void 0 : node.data,
      api: this.setFilterParams.api,
      columnApi: this.setFilterParams.columnApi,
      context: this.setFilterParams.context
    };
  }
  onNewRowsLoaded() {
    if (!this.isValuesTakenFromGrid()) {
      return;
    }
    this.syncAfterDataChange();
  }
  isValuesTakenFromGrid() {
    if (!this.valueModel) {
      return false;
    }
    const valuesType = this.valueModel.getValuesType();
    return valuesType === SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES;
  }
  setFilterValues(values) {
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    this.valueModel.overrideValues(values).then(() => {
      this.checkAndRefreshVirtualList();
      this.onUiChanged();
    });
  }
  resetFilterValues() {
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    this.valueModel.setValuesType(SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES);
    this.syncAfterDataChange();
  }
  refreshFilterValues() {
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    if (!this.valueModel.isInitialised()) {
      return;
    }
    this.valueModel.refreshValues().then(() => {
      this.checkAndRefreshVirtualList();
      this.onUiChanged();
    });
  }
  onAnyFilterChanged() {
    setTimeout(() => {
      if (!this.isAlive()) {
        return;
      }
      if (!this.valueModel) {
        throw new Error('Value model has not been created.');
      }
      this.valueModel.refreshAfterAnyFilterChanged().then(refresh => {
        if (refresh) {
          this.checkAndRefreshVirtualList();
          this.showOrHideResults();
        }
      });
    }, 0);
  }
  onMiniFilterInput() {
    if (!this.setFilterParams) {
      throw new Error('Set filter params have not been provided.');
    }
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    if (!this.valueModel.setMiniFilter(this.eMiniFilter.getValue())) {
      return;
    }
    const {
      applyMiniFilterWhileTyping,
      readOnly
    } = this.setFilterParams || {};
    if (!readOnly && applyMiniFilterWhileTyping) {
      this.filterOnAllVisibleValues(false);
    } else {
      this.updateUiAfterMiniFilterChange();
    }
  }
  updateUiAfterMiniFilterChange() {
    if (!this.setFilterParams) {
      throw new Error('Set filter params have not been provided.');
    }
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    const {
      excelMode,
      readOnly
    } = this.setFilterParams || {};
    if (excelMode == null || !!readOnly) {
      this.checkAndRefreshVirtualList();
    } else if (this.valueModel.getMiniFilter() == null) {
      this.resetUiToActiveModel(this.getModel());
    } else {
      this.valueModel.selectAllMatchingMiniFilter(true);
      this.checkAndRefreshVirtualList();
      this.onUiChanged();
    }
    this.showOrHideResults();
  }
  showOrHideResults() {
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    const hideResults = this.valueModel.getMiniFilter() != null && this.valueModel.getDisplayedValueCount() < 1;
    _.setDisplayed(this.eNoMatches, hideResults);
    _.setDisplayed(this.eSetFilterList, !hideResults);
  }
  resetMiniFilter() {
    var _a;
    this.eMiniFilter.setValue(null, true);
    (_a = this.valueModel) === null || _a === void 0 ? void 0 : _a.setMiniFilter(null);
  }
  resetUiToActiveModel(currentModel, afterUiUpdatedFunc) {
    this.setModelAndRefresh(currentModel == null ? null : currentModel.values).then(() => {
      this.onUiChanged(false, 'prevent');
      afterUiUpdatedFunc === null || afterUiUpdatedFunc === void 0 ? void 0 : afterUiUpdatedFunc();
    });
  }
  handleCancelEnd(e) {
    this.setMiniFilter(null);
    super.handleCancelEnd(e);
  }
  onMiniFilterKeyDown(e) {
    const {
      excelMode,
      readOnly
    } = this.setFilterParams || {};
    if (e.key === KeyCode.ENTER && !excelMode && !readOnly) {
      this.filterOnAllVisibleValues();
    }
  }
  filterOnAllVisibleValues(applyImmediately = true) {
    const {
      readOnly
    } = this.setFilterParams || {};
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    if (!!readOnly) {
      throw new Error('Unable to filter in readOnly mode.');
    }
    this.valueModel.selectAllMatchingMiniFilter(true);
    this.checkAndRefreshVirtualList();
    this.onUiChanged(false, applyImmediately ? 'immediately' : 'debounce');
    this.showOrHideResults();
  }
  focusRowIfAlive(rowIndex) {
    if (rowIndex == null) {
      return;
    }
    window.setTimeout(() => {
      if (!this.virtualList) {
        throw new Error('Virtual list has not been created.');
      }
      if (this.isAlive()) {
        this.virtualList.focusRow(rowIndex);
      }
    }, 0);
  }
  onSelectAll(isSelected) {
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    if (!this.virtualList) {
      throw new Error('Virtual list has not been created.');
    }
    if (isSelected) {
      this.valueModel.selectAllMatchingMiniFilter();
    } else {
      this.valueModel.deselectAllMatchingMiniFilter();
    }
    this.refreshAfterSelection();
  }
  onGroupItemSelected(item, isSelected) {
    const recursiveGroupSelection = i => {
      if (i.children) {
        i.children.forEach(childItem => recursiveGroupSelection(childItem));
      } else {
        this.selectItem(i.key, isSelected);
      }
    };
    recursiveGroupSelection(item);
    this.refreshAfterSelection();
  }
  onItemSelected(key, isSelected) {
    if (!this.valueModel) {
      throw new Error('Value model has not been created.');
    }
    if (!this.virtualList) {
      throw new Error('Virtual list has not been created.');
    }
    this.selectItem(key, isSelected);
    this.refreshAfterSelection();
  }
  selectItem(key, isSelected) {
    if (isSelected) {
      this.valueModel.selectKey(key);
    } else {
      this.valueModel.deselectKey(key);
    }
  }
  onExpandAll(item, isExpanded) {
    const recursiveExpansion = i => {
      if (i.filterPasses && i.available && i.children) {
        i.children.forEach(childItem => recursiveExpansion(childItem));
        i.expanded = isExpanded;
      }
    };
    recursiveExpansion(item);
    this.refreshAfterExpansion();
  }
  onExpandedChanged(item, isExpanded) {
    item.expanded = isExpanded;
    this.refreshAfterExpansion();
  }
  refreshAfterExpansion() {
    const focusedRow = this.virtualList.getLastFocusedRow();
    this.valueModel.updateDisplayedValues('expansion');
    this.checkAndRefreshVirtualList();
    this.focusRowIfAlive(focusedRow);
  }
  refreshAfterSelection() {
    const focusedRow = this.virtualList.getLastFocusedRow();
    this.checkAndRefreshVirtualList();
    this.onUiChanged();
    this.focusRowIfAlive(focusedRow);
  }
  setMiniFilter(newMiniFilter) {
    this.eMiniFilter.setValue(newMiniFilter);
    this.onMiniFilterInput();
  }
  getMiniFilter() {
    return this.valueModel ? this.valueModel.getMiniFilter() : null;
  }
  checkAndRefreshVirtualList() {
    if (!this.virtualList) {
      throw new Error('Virtual list has not been created.');
    }
    this.virtualList.refresh(!this.hardRefreshVirtualList);
    if (this.hardRefreshVirtualList) {
      this.hardRefreshVirtualList = false;
    }
  }
  getFilterKeys() {
    return this.valueModel ? this.valueModel.getKeys() : [];
  }
  getFilterValues() {
    return this.valueModel ? this.valueModel.getValues() : [];
  }
  getValues() {
    return this.getFilterKeys();
  }
  refreshVirtualList() {
    if (this.setFilterParams && this.setFilterParams.refreshValuesOnOpen) {
      this.refreshFilterValues();
    } else {
      this.checkAndRefreshVirtualList();
    }
  }
  translateForSetFilter(key) {
    const translate = this.localeService.getLocaleTextFunc();
    return translate(key, DEFAULT_LOCALE_TEXT[key]);
  }
  isSelectAllSelected() {
    if (!this.setFilterParams || !this.valueModel) {
      return false;
    }
    if (!this.setFilterParams.defaultToNothingSelected) {
      if (this.valueModel.hasSelections() && this.valueModel.isNothingVisibleSelected()) {
        return false;
      }
      if (this.valueModel.isEverythingVisibleSelected()) {
        return true;
      }
    } else {
      if (this.valueModel.hasSelections() && this.valueModel.isEverythingVisibleSelected()) {
        return true;
      }
      if (this.valueModel.isNothingVisibleSelected()) {
        return false;
      }
    }
    return undefined;
  }
  areAllChildrenSelected(item) {
    const recursiveChildSelectionCheck = i => {
      if (i.children) {
        let someTrue = false;
        let someFalse = false;
        const mixed = i.children.some(child => {
          if (!child.filterPasses || !child.available) {
            return false;
          }
          const childSelected = recursiveChildSelectionCheck(child);
          if (childSelected === undefined) {
            return true;
          }
          if (childSelected) {
            someTrue = true;
          } else {
            someFalse = true;
          }
          return someTrue && someFalse;
        });
        return mixed ? undefined : someTrue;
      } else {
        return this.valueModel.isKeySelected(i.key);
      }
    };
    if (!this.setFilterParams.defaultToNothingSelected) {
      return recursiveChildSelectionCheck(item);
    } else {
      return this.valueModel.hasSelections() && recursiveChildSelectionCheck(item);
    }
  }
  destroy() {
    if (this.virtualList != null) {
      this.virtualList.destroy();
      this.virtualList = null;
    }
    super.destroy();
  }
  caseFormat(valueToFormat) {
    if (valueToFormat == null || typeof valueToFormat !== 'string') {
      return valueToFormat;
    }
    return this.caseSensitive ? valueToFormat : valueToFormat.toUpperCase();
  }
  resetExpansion() {
    var _a, _b;
    if (!((_a = this.setFilterParams) === null || _a === void 0 ? void 0 : _a.treeList)) {
      return;
    }
    const selectAllItem = (_b = this.valueModel) === null || _b === void 0 ? void 0 : _b.getSelectAllItem();
    if (this.isSetFilterModelTreeItem(selectAllItem)) {
      const recursiveCollapse = i => {
        if (i.children) {
          i.children.forEach(childItem => recursiveCollapse(childItem));
          i.expanded = false;
        }
      };
      recursiveCollapse(selectAllItem);
      this.valueModel.updateDisplayedValues('expansion');
    }
  }
  getModelAsString(model) {
    return this.filterModelFormatter.getModelAsString(model, this);
  }
  getPositionableElement() {
    return this.eSetFilterList;
  }
}
__decorate([RefSelector('eMiniFilter')], SetFilter.prototype, "eMiniFilter", void 0);
__decorate([RefSelector('eFilterLoading')], SetFilter.prototype, "eFilterLoading", void 0);
__decorate([RefSelector('eSetFilterList')], SetFilter.prototype, "eSetFilterList", void 0);
__decorate([RefSelector('eFilterNoMatches')], SetFilter.prototype, "eNoMatches", void 0);
__decorate([Autowired('valueFormatterService')], SetFilter.prototype, "valueFormatterService", void 0);
__decorate([Autowired('columnModel')], SetFilter.prototype, "columnModel", void 0);
__decorate([Autowired('valueService')], SetFilter.prototype, "valueService", void 0);
class ModelWrapper {
  constructor(model) {
    this.model = model;
  }
  getRowCount() {
    return this.model.getDisplayedValueCount();
  }
  getRow(index) {
    return this.model.getDisplayedItem(index);
  }
  areRowsEqual(oldRow, newRow) {
    return oldRow === newRow;
  }
}
class ModelWrapperWithSelectAll {
  constructor(model, isSelectAllSelected) {
    this.model = model;
    this.isSelectAllSelected = isSelectAllSelected;
  }
  getRowCount() {
    const showAddCurrentSelectionToFilter = this.model.showAddCurrentSelectionToFilter();
    const outboundItems = showAddCurrentSelectionToFilter ? 2 : 1;
    return this.model.getDisplayedValueCount() + outboundItems;
  }
  getRow(index) {
    if (index === 0) {
      return this.model.getSelectAllItem();
    }
    const showAddCurrentSelectionToFilter = this.model.showAddCurrentSelectionToFilter();
    const outboundItems = showAddCurrentSelectionToFilter ? 2 : 1;
    if (index === 1 && showAddCurrentSelectionToFilter) {
      return this.model.getAddSelectionToFilterItem();
    }
    return this.model.getDisplayedItem(index - outboundItems);
  }
  areRowsEqual(oldRow, newRow) {
    return oldRow === newRow;
  }
}
class TreeModelWrapper {
  constructor(model) {
    this.model = model;
  }
  getRowCount() {
    return this.model.getRowCount();
  }
  getRow(index) {
    return this.model.getRow(index);
  }
  areRowsEqual(oldRow, newRow) {
    if (oldRow == null && newRow == null) {
      return true;
    }
    return oldRow != null && newRow != null && oldRow.treeKey === newRow.treeKey && oldRow.depth === newRow.depth;
  }
}