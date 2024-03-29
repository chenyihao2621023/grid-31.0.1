var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, ZingGroupComponent, Autowired, Column, Component, Events, ProvidedColumnGroup, PostConstruct, PreConstruct, RefSelector } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { ToolPanelFilterComp } from "./toolPanelFilterComp";
export class ToolPanelFilterGroupComp extends Component {
  constructor(columnGroup, childFilterComps, expandedCallback, depth, showingColumn) {
    super();
    this.columnGroup = columnGroup;
    this.childFilterComps = childFilterComps;
    this.depth = depth;
    this.expandedCallback = expandedCallback;
    this.showingColumn = showingColumn;
  }
  preConstruct() {
    const groupParams = {
      cssIdentifier: 'filter-toolpanel',
      direction: 'vertical'
    };
    this.setTemplate(ToolPanelFilterGroupComp.TEMPLATE, {
      filterGroupComp: groupParams
    });
  }
  init() {
    this.setGroupTitle();
    this.filterGroupComp.setAlignItems('stretch');
    this.filterGroupComp.addCssClass(`zing-filter-toolpanel-group-level-${this.depth}`);
    this.filterGroupComp.addCssClassToTitleBar(`zing-filter-toolpanel-group-level-${this.depth}-header`);
    this.childFilterComps.forEach(filterComp => {
      this.filterGroupComp.addItem(filterComp);
      filterComp.addCssClassToTitleBar(`zing-filter-toolpanel-group-level-${this.depth + 1}-header`);
    });
    this.refreshFilterClass();
    this.addExpandCollapseListeners();
    this.addFilterChangedListeners();
    this.setupTooltip();
  }
  setupTooltip() {
    if (!this.showingColumn) {
      return;
    }
    const refresh = () => {
      const newTooltipText = this.columnGroup.getColDef().headerTooltip;
      this.setTooltip(newTooltipText);
    };
    refresh();
    this.addManagedListener(this.eventService, Events.EVENT_NEW_COLUMNS_LOADED, refresh);
  }
  getTooltipParams() {
    const res = super.getTooltipParams();
    res.location = 'filterToolPanelColumnGroup';
    return res;
  }
  addCssClassToTitleBar(cssClass) {
    this.filterGroupComp.addCssClassToTitleBar(cssClass);
  }
  refreshFilters(isDisplayed) {
    this.childFilterComps.forEach(filterComp => {
      if (filterComp instanceof ToolPanelFilterGroupComp) {
        filterComp.refreshFilters(isDisplayed);
      } else {
        filterComp.refreshFilter(isDisplayed);
      }
    });
  }
  isColumnGroup() {
    return this.columnGroup instanceof ProvidedColumnGroup;
  }
  isExpanded() {
    return this.filterGroupComp.isExpanded();
  }
  getChildren() {
    return this.childFilterComps;
  }
  getFilterGroupName() {
    return this.filterGroupName ? this.filterGroupName : '';
  }
  getFilterGroupId() {
    return this.columnGroup.getId();
  }
  hideGroupItem(hide, index) {
    this.filterGroupComp.hideItem(hide, index);
  }
  hideGroup(hide) {
    this.setDisplayed(!hide);
  }
  forEachToolPanelFilterChild(action) {
    this.childFilterComps.forEach(filterComp => {
      if (filterComp instanceof ToolPanelFilterComp) {
        action(filterComp);
      }
    });
  }
  addExpandCollapseListeners() {
    const expandListener = this.isColumnGroup() ? () => this.expandedCallback() : () => this.forEachToolPanelFilterChild(filterComp => filterComp.expand());
    const collapseListener = this.isColumnGroup() ? () => this.expandedCallback() : () => this.forEachToolPanelFilterChild(filterComp => filterComp.collapse());
    this.addManagedListener(this.filterGroupComp, ZingGroupComponent.EVENT_EXPANDED, expandListener);
    this.addManagedListener(this.filterGroupComp, ZingGroupComponent.EVENT_COLLAPSED, collapseListener);
  }
  getColumns() {
    if (this.columnGroup instanceof ProvidedColumnGroup) {
      return this.columnGroup.getLeafColumns();
    }
    return [this.columnGroup];
  }
  addFilterChangedListeners() {
    this.getColumns().forEach(column => {
      this.addManagedListener(column, Column.EVENT_FILTER_CHANGED, () => this.refreshFilterClass());
    });
    if (!(this.columnGroup instanceof ProvidedColumnGroup)) {
      this.addManagedListener(this.eventService, Events.EVENT_FILTER_OPENED, this.onFilterOpened.bind(this));
    }
  }
  refreshFilterClass() {
    const columns = this.getColumns();
    const anyChildFiltersActive = () => columns.some(col => col.isFilterActive());
    this.filterGroupComp.addOrRemoveCssClass('zing-has-filter', anyChildFiltersActive());
  }
  onFilterOpened(event) {
    if (event.source !== 'COLUMN_MENU') {
      return;
    }
    if (event.column !== this.columnGroup) {
      return;
    }
    if (!this.isExpanded()) {
      return;
    }
    this.collapse();
  }
  expand() {
    this.filterGroupComp.toggleGroupExpand(true);
  }
  collapse() {
    this.filterGroupComp.toggleGroupExpand(false);
  }
  setGroupTitle() {
    this.filterGroupName = this.columnGroup instanceof ProvidedColumnGroup ? this.getColumnGroupName(this.columnGroup) : this.getColumnName(this.columnGroup);
    this.filterGroupComp.setTitle(this.filterGroupName || '');
  }
  getColumnGroupName(columnGroup) {
    return this.columnModel.getDisplayNameForProvidedColumnGroup(null, columnGroup, 'filterToolPanel');
  }
  getColumnName(column) {
    return this.columnModel.getDisplayNameForColumn(column, 'filterToolPanel', false);
  }
  destroyFilters() {
    this.childFilterComps = this.destroyBeans(this.childFilterComps);
    _.clearElement(this.getGui());
  }
  destroy() {
    this.destroyFilters();
    super.destroy();
  }
}
ToolPanelFilterGroupComp.TEMPLATE = `<div class="zing-filter-toolpanel-group-wrapper">
            <zing-group-component ref="filterGroupComp"></zing-group-component>
        </div>`;
__decorate([RefSelector('filterGroupComp')], ToolPanelFilterGroupComp.prototype, "filterGroupComp", void 0);
__decorate([Autowired('columnModel')], ToolPanelFilterGroupComp.prototype, "columnModel", void 0);
__decorate([PreConstruct], ToolPanelFilterGroupComp.prototype, "preConstruct", null);
__decorate([PostConstruct], ToolPanelFilterGroupComp.prototype, "init", null);