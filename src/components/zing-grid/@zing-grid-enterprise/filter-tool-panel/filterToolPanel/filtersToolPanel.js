var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, RefSelector } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export class FiltersToolPanel extends Component {
  constructor() {
    super(FiltersToolPanel.TEMPLATE);
    this.initialised = false;
    this.listenerDestroyFuncs = [];
  }
  init(params) {
    if (this.initialised) {
      this.listenerDestroyFuncs.forEach(func => func());
      this.listenerDestroyFuncs = [];
    }
    this.initialised = true;
    const defaultParams = {
      suppressExpandAll: false,
      suppressFilterSearch: false,
      suppressSyncLayoutWithGrid: false,
      api: this.gridOptionsService.api,
      columnApi: this.gridOptionsService.columnApi
    };
    this.params = Object.assign(Object.assign(Object.assign({}, defaultParams), params), {
      context: this.gridOptionsService.context
    });
    this.filtersToolPanelHeaderPanel.init(this.params);
    this.filtersToolPanelListPanel.init(this.params);
    const hideExpand = this.params.suppressExpandAll;
    const hideSearch = this.params.suppressFilterSearch;
    if (hideExpand && hideSearch) {
      this.filtersToolPanelHeaderPanel.setDisplayed(false);
    }
    this.listenerDestroyFuncs.push(this.addManagedListener(this.filtersToolPanelHeaderPanel, 'expandAll', this.onExpandAll.bind(this)), this.addManagedListener(this.filtersToolPanelHeaderPanel, 'collapseAll', this.onCollapseAll.bind(this)), this.addManagedListener(this.filtersToolPanelHeaderPanel, 'searchChanged', this.onSearchChanged.bind(this)), this.addManagedListener(this.filtersToolPanelListPanel, 'filterExpanded', this.onFilterExpanded.bind(this)), this.addManagedListener(this.filtersToolPanelListPanel, 'groupExpanded', this.onGroupExpanded.bind(this)));
  }
  setVisible(visible) {
    super.setDisplayed(visible);
    if (visible && !this.initialised) {
      this.init(this.params);
    }
  }
  onExpandAll() {
    this.filtersToolPanelListPanel.expandFilterGroups(true);
  }
  onCollapseAll() {
    this.filtersToolPanelListPanel.expandFilterGroups(false);
  }
  onSearchChanged(event) {
    this.filtersToolPanelListPanel.performFilterSearch(event.searchText);
  }
  setFilterLayout(colDefs) {
    this.filtersToolPanelListPanel.setFiltersLayout(colDefs);
  }
  onFilterExpanded() {
    this.params.onStateUpdated();
  }
  onGroupExpanded(event) {
    this.filtersToolPanelHeaderPanel.setExpandState(event.state);
    this.params.onStateUpdated();
  }
  expandFilterGroups(groupIds) {
    this.filtersToolPanelListPanel.expandFilterGroups(true, groupIds);
  }
  collapseFilterGroups(groupIds) {
    this.filtersToolPanelListPanel.expandFilterGroups(false, groupIds);
  }
  expandFilters(colIds) {
    this.filtersToolPanelListPanel.expandFilters(true, colIds);
  }
  collapseFilters(colIds) {
    this.filtersToolPanelListPanel.expandFilters(false, colIds);
  }
  syncLayoutWithGrid() {
    this.filtersToolPanelListPanel.syncFilterLayout();
  }
  refresh() {
    this.init(this.params);
  }
  getState() {
    return this.filtersToolPanelListPanel.getExpandedFiltersAndGroups();
  }
  destroy() {
    super.destroy();
  }
}
FiltersToolPanel.TEMPLATE = `<div class="zing-filter-toolpanel">
            <zing-filters-tool-panel-header ref="filtersToolPanelHeaderPanel"></zing-filters-tool-panel-header>
            <zing-filters-tool-panel-list ref="filtersToolPanelListPanel"></zing-filters-tool-panel-list>
         </div>`;
__decorate([RefSelector('filtersToolPanelHeaderPanel')], FiltersToolPanel.prototype, "filtersToolPanelHeaderPanel", void 0);
__decorate([RefSelector('filtersToolPanelListPanel')], FiltersToolPanel.prototype, "filtersToolPanelListPanel", void 0);