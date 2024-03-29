var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, Component, Events, ProvidedColumnGroup } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { ToolPanelFilterComp } from "./toolPanelFilterComp";
import { ToolPanelFilterGroupComp } from "./toolPanelFilterGroupComp";
import { EXPAND_STATE } from "./filtersToolPanelHeaderPanel";
export class FiltersToolPanelListPanel extends Component {
  constructor() {
    super(FiltersToolPanelListPanel.TEMPLATE);
    this.initialised = false;
    this.hasLoadedInitialState = false;
    this.isInitialState = false;
    this.filterGroupComps = [];
  }
  init(params) {
    this.initialised = true;
    const defaultParams = {
      suppressExpandAll: false,
      suppressFilterSearch: false,
      suppressSyncLayoutWithGrid: false,
      api: this.gridApi,
      columnApi: this.columnApi,
      context: this.gridOptionsService.context
    };
    _.mergeDeep(defaultParams, params);
    this.params = defaultParams;
    if (!this.params.suppressSyncLayoutWithGrid) {
      this.addManagedListener(this.eventService, Events.EVENT_COLUMN_MOVED, () => this.onColumnsChanged());
    }
    this.addManagedListener(this.eventService, Events.EVENT_NEW_COLUMNS_LOADED, () => this.onColumnsChanged());
    this.addManagedListener(this.eventService, Events.EVENT_TOOL_PANEL_VISIBLE_CHANGED, event => {
      if (event.key === 'filters') {
        this.refreshFilters(event.visible);
      }
    });
    if (this.columnModel.isReady()) {
      this.onColumnsChanged();
    }
    const ariaEl = this.getAriaElement();
    _.setAriaLive(ariaEl, 'assertive');
    _.setAriaAtomic(ariaEl, false);
    _.setAriaRelevant(ariaEl, 'text');
  }
  onColumnsChanged() {
    const pivotModeActive = this.columnModel.isPivotMode();
    const shouldSyncColumnLayoutWithGrid = !this.params.suppressSyncLayoutWithGrid && !pivotModeActive;
    shouldSyncColumnLayoutWithGrid ? this.syncFilterLayout() : this.buildTreeFromProvidedColumnDefs();
    this.refreshAriaLabel();
  }
  syncFilterLayout() {
    this.toolPanelColDefService.syncLayoutWithGrid(this.setFiltersLayout.bind(this));
    this.refreshAriaLabel();
  }
  buildTreeFromProvidedColumnDefs() {
    const columnTree = this.columnModel.getPrimaryColumnTree();
    this.recreateFilters(columnTree);
  }
  setFiltersLayout(colDefs) {
    const columnTree = this.toolPanelColDefService.createColumnTree(colDefs);
    this.recreateFilters(columnTree);
  }
  recreateFilters(columnTree) {
    const activeElement = this.gridOptionsService.getDocument().activeElement;
    if (!this.hasLoadedInitialState) {
      this.hasLoadedInitialState = true;
      this.isInitialState = !!this.params.initialState;
    }
    const expansionState = this.getExpansionState();
    this.destroyFilters();
    this.filterGroupComps = this.recursivelyAddComps(columnTree, 0, expansionState);
    const len = this.filterGroupComps.length;
    if (len) {
      this.filterGroupComps.forEach(comp => this.appendChild(comp));
      this.setFirstAndLastVisible(0, len - 1);
    }
    if (_.exists(this.searchFilterText)) {
      this.searchFilters(this.searchFilterText);
    }
    this.fireExpandedEvent();
    if (this.getGui().contains(activeElement)) {
      activeElement.focus();
    }
    this.isInitialState = false;
    this.refreshAriaLabel();
  }
  recursivelyAddComps(tree, depth, expansionState) {
    return _.flatten(tree.map(child => {
      if (child instanceof ProvidedColumnGroup) {
        return _.flatten(this.recursivelyAddFilterGroupComps(child, depth, expansionState));
      }
      const column = child;
      if (!this.shouldDisplayFilter(column)) {
        return [];
      }
      const hideFilterCompHeader = depth === 0;
      const filterComp = new ToolPanelFilterComp(hideFilterCompHeader, () => this.onFilterExpanded());
      this.createBean(filterComp);
      filterComp.setColumn(column);
      if (expansionState.get(column.getId())) {
        filterComp.expand();
      }
      if (depth > 0) {
        return filterComp;
      }
      const filterGroupComp = this.createBean(new ToolPanelFilterGroupComp(column, [filterComp], this.onGroupExpanded.bind(this), depth, true));
      filterGroupComp.addCssClassToTitleBar('zing-filter-toolpanel-header');
      if (!expansionState.get(filterGroupComp.getFilterGroupId())) {
        filterGroupComp.collapse();
      }
      return filterGroupComp;
    }));
  }
  refreshAriaLabel() {
    const translate = this.localeService.getLocaleTextFunc();
    const filterListName = translate('ariaFilterPanelList', 'Filter List');
    const localeFilters = translate('filters', 'Filters');
    const eGui = this.getGui();
    const groupSelector = '.zing-filter-toolpanel-group-wrapper';
    const itemSelector = '.zing-filter-toolpanel-group-item';
    const hiddenSelector = '.zing-hidden';
    const visibleItems = eGui.querySelectorAll(`${itemSelector}:not(${groupSelector}, ${hiddenSelector})`);
    const totalVisibleItems = visibleItems.length;
    _.setAriaLabel(this.getAriaElement(), `${filterListName} ${totalVisibleItems} ${localeFilters}`);
  }
  recursivelyAddFilterGroupComps(columnGroup, depth, expansionState) {
    if (!this.filtersExistInChildren(columnGroup.getChildren())) {
      return;
    }
    const colGroupDef = columnGroup.getColGroupDef();
    if (colGroupDef && colGroupDef.suppressFiltersToolPanel) {
      return [];
    }
    const newDepth = columnGroup.isPadding() ? depth : depth + 1;
    const childFilterComps = _.flatten(this.recursivelyAddComps(columnGroup.getChildren(), newDepth, expansionState));
    if (columnGroup.isPadding()) {
      return childFilterComps;
    }
    const filterGroupComp = new ToolPanelFilterGroupComp(columnGroup, childFilterComps, this.onGroupExpanded.bind(this), depth, false);
    this.createBean(filterGroupComp);
    filterGroupComp.addCssClassToTitleBar('zing-filter-toolpanel-header');
    const expansionStateValue = expansionState.get(filterGroupComp.getFilterGroupId());
    if (this.isInitialState && !expansionStateValue || expansionStateValue === false) {
      filterGroupComp.collapse();
    }
    return [filterGroupComp];
  }
  filtersExistInChildren(tree) {
    return tree.some(child => {
      if (child instanceof ProvidedColumnGroup) {
        return this.filtersExistInChildren(child.getChildren());
      }
      return this.shouldDisplayFilter(child);
    });
  }
  shouldDisplayFilter(column) {
    const suppressFiltersToolPanel = column.getColDef() && column.getColDef().suppressFiltersToolPanel;
    return column.isFilterAllowed() && !suppressFiltersToolPanel;
  }
  getExpansionState() {
    const expansionState = new Map();
    if (this.isInitialState) {
      const {
        expandedColIds,
        expandedGroupIds
      } = this.params.initialState;
      expandedColIds.forEach(id => expansionState.set(id, true));
      expandedGroupIds.forEach(id => expansionState.set(id, true));
      return expansionState;
    }
    const recursiveGetExpansionState = filterGroupComp => {
      expansionState.set(filterGroupComp.getFilterGroupId(), filterGroupComp.isExpanded());
      filterGroupComp.getChildren().forEach(child => {
        if (child instanceof ToolPanelFilterGroupComp) {
          recursiveGetExpansionState(child);
        } else {
          expansionState.set(child.getColumn().getId(), child.isExpanded());
        }
      });
    };
    this.filterGroupComps.forEach(recursiveGetExpansionState);
    return expansionState;
  }
  refresh() {}
  setVisible(visible) {
    super.setDisplayed(visible);
    if (visible && !this.initialised) {
      this.init(this.params);
    }
  }
  expandFilterGroups(expand, groupIds) {
    const updatedGroupIds = [];
    const updateGroupExpandState = filterGroup => {
      const groupId = filterGroup.getFilterGroupId();
      const shouldExpandOrCollapse = !groupIds || _.includes(groupIds, groupId);
      if (shouldExpandOrCollapse) {
        if (expand && filterGroup.isColumnGroup()) {
          filterGroup.expand();
        } else {
          filterGroup.collapse();
        }
        updatedGroupIds.push(groupId);
      }
      filterGroup.getChildren().forEach(child => {
        if (child instanceof ToolPanelFilterGroupComp) {
          updateGroupExpandState(child);
        }
      });
    };
    this.filterGroupComps.forEach(updateGroupExpandState);
    this.onGroupExpanded();
    if (groupIds) {
      const unrecognisedGroupIds = groupIds.filter(groupId => updatedGroupIds.indexOf(groupId) < 0);
      if (unrecognisedGroupIds.length > 0) {
        console.warn('ZING Grid: unable to find groups for these supplied groupIds:', unrecognisedGroupIds);
      }
    }
  }
  expandFilters(expand, colIds) {
    const updatedColIds = [];
    const updateGroupExpandState = filterComp => {
      if (filterComp instanceof ToolPanelFilterGroupComp) {
        let anyChildrenChanged = false;
        filterComp.getChildren().forEach(child => {
          const childUpdated = updateGroupExpandState(child);
          if (childUpdated) {
            if (expand) {
              filterComp.expand();
              anyChildrenChanged = true;
            } else if (!filterComp.isColumnGroup()) {
              filterComp.collapse();
            }
          }
        });
        return anyChildrenChanged;
      }
      const colId = filterComp.getColumn().getColId();
      const updateFilterExpandState = !colIds || _.includes(colIds, colId);
      if (updateFilterExpandState) {
        expand ? filterComp.expand() : filterComp.collapse();
        updatedColIds.push(colId);
      }
      return updateFilterExpandState;
    };
    this.filterGroupComps.forEach(updateGroupExpandState);
    this.onGroupExpanded();
    if (colIds) {
      const unrecognisedColIds = colIds.filter(colId => updatedColIds.indexOf(colId) < 0);
      if (unrecognisedColIds.length > 0) {
        console.warn('ZING Grid: unable to find columns for these supplied colIds:', unrecognisedColIds);
      }
    }
  }
  onGroupExpanded() {
    this.fireExpandedEvent();
  }
  onFilterExpanded() {
    this.dispatchEvent({
      type: 'filterExpanded'
    });
  }
  fireExpandedEvent() {
    let expandedCount = 0;
    let notExpandedCount = 0;
    const updateExpandCounts = filterGroup => {
      if (!filterGroup.isColumnGroup()) {
        return;
      }
      filterGroup.isExpanded() ? expandedCount++ : notExpandedCount++;
      filterGroup.getChildren().forEach(child => {
        if (child instanceof ToolPanelFilterGroupComp) {
          updateExpandCounts(child);
        }
      });
    };
    this.filterGroupComps.forEach(updateExpandCounts);
    let state;
    if (expandedCount > 0 && notExpandedCount > 0) {
      state = EXPAND_STATE.INDETERMINATE;
    } else if (notExpandedCount > 0) {
      state = EXPAND_STATE.COLLAPSED;
    } else {
      state = EXPAND_STATE.EXPANDED;
    }
    this.dispatchEvent({
      type: 'groupExpanded',
      state: state
    });
  }
  performFilterSearch(searchText) {
    this.searchFilterText = _.exists(searchText) ? searchText.toLowerCase() : null;
    this.searchFilters(this.searchFilterText);
  }
  searchFilters(searchFilter) {
    const passesFilter = groupName => {
      return !_.exists(searchFilter) || groupName.toLowerCase().indexOf(searchFilter) !== -1;
    };
    const recursivelySearch = (filterItem, parentPasses) => {
      if (!(filterItem instanceof ToolPanelFilterGroupComp)) {
        return passesFilter(filterItem.getColumnFilterName() || '');
      }
      const children = filterItem.getChildren();
      const groupNamePasses = passesFilter(filterItem.getFilterGroupName());
      const alreadyPassed = parentPasses || groupNamePasses;
      if (alreadyPassed) {
        filterItem.hideGroup(false);
        for (let i = 0; i < children.length; i++) {
          recursivelySearch(children[i], alreadyPassed);
          filterItem.hideGroupItem(false, i);
        }
        return true;
      }
      let anyChildPasses = false;
      children.forEach((child, index) => {
        const childPasses = recursivelySearch(child, parentPasses);
        filterItem.hideGroupItem(!childPasses, index);
        if (childPasses) {
          anyChildPasses = true;
        }
      });
      filterItem.hideGroup(!anyChildPasses);
      return anyChildPasses;
    };
    let firstVisible;
    let lastVisible;
    this.filterGroupComps.forEach((filterGroup, idx) => {
      recursivelySearch(filterGroup, false);
      if (firstVisible === undefined) {
        if (!filterGroup.containsCssClass('zing-hidden')) {
          firstVisible = idx;
          lastVisible = idx;
        }
      } else if (!filterGroup.containsCssClass('zing-hidden') && lastVisible !== idx) {
        lastVisible = idx;
      }
    });
    this.setFirstAndLastVisible(firstVisible, lastVisible);
    this.refreshAriaLabel();
  }
  setFirstAndLastVisible(firstIdx, lastIdx) {
    this.filterGroupComps.forEach((filterGroup, idx) => {
      filterGroup.removeCssClass('zing-first-group-visible');
      filterGroup.removeCssClass('zing-last-group-visible');
      if (idx === firstIdx) {
        filterGroup.addCssClass('zing-first-group-visible');
      }
      if (idx === lastIdx) {
        filterGroup.addCssClass('zing-last-group-visible');
      }
    });
  }
  refreshFilters(isDisplayed) {
    this.filterGroupComps.forEach(filterGroupComp => filterGroupComp.refreshFilters(isDisplayed));
  }
  getExpandedFiltersAndGroups() {
    const expandedGroupIds = [];
    const expandedColIds = new Set();
    const getExpandedFiltersAndGroups = filterComp => {
      if (filterComp instanceof ToolPanelFilterGroupComp) {
        filterComp.getChildren().forEach(child => getExpandedFiltersAndGroups(child));
        const groupId = filterComp.getFilterGroupId();
        if (filterComp.isExpanded() && !expandedColIds.has(groupId)) {
          expandedGroupIds.push(groupId);
        }
      } else {
        if (filterComp.isExpanded()) {
          expandedColIds.add(filterComp.getColumn().getColId());
        }
      }
    };
    this.filterGroupComps.forEach(getExpandedFiltersAndGroups);
    return {
      expandedGroupIds,
      expandedColIds: Array.from(expandedColIds)
    };
  }
  destroyFilters() {
    this.filterGroupComps = this.destroyBeans(this.filterGroupComps);
    _.clearElement(this.getGui());
  }
  destroy() {
    this.destroyFilters();
    super.destroy();
  }
}
FiltersToolPanelListPanel.TEMPLATE = `<div class="zing-filter-list-panel"></div>`;
__decorate([Autowired("gridApi")], FiltersToolPanelListPanel.prototype, "gridApi", void 0);
__decorate([Autowired("columnApi")], FiltersToolPanelListPanel.prototype, "columnApi", void 0);
__decorate([Autowired('toolPanelColDefService')], FiltersToolPanelListPanel.prototype, "toolPanelColDefService", void 0);
__decorate([Autowired('columnModel')], FiltersToolPanelListPanel.prototype, "columnModel", void 0);