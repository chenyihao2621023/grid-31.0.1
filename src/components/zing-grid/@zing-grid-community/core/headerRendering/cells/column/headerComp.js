var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired } from "../../../context/context";
import { Column } from "../../../entities/column";
import { firstExistingValue } from "../../../utils/array";
import { isIOSUserAgent } from "../../../utils/browser";
import { removeFromParent, setDisplayed } from "../../../utils/dom";
import { exists } from "../../../utils/generic";
import { createIconNoSpan } from "../../../utils/icon";
import { escapeString } from "../../../utils/string";
import { Component } from "../../../widgets/component";
import { RefSelector } from "../../../widgets/componentAnnotations";
import { TouchListener } from "../../../widgets/touchListener";
import { SortIndicatorComp } from "./sortIndicatorComp";
import { Events } from "../../../eventKeys";
export class HeaderComp extends Component {
  constructor() {
    super(...arguments);
    this.lastMovingChanged = 0;
  }
  destroy() {
    super.destroy();
  }
  refresh(params) {
    this.params = params;
    if (this.workOutTemplate() != this.currentTemplate) {
      return false;
    }
    if (this.workOutShowMenu() != this.currentShowMenu) {
      return false;
    }
    if (this.workOutSort() != this.currentSort) {
      return false;
    }
    if (this.shouldSuppressMenuHide() != this.currentSuppressMenuHide) {
      return false;
    }
    this.setDisplayName(params);
    return true;
  }
  workOutTemplate() {
    let template = firstExistingValue(this.params.template, HeaderComp.TEMPLATE);
    template = template && template.trim ? template.trim() : template;
    return template;
  }
  init(params) {
    this.params = params;
    this.currentTemplate = this.workOutTemplate();
    this.setTemplate(this.currentTemplate);
    this.setupTap();
    this.setupIcons(params.column);
    this.setMenu();
    this.setupSort();
    this.setupFilterIcon();
    this.setDisplayName(params);
  }
  setDisplayName(params) {
    if (this.currentDisplayName != params.displayName) {
      this.currentDisplayName = params.displayName;
      const displayNameSanitised = escapeString(this.currentDisplayName);
      if (this.eText) {
        this.eText.innerHTML = displayNameSanitised;
      }
    }
  }
  setupIcons(column) {
    this.addInIcon('menu', this.eMenu, column);
    this.addInIcon('filter', this.eFilter, column);
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
  setupTap() {
    const {
      gridOptionsService
    } = this;
    if (gridOptionsService.get('suppressTouch')) {
      return;
    }
    const touchListener = new TouchListener(this.getGui(), true);
    const suppressMenuHide = gridOptionsService.get('suppressMenuHide');
    const tapMenuButton = suppressMenuHide && exists(this.eMenu);
    const menuTouchListener = tapMenuButton ? new TouchListener(this.eMenu, true) : touchListener;
    if (this.params.enableMenu) {
      const eventType = tapMenuButton ? 'EVENT_TAP' : 'EVENT_LONG_TAP';
      const showMenuFn = event => {
        gridOptionsService.api.showColumnMenuAfterMouseClick(this.params.column, event.touchStart);
      };
      this.addManagedListener(menuTouchListener, TouchListener[eventType], showMenuFn);
    }
    if (this.params.enableSorting) {
      const tapListener = event => {
        const target = event.touchStart.target;
        if (suppressMenuHide && this.eMenu.contains(target)) {
          return;
        }
        this.sortController.progressSort(this.params.column, false, "uiColumnSorted");
      };
      this.addManagedListener(touchListener, TouchListener.EVENT_TAP, tapListener);
    }
    this.addDestroyFunc(() => touchListener.destroy());
    if (tapMenuButton) {
      this.addDestroyFunc(() => menuTouchListener.destroy());
    }
  }
  workOutShowMenu() {
    const menuHides = !this.gridOptionsService.get('suppressMenuHide');
    const onIpadAndMenuHides = isIOSUserAgent() && menuHides;
    const showMenu = this.params.enableMenu && !onIpadAndMenuHides;
    return showMenu;
  }
  shouldSuppressMenuHide() {
    return this.gridOptionsService.get('suppressMenuHide');
  }
  setMenu() {
    if (!this.eMenu) {
      return;
    }
    this.currentShowMenu = this.workOutShowMenu();
    if (!this.currentShowMenu) {
      removeFromParent(this.eMenu);
      return;
    }
    this.currentSuppressMenuHide = this.shouldSuppressMenuHide();
    this.addManagedListener(this.eMenu, 'click', () => this.showMenu(this.eMenu));
    this.eMenu.classList.toggle('zing-header-menu-always-show', this.currentSuppressMenuHide);
  }
  showMenu(eventSource) {
    if (!eventSource) {
      eventSource = this.eMenu;
    }
    this.menuFactory.showMenuAfterButtonClick(this.params.column, eventSource, 'columnMenu');
  }
  workOutSort() {
    return this.params.enableSorting;
  }
  setupSort() {
    this.currentSort = this.params.enableSorting;
    if (!this.eSortIndicator) {
      this.eSortIndicator = this.context.createBean(new SortIndicatorComp(true));
      this.eSortIndicator.attachCustomElements(this.eSortOrder, this.eSortAsc, this.eSortDesc, this.eSortMixed, this.eSortNone);
    }
    this.eSortIndicator.setupSort(this.params.column);
    if (!this.currentSort) {
      return;
    }
    this.addManagedListener(this.params.column, Column.EVENT_MOVING_CHANGED, () => {
      this.lastMovingChanged = new Date().getTime();
    });
    if (this.eLabel) {
      this.addManagedListener(this.eLabel, 'click', event => {
        const moving = this.params.column.isMoving();
        const nowTime = new Date().getTime();
        const movedRecently = nowTime - this.lastMovingChanged < 50;
        const columnMoving = moving || movedRecently;
        if (!columnMoving) {
          const sortUsingCtrl = this.gridOptionsService.get('multiSortKey') === 'ctrl';
          const multiSort = sortUsingCtrl ? event.ctrlKey || event.metaKey : event.shiftKey;
          this.params.progressSort(multiSort);
        }
      });
    }
    const onSortingChanged = () => {
      this.addOrRemoveCssClass('zing-header-cell-sorted-asc', this.params.column.isSortAscending());
      this.addOrRemoveCssClass('zing-header-cell-sorted-desc', this.params.column.isSortDescending());
      this.addOrRemoveCssClass('zing-header-cell-sorted-none', this.params.column.isSortNone());
      if (this.params.column.getColDef().showRowGroup) {
        const sourceColumns = this.columnModel.getSourceColumnsForGroupColumn(this.params.column);
        const sortDirectionsMatch = sourceColumns === null || sourceColumns === void 0 ? void 0 : sourceColumns.every(sourceCol => this.params.column.getSort() == sourceCol.getSort());
        const isMultiSorting = !sortDirectionsMatch;
        this.addOrRemoveCssClass('zing-header-cell-sorted-mixed', isMultiSorting);
      }
    };
    this.addManagedListener(this.eventService, Events.EVENT_SORT_CHANGED, onSortingChanged);
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_ROW_GROUP_CHANGED, onSortingChanged);
  }
  setupFilterIcon() {
    if (!this.eFilter) {
      return;
    }
    this.addManagedListener(this.params.column, Column.EVENT_FILTER_CHANGED, this.onFilterChanged.bind(this));
    this.onFilterChanged();
  }
  onFilterChanged() {
    const filterPresent = this.params.column.isFilterActive();
    setDisplayed(this.eFilter, filterPresent, {
      skipAriaHidden: true
    });
  }
}
HeaderComp.TEMPLATE = `<div class="zing-cell-label-container" role="presentation">
            <span ref="eMenu" class="zing-header-icon zing-header-cell-menu-button" aria-hidden="true"></span>
            <div ref="eLabel" class="zing-header-cell-label" role="presentation">
                <span ref="eText" class="zing-header-cell-text"></span>
                <span ref="eFilter" class="zing-header-icon zing-header-label-icon zing-filter-icon" aria-hidden="true"></span>
                <zing-sort-indicator ref="eSortIndicator"></zing-sort-indicator>
            </div>
        </div>`;
__decorate([Autowired('sortController')], HeaderComp.prototype, "sortController", void 0);
__decorate([Autowired('menuFactory')], HeaderComp.prototype, "menuFactory", void 0);
__decorate([Autowired('columnModel')], HeaderComp.prototype, "columnModel", void 0);
__decorate([RefSelector('eFilter')], HeaderComp.prototype, "eFilter", void 0);
__decorate([RefSelector('eSortIndicator')], HeaderComp.prototype, "eSortIndicator", void 0);
__decorate([RefSelector('eMenu')], HeaderComp.prototype, "eMenu", void 0);
__decorate([RefSelector('eLabel')], HeaderComp.prototype, "eLabel", void 0);
__decorate([RefSelector('eText')], HeaderComp.prototype, "eText", void 0);
__decorate([RefSelector('eSortOrder')], HeaderComp.prototype, "eSortOrder", void 0);
__decorate([RefSelector('eSortAsc')], HeaderComp.prototype, "eSortAsc", void 0);
__decorate([RefSelector('eSortDesc')], HeaderComp.prototype, "eSortDesc", void 0);
__decorate([RefSelector('eSortMixed')], HeaderComp.prototype, "eSortMixed", void 0);
__decorate([RefSelector('eSortNone')], HeaderComp.prototype, "eSortNone", void 0);