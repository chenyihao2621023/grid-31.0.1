var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Events } from "../../../eventKeys";
import { setDisplayed, clearElement } from "../../../utils/dom";
import { Autowired } from "../../../context/context";
import { RefSelector } from "../../../widgets/componentAnnotations";
import { Component } from "../../../widgets/component";
import { createIconNoSpan } from "../../../utils/icon";
export class SortIndicatorComp extends Component {
  constructor(skipTemplate) {
    super();
    if (!skipTemplate) {
      this.setTemplate(SortIndicatorComp.TEMPLATE);
    }
  }
  attachCustomElements(eSortOrder, eSortAsc, eSortDesc, eSortMixed, eSortNone) {
    this.eSortOrder = eSortOrder;
    this.eSortAsc = eSortAsc;
    this.eSortDesc = eSortDesc;
    this.eSortMixed = eSortMixed;
    this.eSortNone = eSortNone;
  }
  setupSort(column, suppressOrder = false) {
    this.column = column;
    this.suppressOrder = suppressOrder;
    this.setupMultiSortIndicator();
    if (!this.column.isSortable()) {
      return;
    }
    this.addInIcon('sortAscending', this.eSortAsc, column);
    this.addInIcon('sortDescending', this.eSortDesc, column);
    this.addInIcon('sortUnSort', this.eSortNone, column);
    this.addManagedPropertyListener('unSortIcon', () => this.updateIcons());
    this.addManagedListener(this.eventService, Events.EVENT_NEW_COLUMNS_LOADED, () => this.updateIcons());
    this.addManagedListener(this.eventService, Events.EVENT_SORT_CHANGED, () => this.onSortChanged());
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_ROW_GROUP_CHANGED, () => this.onSortChanged());
    this.onSortChanged();
  }
  addInIcon(iconName, eParent, column) {
    if (eParent == null) {
      return;
    }
    const eIcon = createIconNoSpan(iconName, this.gridOptionsService, column);
    if (eIcon) {
      eParent.appendChild(eIcon);
    }
  }
  onSortChanged() {
    this.updateIcons();
    if (!this.suppressOrder) {
      this.updateSortOrder();
    }
  }
  updateIcons() {
    const sortDirection = this.sortController.getDisplaySortForColumn(this.column);
    if (this.eSortAsc) {
      const isAscending = sortDirection === 'asc';
      setDisplayed(this.eSortAsc, isAscending, {
        skipAriaHidden: true
      });
    }
    if (this.eSortDesc) {
      const isDescending = sortDirection === 'desc';
      setDisplayed(this.eSortDesc, isDescending, {
        skipAriaHidden: true
      });
    }
    if (this.eSortNone) {
      const alwaysHideNoSort = !this.column.getColDef().unSortIcon && !this.gridOptionsService.get('unSortIcon');
      const isNone = sortDirection === null || sortDirection === undefined;
      setDisplayed(this.eSortNone, !alwaysHideNoSort && isNone, {
        skipAriaHidden: true
      });
    }
  }
  setupMultiSortIndicator() {
    this.addInIcon('sortUnSort', this.eSortMixed, this.column);
    const isColumnShowingRowGroup = this.column.getColDef().showRowGroup;
    const areGroupsCoupled = this.gridOptionsService.isColumnsSortingCoupledToGroup();
    if (areGroupsCoupled && isColumnShowingRowGroup) {
      this.addManagedListener(this.eventService, Events.EVENT_SORT_CHANGED, () => this.updateMultiSortIndicator());
      this.addManagedListener(this.eventService, Events.EVENT_COLUMN_ROW_GROUP_CHANGED, () => this.updateMultiSortIndicator());
      this.updateMultiSortIndicator();
    }
  }
  updateMultiSortIndicator() {
    if (this.eSortMixed) {
      const isMixedSort = this.sortController.getDisplaySortForColumn(this.column) === 'mixed';
      setDisplayed(this.eSortMixed, isMixedSort, {
        skipAriaHidden: true
      });
    }
  }
  updateSortOrder() {
    var _a;
    if (!this.eSortOrder) {
      return;
    }
    const allColumnsWithSorting = this.sortController.getColumnsWithSortingOrdered();
    const indexThisCol = (_a = this.sortController.getDisplaySortIndexForColumn(this.column)) !== null && _a !== void 0 ? _a : -1;
    const moreThanOneColSorting = allColumnsWithSorting.some(col => {
      var _a;
      return (_a = this.sortController.getDisplaySortIndexForColumn(col)) !== null && _a !== void 0 ? _a : -1 >= 1;
    });
    const showIndex = indexThisCol >= 0 && moreThanOneColSorting;
    setDisplayed(this.eSortOrder, showIndex, {
      skipAriaHidden: true
    });
    if (indexThisCol >= 0) {
      this.eSortOrder.innerHTML = (indexThisCol + 1).toString();
    } else {
      clearElement(this.eSortOrder);
    }
  }
}
SortIndicatorComp.TEMPLATE = `<span class="zing-sort-indicator-container">
            <span ref="eSortOrder" class="zing-sort-indicator-icon zing-sort-order zing-hidden" aria-hidden="true"></span>
            <span ref="eSortAsc" class="zing-sort-indicator-icon zing-sort-ascending-icon zing-hidden" aria-hidden="true"></span>
            <span ref="eSortDesc" class="zing-sort-indicator-icon zing-sort-descending-icon zing-hidden" aria-hidden="true"></span>
            <span ref="eSortMixed" class="zing-sort-indicator-icon zing-sort-mixed-icon zing-hidden" aria-hidden="true"></span>
            <span ref="eSortNone" class="zing-sort-indicator-icon zing-sort-none-icon zing-hidden" aria-hidden="true"></span>
        </span>`;
__decorate([RefSelector('eSortOrder')], SortIndicatorComp.prototype, "eSortOrder", void 0);
__decorate([RefSelector('eSortAsc')], SortIndicatorComp.prototype, "eSortAsc", void 0);
__decorate([RefSelector('eSortDesc')], SortIndicatorComp.prototype, "eSortDesc", void 0);
__decorate([RefSelector('eSortMixed')], SortIndicatorComp.prototype, "eSortMixed", void 0);
__decorate([RefSelector('eSortNone')], SortIndicatorComp.prototype, "eSortNone", void 0);
__decorate([Autowired('columnModel')], SortIndicatorComp.prototype, "columnModel", void 0);
__decorate([Autowired('sortController')], SortIndicatorComp.prototype, "sortController", void 0);