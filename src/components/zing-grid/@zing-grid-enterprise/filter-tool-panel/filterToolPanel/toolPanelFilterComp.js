var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, Column, Component, Events, KeyCode, PostConstruct, RefSelector } from "@/components/zing-grid/@zing-grid-community/core/main.js";
export class ToolPanelFilterComp extends Component {
  constructor(hideHeader, expandedCallback) {
    super(ToolPanelFilterComp.TEMPLATE);
    this.expandedCallback = expandedCallback;
    this.expanded = false;
    this.hideHeader = hideHeader;
  }
  postConstruct() {
    this.eExpandChecked = _.createIconNoSpan('columnSelectOpen', this.gridOptionsService);
    this.eExpandUnchecked = _.createIconNoSpan('columnSelectClosed', this.gridOptionsService);
    this.eExpand.appendChild(this.eExpandChecked);
    this.eExpand.appendChild(this.eExpandUnchecked);
  }
  setColumn(column) {
    this.column = column;
    this.eFilterName.innerText = this.columnModel.getDisplayNameForColumn(this.column, 'filterToolPanel', false) || '';
    this.addManagedListener(this.eFilterToolPanelHeader, 'click', this.toggleExpanded.bind(this));
    this.addManagedListener(this.eFilterToolPanelHeader, 'keydown', e => {
      if (e.key === KeyCode.ENTER || e.key === KeyCode.SPACE) {
        e.preventDefault();
        this.toggleExpanded();
      }
    });
    this.addManagedListener(this.eventService, Events.EVENT_FILTER_OPENED, this.onFilterOpened.bind(this));
    this.addInIcon('filter', this.eFilterIcon, this.column);
    _.setDisplayed(this.eFilterIcon, this.isFilterActive(), {
      skipAriaHidden: true
    });
    _.setDisplayed(this.eExpandChecked, false);
    if (this.hideHeader) {
      _.setDisplayed(this.eFilterToolPanelHeader, false);
      this.eFilterToolPanelHeader.removeAttribute('tabindex');
    } else {
      this.eFilterToolPanelHeader.setAttribute('tabindex', '0');
    }
    this.addManagedListener(this.column, Column.EVENT_FILTER_CHANGED, this.onFilterChanged.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_FILTER_DESTROYED, this.onFilterDestroyed.bind(this));
  }
  getColumn() {
    return this.column;
  }
  getColumnFilterName() {
    return this.columnModel.getDisplayNameForColumn(this.column, 'filterToolPanel', false);
  }
  addCssClassToTitleBar(cssClass) {
    this.eFilterToolPanelHeader.classList.add(cssClass);
  }
  addInIcon(iconName, eParent, column) {
    if (eParent == null) {
      return;
    }
    const eIcon = _.createIconNoSpan(iconName, this.gridOptionsService, column);
    eParent.appendChild(eIcon);
  }
  isFilterActive() {
    return this.filterManager.isFilterActive(this.column);
  }
  onFilterChanged() {
    _.setDisplayed(this.eFilterIcon, this.isFilterActive(), {
      skipAriaHidden: true
    });
    this.dispatchEvent({
      type: Column.EVENT_FILTER_CHANGED
    });
  }
  onFilterDestroyed(event) {
    if (this.expanded && event.source === 'api' && event.column.getId() === this.column.getId() && this.columnModel.getPrimaryColumn(this.column)) {
      this.removeFilterElement();
      this.addFilterElement();
    }
  }
  toggleExpanded() {
    this.expanded ? this.collapse() : this.expand();
  }
  expand() {
    if (this.expanded) {
      return;
    }
    this.expanded = true;
    _.setAriaExpanded(this.eFilterToolPanelHeader, true);
    _.setDisplayed(this.eExpandChecked, true);
    _.setDisplayed(this.eExpandUnchecked, false);
    this.addFilterElement();
    this.expandedCallback();
  }
  addFilterElement() {
    const filterPanelWrapper = _.loadTemplate(`<div class="zing-filter-toolpanel-instance-filter"></div>`);
    const filterWrapper = this.filterManager.getOrCreateFilterWrapper(this.column, 'TOOLBAR');
    if (!filterWrapper) {
      return;
    }
    const {
      filterPromise,
      guiPromise
    } = filterWrapper;
    filterPromise === null || filterPromise === void 0 ? void 0 : filterPromise.then(filter => {
      this.underlyingFilter = filter;
      if (!filter) {
        return;
      }
      guiPromise.then(filterContainerEl => {
        if (filterContainerEl) {
          filterPanelWrapper.appendChild(filterContainerEl);
        }
        this.zingFilterToolPanelBody.appendChild(filterPanelWrapper);
        if (filter.afterGuiAttached) {
          filter.afterGuiAttached({
            container: 'toolPanel'
          });
        }
      });
    });
  }
  collapse() {
    var _a, _b;
    if (!this.expanded) {
      return;
    }
    this.expanded = false;
    _.setAriaExpanded(this.eFilterToolPanelHeader, false);
    this.removeFilterElement();
    _.setDisplayed(this.eExpandChecked, false);
    _.setDisplayed(this.eExpandUnchecked, true);
    (_b = (_a = this.underlyingFilter) === null || _a === void 0 ? void 0 : _a.afterGuiDetached) === null || _b === void 0 ? void 0 : _b.call(_a);
    this.expandedCallback();
  }
  removeFilterElement() {
    _.clearElement(this.zingFilterToolPanelBody);
  }
  isExpanded() {
    return this.expanded;
  }
  refreshFilter(isDisplayed) {
    var _a;
    if (!this.expanded) {
      return;
    }
    const filter = this.underlyingFilter;
    if (!filter) {
      return;
    }
    if (isDisplayed) {
      if (typeof filter.refreshVirtualList === 'function') {
        filter.refreshVirtualList();
      }
    } else {
      (_a = filter.afterGuiDetached) === null || _a === void 0 ? void 0 : _a.call(filter);
    }
  }
  onFilterOpened(event) {
    if (event.source !== 'COLUMN_MENU') {
      return;
    }
    if (event.column !== this.column) {
      return;
    }
    if (!this.expanded) {
      return;
    }
    this.collapse();
  }
}
ToolPanelFilterComp.TEMPLATE = `
        <div class="zing-filter-toolpanel-instance">
            <div class="zing-filter-toolpanel-header zing-filter-toolpanel-instance-header" ref="eFilterToolPanelHeader" role="button" aria-expanded="false">
                <div ref="eExpand" class="zing-filter-toolpanel-expand"></div>
                <span ref="eFilterName" class="zing-header-cell-text"></span>
                <span ref="eFilterIcon" class="zing-header-icon zing-filter-icon zing-filter-toolpanel-instance-header-icon" aria-hidden="true"></span>
            </div>
            <div class="zing-filter-toolpanel-instance-body zing-filter" ref="zingFilterToolPanelBody"></div>
        </div>`;
__decorate([RefSelector('eFilterToolPanelHeader')], ToolPanelFilterComp.prototype, "eFilterToolPanelHeader", void 0);
__decorate([RefSelector('eFilterName')], ToolPanelFilterComp.prototype, "eFilterName", void 0);
__decorate([RefSelector('zingFilterToolPanelBody')], ToolPanelFilterComp.prototype, "zingFilterToolPanelBody", void 0);
__decorate([RefSelector('eFilterIcon')], ToolPanelFilterComp.prototype, "eFilterIcon", void 0);
__decorate([RefSelector('eExpand')], ToolPanelFilterComp.prototype, "eExpand", void 0);
__decorate([Autowired('filterManager')], ToolPanelFilterComp.prototype, "filterManager", void 0);
__decorate([Autowired('columnModel')], ToolPanelFilterComp.prototype, "columnModel", void 0);
__decorate([PostConstruct], ToolPanelFilterComp.prototype, "postConstruct", null);