var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BeanStub } from "../../context/beanStub";
import { Autowired, PostConstruct } from "../../context/context";
import { Events } from "../../eventKeys";
import { isBrowserSafari } from "../../utils/browser";
import { HeaderFilterCellCtrl } from "../cells/floatingFilter/headerFilterCellCtrl";
import { HeaderCellCtrl } from "../cells/column/headerCellCtrl";
import { HeaderGroupCellCtrl } from "../cells/columnGroup/headerGroupCellCtrl";
import { HeaderRowType } from "./headerRowComp";
import { values } from "../../utils/generic";
let instanceIdSequence = 0;
export class HeaderRowCtrl extends BeanStub {
  constructor(rowIndex, pinned, type) {
    super();
    this.instanceId = instanceIdSequence++;
    this.rowIndex = rowIndex;
    this.pinned = pinned;
    this.type = type;
    const typeClass = type == HeaderRowType.COLUMN_GROUP ? `zing-header-row-column-group` : type == HeaderRowType.FLOATING_FILTER ? `zing-header-row-column-filter` : `zing-header-row-column`;
    this.headerRowClass = `zing-header-row ${typeClass}`;
  }
  postConstruct() {
    this.isPrintLayout = this.gridOptionsService.isDomLayout('print');
    this.isEnsureDomOrder = this.gridOptionsService.get('ensureDomOrder');
  }
  getInstanceId() {
    return this.instanceId;
  }
  setComp(comp, initCompState = true) {
    this.comp = comp;
    if (initCompState) {
      this.onRowHeightChanged();
      this.onVirtualColumnsChanged();
    }
    this.setWidth();
    this.addEventListeners();
  }
  getHeaderRowClass() {
    return this.headerRowClass;
  }
  getAriaRowIndex() {
    return this.rowIndex + 1;
  }
  getTransform() {
    if (isBrowserSafari()) {
      return 'translateZ(0)';
    }
  }
  addEventListeners() {
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_RESIZED, this.onColumnResized.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_DISPLAYED_COLUMNS_CHANGED, this.onDisplayedColumnsChanged.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_VIRTUAL_COLUMNS_CHANGED, params => this.onVirtualColumnsChanged(params.afterScroll));
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_HEADER_HEIGHT_CHANGED, this.onRowHeightChanged.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_GRID_STYLES_CHANGED, this.onRowHeightChanged.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_ADVANCED_FILTER_ENABLED_CHANGED, this.onRowHeightChanged.bind(this));
    this.addManagedPropertyListener('domLayout', this.onDisplayedColumnsChanged.bind(this));
    this.addManagedPropertyListener('ensureDomOrder', e => this.isEnsureDomOrder = e.currentValue);
    this.addManagedPropertyListener('headerHeight', this.onRowHeightChanged.bind(this));
    this.addManagedPropertyListener('pivotHeaderHeight', this.onRowHeightChanged.bind(this));
    this.addManagedPropertyListener('groupHeaderHeight', this.onRowHeightChanged.bind(this));
    this.addManagedPropertyListener('pivotGroupHeaderHeight', this.onRowHeightChanged.bind(this));
    this.addManagedPropertyListener('floatingFiltersHeight', this.onRowHeightChanged.bind(this));
  }
  getHeaderCellCtrl(column) {
    if (!this.headerCellCtrls) {
      return;
    }
    return values(this.headerCellCtrls).find(cellCtrl => cellCtrl.getColumnGroupChild() === column);
  }
  onDisplayedColumnsChanged() {
    this.isPrintLayout = this.gridOptionsService.isDomLayout('print');
    this.onVirtualColumnsChanged();
    this.setWidth();
    this.onRowHeightChanged();
  }
  getType() {
    return this.type;
  }
  onColumnResized() {
    this.setWidth();
  }
  setWidth() {
    const width = this.getWidthForRow();
    this.comp.setWidth(`${width}px`);
  }
  getWidthForRow() {
    if (this.isPrintLayout) {
      const pinned = this.pinned != null;
      if (pinned) {
        return 0;
      }
      return this.columnModel.getContainerWidth('right') + this.columnModel.getContainerWidth('left') + this.columnModel.getContainerWidth(null);
    }
    return this.columnModel.getContainerWidth(this.pinned);
  }
  onRowHeightChanged() {
    var {
      topOffset,
      rowHeight
    } = this.getTopAndHeight();
    this.comp.setTop(topOffset + 'px');
    this.comp.setHeight(rowHeight + 'px');
  }
  getTopAndHeight() {
    let headerRowCount = this.columnModel.getHeaderRowCount();
    const sizes = [];
    let numberOfFloating = 0;
    if (this.filterManager.hasFloatingFilters()) {
      headerRowCount++;
      numberOfFloating = 1;
    }
    const groupHeight = this.columnModel.getColumnGroupHeaderRowHeight();
    const headerHeight = this.columnModel.getColumnHeaderRowHeight();
    const numberOfNonGroups = 1 + numberOfFloating;
    const numberOfGroups = headerRowCount - numberOfNonGroups;
    for (let i = 0; i < numberOfGroups; i++) {
      sizes.push(groupHeight);
    }
    sizes.push(headerHeight);
    for (let i = 0; i < numberOfFloating; i++) {
      sizes.push(this.columnModel.getFloatingFiltersHeight());
    }
    let topOffset = 0;
    for (let i = 0; i < this.rowIndex; i++) {
      topOffset += sizes[i];
    }
    const rowHeight = sizes[this.rowIndex];
    return {
      topOffset,
      rowHeight
    };
  }
  getPinned() {
    return this.pinned;
  }
  getRowIndex() {
    return this.rowIndex;
  }
  onVirtualColumnsChanged(afterScroll = false) {
    const ctrlsToDisplay = this.getHeaderCtrls();
    const forceOrder = this.isEnsureDomOrder || this.isPrintLayout;
    this.comp.setHeaderCtrls(ctrlsToDisplay, forceOrder, afterScroll);
  }
  getHeaderCtrls() {
    const oldCtrls = this.headerCellCtrls;
    this.headerCellCtrls = new Map();
    const columns = this.getColumnsInViewport();
    for (const child of columns) {
      this.recycleAndCreateHeaderCtrls(child, oldCtrls);
    }
    const isFocusedAndDisplayed = ctrl => {
      const isFocused = this.focusService.isHeaderWrapperFocused(ctrl);
      if (!isFocused) {
        return false;
      }
      const isDisplayed = this.columnModel.isDisplayed(ctrl.getColumnGroupChild());
      return isDisplayed;
    };
    if (oldCtrls) {
      for (const [id, oldCtrl] of oldCtrls) {
        const keepCtrl = isFocusedAndDisplayed(oldCtrl);
        if (keepCtrl) {
          this.headerCellCtrls.set(id, oldCtrl);
        } else {
          this.destroyBean(oldCtrl);
        }
      }
    }
    const ctrlsToDisplay = Array.from(this.headerCellCtrls.values());
    return ctrlsToDisplay;
  }
  recycleAndCreateHeaderCtrls(headerColumn, oldCtrls) {
    if (!this.headerCellCtrls) {
      return;
    }
    if (headerColumn.isEmptyGroup()) {
      return;
    }
    const idOfChild = headerColumn.getUniqueId();
    let headerCtrl;
    if (oldCtrls) {
      headerCtrl = oldCtrls.get(idOfChild);
      oldCtrls.delete(idOfChild);
    }
    const forOldColumn = headerCtrl && headerCtrl.getColumnGroupChild() != headerColumn;
    if (forOldColumn) {
      this.destroyBean(headerCtrl);
      headerCtrl = undefined;
    }
    if (headerCtrl == null) {
      switch (this.type) {
        case HeaderRowType.FLOATING_FILTER:
          headerCtrl = this.createBean(new HeaderFilterCellCtrl(headerColumn, this));
          break;
        case HeaderRowType.COLUMN_GROUP:
          headerCtrl = this.createBean(new HeaderGroupCellCtrl(headerColumn, this));
          break;
        default:
          headerCtrl = this.createBean(new HeaderCellCtrl(headerColumn, this));
          break;
      }
    }
    this.headerCellCtrls.set(idOfChild, headerCtrl);
  }
  getColumnsInViewport() {
    return this.isPrintLayout ? this.getColumnsInViewportPrintLayout() : this.getColumnsInViewportNormalLayout();
  }
  getColumnsInViewportPrintLayout() {
    if (this.pinned != null) {
      return [];
    }
    let viewportColumns = [];
    const actualDepth = this.getActualDepth();
    ['left', null, 'right'].forEach(pinned => {
      const items = this.columnModel.getVirtualHeaderGroupRow(pinned, actualDepth);
      viewportColumns = viewportColumns.concat(items);
    });
    return viewportColumns;
  }
  getActualDepth() {
    return this.type == HeaderRowType.FLOATING_FILTER ? this.rowIndex - 1 : this.rowIndex;
  }
  getColumnsInViewportNormalLayout() {
    return this.columnModel.getVirtualHeaderGroupRow(this.pinned, this.getActualDepth());
  }
  focusHeader(column, event) {
    if (!this.headerCellCtrls) {
      return false;
    }
    const allCtrls = Array.from(this.headerCellCtrls.values());
    const ctrl = allCtrls.find(ctrl => ctrl.getColumnGroupChild() == column);
    if (!ctrl) {
      return false;
    }
    return ctrl.focus(event);
  }
  destroy() {
    if (this.headerCellCtrls) {
      this.headerCellCtrls.forEach(ctrl => {
        this.destroyBean(ctrl);
      });
    }
    this.headerCellCtrls = undefined;
    super.destroy();
  }
}
__decorate([Autowired('columnModel')], HeaderRowCtrl.prototype, "columnModel", void 0);
__decorate([Autowired('focusService')], HeaderRowCtrl.prototype, "focusService", void 0);
__decorate([Autowired('filterManager')], HeaderRowCtrl.prototype, "filterManager", void 0);
__decorate([PostConstruct], HeaderRowCtrl.prototype, "postConstruct", null);