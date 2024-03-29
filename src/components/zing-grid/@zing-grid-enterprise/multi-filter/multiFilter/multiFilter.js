var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { ProvidedFilter, ZingPromise, Autowired, ZingGroupComponent, TabGuardComp, ZingMenuItemComponent, PostConstruct, _ } from '@/components/zing-grid/@zing-grid-community/core/main.js';
export class MultiFilter extends TabGuardComp {
  constructor() {
    super(`<div class="zing-multi-filter zing-menu-list-compact"></div>`);
    this.filterDefs = [];
    this.filters = [];
    this.guiDestroyFuncs = [];
    this.activeFilterIndices = [];
    this.lastActivatedMenuItem = null;
    this.afterFiltersReadyFuncs = [];
  }
  postConstruct() {
    this.initialiseTabGuard({
      onFocusIn: e => this.onFocusIn(e)
    });
  }
  static getFilterDefs(params) {
    const {
      filters
    } = params;
    return filters && filters.length > 0 ? filters : [{
      filter: 'zingTextColumnFilter'
    }, {
      filter: 'zingSetColumnFilter'
    }];
  }
  init(params) {
    this.params = params;
    this.filterDefs = MultiFilter.getFilterDefs(params);
    const {
      column,
      filterChangedCallback
    } = params;
    this.column = column;
    this.filterChangedCallback = filterChangedCallback;
    const filterPromises = [];
    this.filterDefs.forEach((filterDef, index) => {
      const filterPromise = this.createFilter(filterDef, index);
      if (filterPromise != null) {
        filterPromises.push(filterPromise);
      }
    });
    return ZingPromise.all(filterPromises).then(filters => {
      this.filters = filters;
      this.refreshGui('columnMenu');
      this.afterFiltersReadyFuncs.forEach(f => f());
      this.afterFiltersReadyFuncs.length = 0;
    });
  }
  refreshGui(container) {
    if (container === this.lastOpenedInContainer) {
      return;
    }
    this.removeAllChildrenExceptTabGuards();
    this.destroyChildren();
    this.filters.forEach((filter, index) => {
      if (index > 0) {
        this.appendChild(_.loadTemplate(`<div class="zing-filter-separator"></div>`));
      }
      const filterDef = this.filterDefs[index];
      const filterTitle = this.getFilterTitle(filter, filterDef);
      let filterGui;
      if (filterDef.display === 'subMenu' && container !== 'toolPanel') {
        const menuItem = this.insertFilterMenu(filter, filterTitle);
        filterGui = menuItem.getGui();
      } else if (filterDef.display === 'subMenu' || filterDef.display === 'accordion') {
        const group = this.insertFilterGroup(filter, filterTitle);
        filterGui = group.getGui();
      } else {
        filterGui = filter.getGui();
      }
      this.appendChild(filterGui);
    });
    this.lastOpenedInContainer = container;
  }
  getFilterTitle(filter, filterDef) {
    if (filterDef.title != null) {
      return filterDef.title;
    }
    const filterWithoutType = filter;
    return typeof filterWithoutType.getFilterTitle === 'function' ? filterWithoutType.getFilterTitle() : 'Filter';
  }
  destroyChildren() {
    this.guiDestroyFuncs.forEach(func => func());
    this.guiDestroyFuncs.length = 0;
  }
  insertFilterMenu(filter, name) {
    const menuItem = this.createBean(new ZingMenuItemComponent({
      name,
      subMenu: filter,
      cssClasses: ['zing-multi-filter-menu-item'],
      isCompact: true,
      isAnotherSubMenuOpen: () => false
    }));
    menuItem.setParentComponent(this);
    this.guiDestroyFuncs.push(() => this.destroyBean(menuItem));
    this.addManagedListener(menuItem, ZingMenuItemComponent.EVENT_MENU_ITEM_ACTIVATED, event => {
      if (this.lastActivatedMenuItem && this.lastActivatedMenuItem !== event.menuItem) {
        this.lastActivatedMenuItem.deactivate();
      }
      this.lastActivatedMenuItem = event.menuItem;
    });
    menuItem.addGuiEventListener('focusin', () => menuItem.activate());
    menuItem.addGuiEventListener('focusout', () => {
      if (!menuItem.isSubMenuOpen()) {
        menuItem.deactivate();
      }
    });
    return menuItem;
  }
  insertFilterGroup(filter, title) {
    const group = this.createBean(new ZingGroupComponent({
      title,
      cssIdentifier: 'multi-filter'
    }));
    this.guiDestroyFuncs.push(() => this.destroyBean(group));
    group.addItem(filter.getGui());
    group.toggleGroupExpand(false);
    if (filter.afterGuiAttached) {
      group.addManagedListener(group, ZingGroupComponent.EVENT_EXPANDED, () => filter.afterGuiAttached({
        container: this.lastOpenedInContainer,
        suppressFocus: true,
        hidePopup: this.hidePopup
      }));
    }
    return group;
  }
  isFilterActive() {
    return this.filters.some(filter => filter.isFilterActive());
  }
  getLastActiveFilterIndex() {
    return this.activeFilterIndices.length > 0 ? this.activeFilterIndices[this.activeFilterIndices.length - 1] : null;
  }
  doesFilterPass(params, filterToSkip) {
    let rowPasses = true;
    this.filters.forEach(filter => {
      if (!rowPasses || filter === filterToSkip || !filter.isFilterActive()) {
        return;
      }
      rowPasses = filter.doesFilterPass(params);
    });
    return rowPasses;
  }
  getFilterType() {
    return 'multi';
  }
  getModelFromUi() {
    const model = {
      filterType: this.getFilterType(),
      filterModels: this.filters.map(filter => {
        const providedFilter = filter;
        if (typeof providedFilter.getModelFromUi === 'function') {
          return providedFilter.getModelFromUi();
        }
        return null;
      })
    };
    return model;
  }
  getModel() {
    if (!this.isFilterActive()) {
      return null;
    }
    const model = {
      filterType: this.getFilterType(),
      filterModels: this.filters.map(filter => {
        if (filter.isFilterActive()) {
          return filter.getModel();
        }
        return null;
      })
    };
    return model;
  }
  setModel(model) {
    const setFilterModel = (filter, filterModel) => {
      return new ZingPromise(resolve => {
        const promise = filter.setModel(filterModel);
        promise ? promise.then(() => resolve()) : resolve();
      });
    };
    let promises = [];
    if (model == null) {
      promises = this.filters.map((filter, index) => {
        const res = setFilterModel(filter, null).then(() => {
          this.updateActiveList(index);
        });
        return res;
      });
    } else {
      this.filters.forEach((filter, index) => {
        const filterModel = model.filterModels.length > index ? model.filterModels[index] : null;
        const res = setFilterModel(filter, filterModel).then(() => {
          this.updateActiveList(index);
        });
        promises.push(res);
      });
    }
    return ZingPromise.all(promises).then(() => {});
  }
  applyModel(source = 'api') {
    let result = false;
    this.filters.forEach(filter => {
      if (filter instanceof ProvidedFilter) {
        result = filter.applyModel(source) || result;
      }
    });
    return result;
  }
  getChildFilterInstance(index) {
    return this.filters[index];
  }
  afterGuiAttached(params) {
    if (params) {
      this.hidePopup = params.hidePopup;
      this.refreshGui(params.container);
    } else {
      this.hidePopup = undefined;
    }
    const {
      filters
    } = this.params;
    const suppressFocus = filters && filters.some(filter => filter.display && filter.display !== 'inline');
    this.executeFunctionIfExists('afterGuiAttached', Object.assign(Object.assign({}, params || {}), {
      suppressFocus
    }));
    const eDocument = this.gridOptionsService.getDocument();
    const activeEl = eDocument.activeElement;
    if (suppressFocus && (activeEl === eDocument.body || this.getGui().contains(activeEl))) {
      this.forceFocusOutOfContainer(true);
    }
  }
  afterGuiDetached() {
    this.executeFunctionIfExists('afterGuiDetached');
  }
  onAnyFilterChanged() {
    this.executeFunctionIfExists('onAnyFilterChanged');
  }
  onNewRowsLoaded() {
    this.executeFunctionIfExists('onNewRowsLoaded');
  }
  destroy() {
    this.filters.forEach(filter => {
      filter.setModel(null);
      this.destroyBean(filter);
    });
    this.filters.length = 0;
    this.destroyChildren();
    this.hidePopup = undefined;
    super.destroy();
  }
  executeFunctionIfExists(name, ...params) {
    _.forEachReverse(this.filters, filter => {
      const func = filter[name];
      if (typeof func === 'function') {
        func.apply(filter, params);
      }
    });
  }
  createFilter(filterDef, index) {
    const {
      filterModifiedCallback,
      doesRowPassOtherFilter
    } = this.params;
    let filterInstance;
    const filterParams = Object.assign(Object.assign({}, this.filterManager.createFilterParams(this.column, this.column.getColDef())), {
      filterModifiedCallback,
      filterChangedCallback: additionalEventAttributes => {
        this.executeWhenAllFiltersReady(() => this.filterChanged(index, additionalEventAttributes));
      },
      doesRowPassOtherFilter: node => doesRowPassOtherFilter(node) && this.doesFilterPass({
        node,
        data: node.data
      }, filterInstance)
    });
    const compDetails = this.userComponentFactory.getFilterDetails(filterDef, filterParams, 'zingTextColumnFilter');
    if (!compDetails) {
      return null;
    }
    const filterPromise = compDetails.newZingStackInstance();
    if (filterPromise) {
      filterPromise.then(filter => filterInstance = filter);
    }
    return filterPromise;
  }
  executeWhenAllFiltersReady(action) {
    if (this.filters && this.filters.length > 0) {
      action();
    } else {
      this.afterFiltersReadyFuncs.push(action);
    }
  }
  updateActiveList(index) {
    const changedFilter = this.filters[index];
    _.removeFromArray(this.activeFilterIndices, index);
    if (changedFilter.isFilterActive()) {
      this.activeFilterIndices.push(index);
    }
  }
  filterChanged(index, additionalEventAttributes) {
    this.updateActiveList(index);
    this.filterChangedCallback(additionalEventAttributes);
    const changedFilter = this.filters[index];
    this.filters.forEach(filter => {
      if (filter === changedFilter) {
        return;
      }
      if (typeof filter.onAnyFilterChanged === 'function') {
        filter.onAnyFilterChanged();
      }
    });
  }
  onFocusIn(e) {
    if (this.lastActivatedMenuItem != null && !this.lastActivatedMenuItem.getGui().contains(e.target)) {
      this.lastActivatedMenuItem.deactivate();
      this.lastActivatedMenuItem = null;
    }
    return true;
  }
  getModelAsString(model) {
    var _a, _b, _c, _d;
    if (!this.filters || !((_a = model === null || model === void 0 ? void 0 : model.filterModels) === null || _a === void 0 ? void 0 : _a.length)) {
      return '';
    }
    const lastActiveIndex = (_b = this.getLastActiveFilterIndex()) !== null && _b !== void 0 ? _b : 0;
    const activeFilter = this.filters[lastActiveIndex];
    return (_d = (_c = activeFilter.getModelAsString) === null || _c === void 0 ? void 0 : _c.call(activeFilter, model.filterModels[lastActiveIndex])) !== null && _d !== void 0 ? _d : '';
  }
}
__decorate([Autowired('filterManager')], MultiFilter.prototype, "filterManager", void 0);
__decorate([Autowired('userComponentFactory')], MultiFilter.prototype, "userComponentFactory", void 0);
__decorate([PostConstruct], MultiFilter.prototype, "postConstruct", null);