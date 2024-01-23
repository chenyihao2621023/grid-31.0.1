var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, PostConstruct } from "../context/context";
import { EventService } from "../eventService";
import { exists, missing } from "../utils/generic";
import { mergeDeep } from "../utils/object";
const COL_DEF_DEFAULTS = {
  resizable: true,
  sortable: true
};
let instanceIdSequence = 0;
export function getNextColInstanceId() {
  return instanceIdSequence++;
}
export class Column {
  constructor(colDef, userProvidedColDef, colId, primary) {
    this.instanceId = getNextColInstanceId();
    this.autoHeaderHeight = null;
    this.moving = false;
    this.menuVisible = false;
    this.lastLeftPinned = false;
    this.firstRightPinned = false;
    this.filterActive = false;
    this.eventService = new EventService();
    this.tooltipEnabled = false;
    this.rowGroupActive = false;
    this.pivotActive = false;
    this.aggregationActive = false;
    this.colDef = colDef;
    this.userProvidedColDef = userProvidedColDef;
    this.colId = colId;
    this.primary = primary;
    this.setState(colDef);
  }
  getInstanceId() {
    return this.instanceId;
  }
  setState(colDef) {
    if (colDef.sort !== undefined) {
      if (colDef.sort === 'asc' || colDef.sort === 'desc') {
        this.sort = colDef.sort;
      }
    } else {
      if (colDef.initialSort === 'asc' || colDef.initialSort === 'desc') {
        this.sort = colDef.initialSort;
      }
    }
    const sortIndex = colDef.sortIndex;
    const initialSortIndex = colDef.initialSortIndex;
    if (sortIndex !== undefined) {
      if (sortIndex !== null) {
        this.sortIndex = sortIndex;
      }
    } else {
      if (initialSortIndex !== null) {
        this.sortIndex = initialSortIndex;
      }
    }
    const hide = colDef.hide;
    const initialHide = colDef.initialHide;
    if (hide !== undefined) {
      this.visible = !hide;
    } else {
      this.visible = !initialHide;
    }
    if (colDef.pinned !== undefined) {
      this.setPinned(colDef.pinned);
    } else {
      this.setPinned(colDef.initialPinned);
    }
    const flex = colDef.flex;
    const initialFlex = colDef.initialFlex;
    if (flex !== undefined) {
      this.flex = flex;
    } else if (initialFlex !== undefined) {
      this.flex = initialFlex;
    }
  }
  setColDef(colDef, userProvidedColDef, source = 'api') {
    this.colDef = colDef;
    this.userProvidedColDef = userProvidedColDef;
    this.initMinAndMaxWidths();
    this.initDotNotation();
    this.initTooltip();
    this.eventService.dispatchEvent(this.createColumnEvent('colDefChanged', source));
  }
  getUserProvidedColDef() {
    return this.userProvidedColDef;
  }
  setParent(parent) {
    this.parent = parent;
  }
  getParent() {
    return this.parent;
  }
  setOriginalParent(originalParent) {
    this.originalParent = originalParent;
  }
  getOriginalParent() {
    return this.originalParent;
  }
  initialise() {
    this.initMinAndMaxWidths();
    this.resetActualWidth('gridInitializing');
    this.initDotNotation();
    this.initTooltip();
  }
  initDotNotation() {
    const suppressDotNotation = this.gridOptionsService.get('suppressFieldDotNotation');
    this.fieldContainsDots = exists(this.colDef.field) && this.colDef.field.indexOf('.') >= 0 && !suppressDotNotation;
    this.tooltipFieldContainsDots = exists(this.colDef.tooltipField) && this.colDef.tooltipField.indexOf('.') >= 0 && !suppressDotNotation;
  }
  initMinAndMaxWidths() {
    const colDef = this.colDef;
    this.minWidth = this.columnUtils.calculateColMinWidth(colDef);
    this.maxWidth = this.columnUtils.calculateColMaxWidth(colDef);
  }
  initTooltip() {
    this.tooltipEnabled = exists(this.colDef.tooltipField) || exists(this.colDef.tooltipValueGetter) || exists(this.colDef.tooltipComponent);
  }
  resetActualWidth(source = 'api') {
    const initialWidth = this.columnUtils.calculateColInitialWidth(this.colDef);
    this.setActualWidth(initialWidth, source, true);
  }
  isEmptyGroup() {
    return false;
  }
  isRowGroupDisplayed(colId) {
    if (missing(this.colDef) || missing(this.colDef.showRowGroup)) {
      return false;
    }
    const showingAllGroups = this.colDef.showRowGroup === true;
    const showingThisGroup = this.colDef.showRowGroup === colId;
    return showingAllGroups || showingThisGroup;
  }
  isPrimary() {
    return this.primary;
  }
  isFilterAllowed() {
    const filterDefined = !!this.colDef.filter;
    return filterDefined;
  }
  isFieldContainsDots() {
    return this.fieldContainsDots;
  }
  isTooltipEnabled() {
    return this.tooltipEnabled;
  }
  isTooltipFieldContainsDots() {
    return this.tooltipFieldContainsDots;
  }
  addEventListener(eventType, listener) {
    this.eventService.addEventListener(eventType, listener);
  }
  removeEventListener(eventType, listener) {
    this.eventService.removeEventListener(eventType, listener);
  }
  createColumnFunctionCallbackParams(rowNode) {
    return {
      node: rowNode,
      data: rowNode.data,
      column: this,
      colDef: this.colDef,
      context: this.gridOptionsService.context,
      api: this.gridOptionsService.api,
      columnApi: this.gridOptionsService.columnApi
    };
  }
  isSuppressNavigable(rowNode) {
    if (typeof this.colDef.suppressNavigable === 'boolean') {
      return this.colDef.suppressNavigable;
    }
    if (typeof this.colDef.suppressNavigable === 'function') {
      const params = this.createColumnFunctionCallbackParams(rowNode);
      const userFunc = this.colDef.suppressNavigable;
      return userFunc(params);
    }
    return false;
  }
  isCellEditable(rowNode) {
    if (rowNode.group && !this.gridOptionsService.get('enableGroupEdit')) {
      return false;
    }
    return this.isColumnFunc(rowNode, this.colDef.editable);
  }
  isSuppressFillHandle() {
    return !!this.colDef.suppressFillHandle;
  }
  isAutoHeight() {
    return !!this.colDef.autoHeight;
  }
  isAutoHeaderHeight() {
    return !!this.colDef.autoHeaderHeight;
  }
  isRowDrag(rowNode) {
    return this.isColumnFunc(rowNode, this.colDef.rowDrag);
  }
  isDndSource(rowNode) {
    return this.isColumnFunc(rowNode, this.colDef.dndSource);
  }
  isCellCheckboxSelection(rowNode) {
    return this.isColumnFunc(rowNode, this.colDef.checkboxSelection);
  }
  isSuppressPaste(rowNode) {
    return this.isColumnFunc(rowNode, this.colDef ? this.colDef.suppressPaste : null);
  }
  isResizable() {
    return !!this.getColDefValue('resizable');
  }
  getColDefValue(key) {
    var _a;
    return (_a = this.colDef[key]) !== null && _a !== void 0 ? _a : COL_DEF_DEFAULTS[key];
  }
  isColumnFunc(rowNode, value) {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'function') {
      const params = this.createColumnFunctionCallbackParams(rowNode);
      const editableFunc = value;
      return editableFunc(params);
    }
    return false;
  }
  setMoving(moving, source = "api") {
    this.moving = moving;
    this.eventService.dispatchEvent(this.createColumnEvent('movingChanged', source));
  }
  createColumnEvent(type, source) {
    return {
      type: type,
      column: this,
      columns: [this],
      source: source,
      api: this.gridOptionsService.api,
      columnApi: this.gridOptionsService.columnApi,
      context: this.gridOptionsService.context
    };
  }
  isMoving() {
    return this.moving;
  }
  getSort() {
    return this.sort;
  }
  setSort(sort, source = "api") {
    if (this.sort !== sort) {
      this.sort = sort;
      this.eventService.dispatchEvent(this.createColumnEvent('sortChanged', source));
    }
    this.dispatchStateUpdatedEvent('sort');
  }
  setMenuVisible(visible, source = "api") {
    if (this.menuVisible !== visible) {
      this.menuVisible = visible;
      this.eventService.dispatchEvent(this.createColumnEvent('menuVisibleChanged', source));
    }
  }
  isMenuVisible() {
    return this.menuVisible;
  }
  isSortable() {
    return !!this.getColDefValue('sortable');
  }
  isSortAscending() {
    return this.sort === 'asc';
  }
  isSortDescending() {
    return this.sort === 'desc';
  }
  isSortNone() {
    return missing(this.sort);
  }
  isSorting() {
    return exists(this.sort);
  }
  getSortIndex() {
    return this.sortIndex;
  }
  setSortIndex(sortOrder) {
    this.sortIndex = sortOrder;
    this.dispatchStateUpdatedEvent('sortIndex');
  }
  setAggFunc(aggFunc) {
    this.aggFunc = aggFunc;
    this.dispatchStateUpdatedEvent('aggFunc');
  }
  getAggFunc() {
    return this.aggFunc;
  }
  getLeft() {
    return this.left;
  }
  getOldLeft() {
    return this.oldLeft;
  }
  getRight() {
    return this.left + this.actualWidth;
  }
  setLeft(left, source = "api") {
    this.oldLeft = this.left;
    if (this.left !== left) {
      this.left = left;
      this.eventService.dispatchEvent(this.createColumnEvent('leftChanged', source));
    }
  }
  isFilterActive() {
    return this.filterActive;
  }
  setFilterActive(active, source = "api", additionalEventAttributes) {
    if (this.filterActive !== active) {
      this.filterActive = active;
      this.eventService.dispatchEvent(this.createColumnEvent('filterActiveChanged', source));
    }
    const filterChangedEvent = this.createColumnEvent('filterChanged', source);
    if (additionalEventAttributes) {
      mergeDeep(filterChangedEvent, additionalEventAttributes);
    }
    this.eventService.dispatchEvent(filterChangedEvent);
  }
  isHovered() {
    return this.columnHoverService.isHovered(this);
  }
  setPinned(pinned) {
    if (pinned === true || pinned === 'left') {
      this.pinned = 'left';
    } else if (pinned === 'right') {
      this.pinned = 'right';
    } else {
      this.pinned = null;
    }
    this.dispatchStateUpdatedEvent('pinned');
  }
  setFirstRightPinned(firstRightPinned, source = "api") {
    if (this.firstRightPinned !== firstRightPinned) {
      this.firstRightPinned = firstRightPinned;
      this.eventService.dispatchEvent(this.createColumnEvent('firstRightPinnedChanged', source));
    }
  }
  setLastLeftPinned(lastLeftPinned, source = "api") {
    if (this.lastLeftPinned !== lastLeftPinned) {
      this.lastLeftPinned = lastLeftPinned;
      this.eventService.dispatchEvent(this.createColumnEvent('lastLeftPinnedChanged', source));
    }
  }
  isFirstRightPinned() {
    return this.firstRightPinned;
  }
  isLastLeftPinned() {
    return this.lastLeftPinned;
  }
  isPinned() {
    return this.pinned === 'left' || this.pinned === 'right';
  }
  isPinnedLeft() {
    return this.pinned === 'left';
  }
  isPinnedRight() {
    return this.pinned === 'right';
  }
  getPinned() {
    return this.pinned;
  }
  setVisible(visible, source = "api") {
    const newValue = visible === true;
    if (this.visible !== newValue) {
      this.visible = newValue;
      this.eventService.dispatchEvent(this.createColumnEvent('visibleChanged', source));
    }
    this.dispatchStateUpdatedEvent('hide');
  }
  isVisible() {
    return this.visible;
  }
  isSpanHeaderHeight() {
    const colDef = this.getColDef();
    return !colDef.suppressSpanHeaderHeight && !colDef.autoHeaderHeight;
  }
  getColDef() {
    return this.colDef;
  }
  getColumnGroupShow() {
    return this.colDef.columnGroupShow;
  }
  getColId() {
    return this.colId;
  }
  getId() {
    return this.colId;
  }
  getUniqueId() {
    return this.colId;
  }
  getDefinition() {
    return this.colDef;
  }
  getActualWidth() {
    return this.actualWidth;
  }
  getAutoHeaderHeight() {
    return this.autoHeaderHeight;
  }
  setAutoHeaderHeight(height) {
    const changed = height !== this.autoHeaderHeight;
    this.autoHeaderHeight = height;
    return changed;
  }
  createBaseColDefParams(rowNode) {
    const params = {
      node: rowNode,
      data: rowNode.data,
      colDef: this.colDef,
      column: this,
      api: this.gridOptionsService.api,
      columnApi: this.gridOptionsService.columnApi,
      context: this.gridOptionsService.context
    };
    return params;
  }
  getColSpan(rowNode) {
    if (missing(this.colDef.colSpan)) {
      return 1;
    }
    const params = this.createBaseColDefParams(rowNode);
    const colSpan = this.colDef.colSpan(params);
    return Math.max(colSpan, 1);
  }
  getRowSpan(rowNode) {
    if (missing(this.colDef.rowSpan)) {
      return 1;
    }
    const params = this.createBaseColDefParams(rowNode);
    const rowSpan = this.colDef.rowSpan(params);
    return Math.max(rowSpan, 1);
  }
  setActualWidth(actualWidth, source = "api", silent = false) {
    if (this.minWidth != null) {
      actualWidth = Math.max(actualWidth, this.minWidth);
    }
    if (this.maxWidth != null) {
      actualWidth = Math.min(actualWidth, this.maxWidth);
    }
    if (this.actualWidth !== actualWidth) {
      this.actualWidth = actualWidth;
      if (this.flex && source !== 'flex' && source !== 'gridInitializing') {
        this.flex = null;
      }
      if (!silent) {
        this.fireColumnWidthChangedEvent(source);
      }
    }
    this.dispatchStateUpdatedEvent('width');
  }
  fireColumnWidthChangedEvent(source) {
    this.eventService.dispatchEvent(this.createColumnEvent('widthChanged', source));
  }
  isGreaterThanMax(width) {
    if (this.maxWidth != null) {
      return width > this.maxWidth;
    }
    return false;
  }
  getMinWidth() {
    return this.minWidth;
  }
  getMaxWidth() {
    return this.maxWidth;
  }
  getFlex() {
    return this.flex || 0;
  }
  setFlex(flex) {
    if (this.flex !== flex) {
      this.flex = flex;
    }
    this.dispatchStateUpdatedEvent('flex');
  }
  setMinimum(source = "api") {
    if (exists(this.minWidth)) {
      this.setActualWidth(this.minWidth, source);
    }
  }
  setRowGroupActive(rowGroup, source = "api") {
    if (this.rowGroupActive !== rowGroup) {
      this.rowGroupActive = rowGroup;
      this.eventService.dispatchEvent(this.createColumnEvent('columnRowGroupChanged', source));
    }
    this.dispatchStateUpdatedEvent('rowGroup');
  }
  isRowGroupActive() {
    return this.rowGroupActive;
  }
  setPivotActive(pivot, source = "api") {
    if (this.pivotActive !== pivot) {
      this.pivotActive = pivot;
      this.eventService.dispatchEvent(this.createColumnEvent('columnPivotChanged', source));
    }
    this.dispatchStateUpdatedEvent('pivot');
  }
  isPivotActive() {
    return this.pivotActive;
  }
  isAnyFunctionActive() {
    return this.isPivotActive() || this.isRowGroupActive() || this.isValueActive();
  }
  isAnyFunctionAllowed() {
    return this.isAllowPivot() || this.isAllowRowGroup() || this.isAllowValue();
  }
  setValueActive(value, source = "api") {
    if (this.aggregationActive !== value) {
      this.aggregationActive = value;
      this.eventService.dispatchEvent(this.createColumnEvent('columnValueChanged', source));
    }
  }
  isValueActive() {
    return this.aggregationActive;
  }
  isAllowPivot() {
    return this.colDef.enablePivot === true;
  }
  isAllowValue() {
    return this.colDef.enableValue === true;
  }
  isAllowRowGroup() {
    return this.colDef.enableRowGroup === true;
  }
  getMenuTabs(defaultValues) {
    let menuTabs = this.getColDef().menuTabs;
    if (menuTabs == null) {
      menuTabs = defaultValues;
    }
    return menuTabs;
  }
  dispatchStateUpdatedEvent(key) {
    this.eventService.dispatchEvent({
      type: Column.EVENT_STATE_UPDATED,
      key
    });
  }
}
Column.EVENT_MOVING_CHANGED = 'movingChanged';
Column.EVENT_LEFT_CHANGED = 'leftChanged';
Column.EVENT_WIDTH_CHANGED = 'widthChanged';
Column.EVENT_LAST_LEFT_PINNED_CHANGED = 'lastLeftPinnedChanged';
Column.EVENT_FIRST_RIGHT_PINNED_CHANGED = 'firstRightPinnedChanged';
Column.EVENT_VISIBLE_CHANGED = 'visibleChanged';
Column.EVENT_FILTER_CHANGED = 'filterChanged';
Column.EVENT_FILTER_ACTIVE_CHANGED = 'filterActiveChanged';
Column.EVENT_SORT_CHANGED = 'sortChanged';
Column.EVENT_COL_DEF_CHANGED = 'colDefChanged';
Column.EVENT_MENU_VISIBLE_CHANGED = 'menuVisibleChanged';
Column.EVENT_ROW_GROUP_CHANGED = 'columnRowGroupChanged';
Column.EVENT_PIVOT_CHANGED = 'columnPivotChanged';
Column.EVENT_VALUE_CHANGED = 'columnValueChanged';
Column.EVENT_STATE_UPDATED = 'columnStateUpdated';
__decorate([Autowired('gridOptionsService')], Column.prototype, "gridOptionsService", void 0);
__decorate([Autowired('columnUtils')], Column.prototype, "columnUtils", void 0);
__decorate([Autowired('columnHoverService')], Column.prototype, "columnHoverService", void 0);
__decorate([PostConstruct], Column.prototype, "initialise", null);