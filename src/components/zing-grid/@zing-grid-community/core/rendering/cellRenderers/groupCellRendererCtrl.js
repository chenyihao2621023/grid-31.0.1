var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { KeyCode } from "../../constants/keyCode";
import { BeanStub } from "../../context/beanStub";
import { Autowired } from "../../context/context";
import { RowNode } from "../../entities/rowNode";
import { removeAriaExpanded, setAriaExpanded } from "../../utils/aria";
import { isElementInEventPath, isStopPropagationForZingGrid, stopPropagationForZingGrid } from "../../utils/event";
import { missing } from "../../utils/generic";
import { createIconNoSpan } from "../../utils/icon";
import { cloneObject } from "../../utils/object";
import { CheckboxSelectionComponent } from "../checkboxSelectionComponent";
import { RowDragComp } from "../row/rowDragComp";
export class GroupCellRendererCtrl extends BeanStub {
  init(comp, eGui, eCheckbox, eExpanded, eContracted, compClass, params) {
    var _a, _b, _c, _d;
    this.params = params;
    this.eGui = eGui;
    this.eCheckbox = eCheckbox;
    this.eExpanded = eExpanded;
    this.eContracted = eContracted;
    this.comp = comp;
    this.compClass = compClass;
    const {
      node,
      value,
      colDef
    } = params;
    const topLevelFooter = this.isTopLevelFooter();
    if (!topLevelFooter) {
      const embeddedRowMismatch = this.isEmbeddedRowMismatch();
      if (embeddedRowMismatch) {
        return;
      }
      if (node.footer && this.gridOptionsService.get('groupHideOpenParents')) {
        const showRowGroup = colDef && colDef.showRowGroup;
        const rowGroupColumnId = node.rowGroupColumn && node.rowGroupColumn.getColId();
        if (showRowGroup !== rowGroupColumnId) {
          return;
        }
      }
    }
    this.setupShowingValueForOpenedParent();
    this.findDisplayedGroupNode();
    if (!topLevelFooter) {
      const showingFooterTotal = params.node.footer && params.node.rowGroupIndex === this.columnModel.getRowGroupColumns().findIndex(c => {
        var _a;
        return c.getColId() === ((_a = params.colDef) === null || _a === void 0 ? void 0 : _a.showRowGroup);
      });
      const isAlwaysShowing = this.gridOptionsService.get('groupDisplayType') != 'multipleColumns' || this.gridOptionsService.get('treeData');
      const showOpenGroupValue = isAlwaysShowing || this.gridOptionsService.get('showOpenedGroup') && !params.node.footer && (!params.node.group || params.node.rowGroupIndex != null && params.node.rowGroupIndex > this.columnModel.getRowGroupColumns().findIndex(c => {
        var _a;
        return c.getColId() === ((_a = params.colDef) === null || _a === void 0 ? void 0 : _a.showRowGroup);
      }));
      const leafWithValues = !node.group && (((_a = this.params.colDef) === null || _a === void 0 ? void 0 : _a.field) || ((_b = this.params.colDef) === null || _b === void 0 ? void 0 : _b.valueGetter));
      const isExpandable = this.isExpandable();
      const showPivotModeLeafValue = this.columnModel.isPivotMode() && node.leafGroup && ((_c = node.rowGroupColumn) === null || _c === void 0 ? void 0 : _c.getColId()) === ((_d = params.column) === null || _d === void 0 ? void 0 : _d.getColDef().showRowGroup);
      const canSkipRenderingCell = !this.showingValueForOpenedParent && !isExpandable && !leafWithValues && !showOpenGroupValue && !showingFooterTotal && !showPivotModeLeafValue;
      if (canSkipRenderingCell) {
        return;
      }
    }
    this.addExpandAndContract();
    this.addFullWidthRowDraggerIfNeeded();
    this.addCheckboxIfNeeded();
    this.addValueElement();
    this.setupIndent();
    this.refreshAriaExpanded();
  }
  getCellAriaRole() {
    var _a, _b;
    const colDefAriaRole = (_a = this.params.colDef) === null || _a === void 0 ? void 0 : _a.cellAriaRole;
    const columnColDefAriaRole = (_b = this.params.column) === null || _b === void 0 ? void 0 : _b.getColDef().cellAriaRole;
    return colDefAriaRole || columnColDefAriaRole || 'gridcell';
  }
  destroy() {
    super.destroy();
    this.expandListener = null;
  }
  refreshAriaExpanded() {
    const {
      node,
      eParentOfValue
    } = this.params;
    if (this.expandListener) {
      this.expandListener = this.expandListener();
    }
    if (!this.isExpandable()) {
      removeAriaExpanded(eParentOfValue);
      return;
    }
    const listener = () => {
      setAriaExpanded(eParentOfValue, !!node.expanded);
    };
    this.expandListener = this.addManagedListener(node, RowNode.EVENT_EXPANDED_CHANGED, listener) || null;
    listener();
  }
  isTopLevelFooter() {
    if (!this.gridOptionsService.get('groupIncludeTotalFooter')) {
      return false;
    }
    if (this.params.value != null || this.params.node.level != -1) {
      return false;
    }
    const colDef = this.params.colDef;
    const doingFullWidth = colDef == null;
    if (doingFullWidth) {
      return true;
    }
    if (colDef.showRowGroup === true) {
      return true;
    }
    const rowGroupCols = this.columnModel.getRowGroupColumns();
    if (!rowGroupCols || rowGroupCols.length === 0) {
      return true;
    }
    const firstRowGroupCol = rowGroupCols[0];
    return firstRowGroupCol.getId() === colDef.showRowGroup;
  }
  isEmbeddedRowMismatch() {
    if (!this.params.fullWidth || !this.gridOptionsService.get('embedFullWidthRows')) {
      return false;
    }
    const pinnedLeftCell = this.params.pinned === 'left';
    const pinnedRightCell = this.params.pinned === 'right';
    const bodyCell = !pinnedLeftCell && !pinnedRightCell;
    if (this.gridOptionsService.get('enableRtl')) {
      if (this.columnModel.isPinningLeft()) {
        return !pinnedRightCell;
      }
      return !bodyCell;
    }
    if (this.columnModel.isPinningLeft()) {
      return !pinnedLeftCell;
    }
    return !bodyCell;
  }
  findDisplayedGroupNode() {
    const column = this.params.column;
    const rowNode = this.params.node;
    if (this.showingValueForOpenedParent) {
      let pointer = rowNode.parent;
      while (pointer != null) {
        if (pointer.rowGroupColumn && column.isRowGroupDisplayed(pointer.rowGroupColumn.getId())) {
          this.displayedGroupNode = pointer;
          break;
        }
        pointer = pointer.parent;
      }
    }
    if (missing(this.displayedGroupNode)) {
      this.displayedGroupNode = rowNode;
    }
  }
  setupShowingValueForOpenedParent() {
    const rowNode = this.params.node;
    const column = this.params.column;
    if (!this.gridOptionsService.get('groupHideOpenParents')) {
      this.showingValueForOpenedParent = false;
      return;
    }
    if (!rowNode.groupData) {
      this.showingValueForOpenedParent = false;
      return;
    }
    const showingGroupNode = rowNode.rowGroupColumn != null;
    if (showingGroupNode) {
      const keyOfGroupingColumn = rowNode.rowGroupColumn.getId();
      const configuredToShowThisGroupLevel = column.isRowGroupDisplayed(keyOfGroupingColumn);
      if (configuredToShowThisGroupLevel) {
        this.showingValueForOpenedParent = false;
        return;
      }
    }
    const valPresent = rowNode.groupData[column.getId()] != null;
    this.showingValueForOpenedParent = valPresent;
  }
  addValueElement() {
    if (this.displayedGroupNode.footer) {
      this.addFooterValue();
    } else {
      this.addGroupValue();
      this.addChildCount();
    }
  }
  addGroupValue() {
    var _a;
    const paramsAdjusted = this.adjustParamsWithDetailsFromRelatedColumn();
    const innerCompDetails = this.getInnerCompDetails(paramsAdjusted);
    const {
      valueFormatted,
      value
    } = paramsAdjusted;
    let valueWhenNoRenderer = valueFormatted;
    if (valueWhenNoRenderer == null) {
      const isGroupColForNode = this.displayedGroupNode.rowGroupColumn && ((_a = this.params.column) === null || _a === void 0 ? void 0 : _a.isRowGroupDisplayed(this.displayedGroupNode.rowGroupColumn.getId()));
      if (this.displayedGroupNode.key === "" && this.displayedGroupNode.group && isGroupColForNode) {
        const localeTextFunc = this.localeService.getLocaleTextFunc();
        valueWhenNoRenderer = localeTextFunc('blanks', '(Blanks)');
      } else {
        valueWhenNoRenderer = value !== null && value !== void 0 ? value : null;
      }
    }
    this.comp.setInnerRenderer(innerCompDetails, valueWhenNoRenderer);
  }
  adjustParamsWithDetailsFromRelatedColumn() {
    const relatedColumn = this.displayedGroupNode.rowGroupColumn;
    const column = this.params.column;
    if (!relatedColumn) {
      return this.params;
    }
    const notFullWidth = column != null;
    if (notFullWidth) {
      const showingThisRowGroup = column.isRowGroupDisplayed(relatedColumn.getId());
      if (!showingThisRowGroup) {
        return this.params;
      }
    }
    const params = this.params;
    const {
      value,
      node
    } = this.params;
    const valueFormatted = this.valueFormatterService.formatValue(relatedColumn, node, value);
    const paramsAdjusted = Object.assign(Object.assign({}, params), {
      valueFormatted: valueFormatted
    });
    return paramsAdjusted;
  }
  addFooterValue() {
    const footerValueGetter = this.params.footerValueGetter;
    let footerValue = '';
    if (footerValueGetter) {
      const paramsClone = cloneObject(this.params);
      paramsClone.value = this.params.value;
      if (typeof footerValueGetter === 'function') {
        footerValue = footerValueGetter(paramsClone);
      } else if (typeof footerValueGetter === 'string') {
        footerValue = this.expressionService.evaluate(footerValueGetter, paramsClone);
      } else {
        console.warn('ZING Grid: footerValueGetter should be either a function or a string (expression)');
      }
    } else {
      footerValue = 'Total ' + (this.params.value != null ? this.params.value : '');
    }
    const innerCompDetails = this.getInnerCompDetails(this.params);
    this.comp.setInnerRenderer(innerCompDetails, footerValue);
  }
  getInnerCompDetails(params) {
    if (params.fullWidth) {
      return this.userComponentFactory.getFullWidthGroupRowInnerCellRenderer(this.gridOptionsService.get('groupRowRendererParams'), params);
    }
    const innerCompDetails = this.userComponentFactory.getInnerRendererDetails(params, params);
    const isGroupRowRenderer = details => details && details.componentClass == this.compClass;
    if (innerCompDetails && !isGroupRowRenderer(innerCompDetails)) {
      return innerCompDetails;
    }
    const relatedColumn = this.displayedGroupNode.rowGroupColumn;
    const relatedColDef = relatedColumn ? relatedColumn.getColDef() : undefined;
    if (!relatedColDef) {
      return;
    }
    const relatedCompDetails = this.userComponentFactory.getCellRendererDetails(relatedColDef, params);
    if (relatedCompDetails && !isGroupRowRenderer(relatedCompDetails)) {
      return relatedCompDetails;
    }
    if (isGroupRowRenderer(relatedCompDetails) && relatedColDef.cellRendererParams && relatedColDef.cellRendererParams.innerRenderer) {
      const res = this.userComponentFactory.getInnerRendererDetails(relatedColDef.cellRendererParams, params);
      return res;
    }
  }
  addChildCount() {
    if (this.params.suppressCount) {
      return;
    }
    this.addManagedListener(this.displayedGroupNode, RowNode.EVENT_ALL_CHILDREN_COUNT_CHANGED, this.updateChildCount.bind(this));
    this.updateChildCount();
  }
  updateChildCount() {
    const allChildrenCount = this.displayedGroupNode.allChildrenCount;
    const showingGroupForThisNode = this.isShowRowGroupForThisRow();
    const showCount = showingGroupForThisNode && allChildrenCount != null && allChildrenCount >= 0;
    const countString = showCount ? `(${allChildrenCount})` : ``;
    this.comp.setChildCount(countString);
  }
  isShowRowGroupForThisRow() {
    if (this.gridOptionsService.get('treeData')) {
      return true;
    }
    const rowGroupColumn = this.displayedGroupNode.rowGroupColumn;
    if (!rowGroupColumn) {
      return false;
    }
    const column = this.params.column;
    const thisColumnIsInterested = column == null || column.isRowGroupDisplayed(rowGroupColumn.getId());
    return thisColumnIsInterested;
  }
  addExpandAndContract() {
    var _a;
    const params = this.params;
    const eExpandedIcon = createIconNoSpan('groupExpanded', this.gridOptionsService, null);
    const eContractedIcon = createIconNoSpan('groupContracted', this.gridOptionsService, null);
    if (eExpandedIcon) {
      this.eExpanded.appendChild(eExpandedIcon);
    }
    if (eContractedIcon) {
      this.eContracted.appendChild(eContractedIcon);
    }
    const eGroupCell = params.eGridCell;
    const isDoubleClickEdit = ((_a = this.params.column) === null || _a === void 0 ? void 0 : _a.isCellEditable(params.node)) && this.gridOptionsService.get('enableGroupEdit');
    if (!isDoubleClickEdit && this.isExpandable() && !params.suppressDoubleClickExpand) {
      this.addManagedListener(eGroupCell, 'dblclick', this.onCellDblClicked.bind(this));
    }
    this.addManagedListener(this.eExpanded, 'click', this.onExpandClicked.bind(this));
    this.addManagedListener(this.eContracted, 'click', this.onExpandClicked.bind(this));
    this.addManagedListener(eGroupCell, 'keydown', this.onKeyDown.bind(this));
    this.addManagedListener(params.node, RowNode.EVENT_EXPANDED_CHANGED, this.showExpandAndContractIcons.bind(this));
    this.showExpandAndContractIcons();
    const expandableChangedListener = this.onRowNodeIsExpandableChanged.bind(this);
    this.addManagedListener(this.displayedGroupNode, RowNode.EVENT_ALL_CHILDREN_COUNT_CHANGED, expandableChangedListener);
    this.addManagedListener(this.displayedGroupNode, RowNode.EVENT_MASTER_CHANGED, expandableChangedListener);
    this.addManagedListener(this.displayedGroupNode, RowNode.EVENT_GROUP_CHANGED, expandableChangedListener);
    this.addManagedListener(this.displayedGroupNode, RowNode.EVENT_HAS_CHILDREN_CHANGED, expandableChangedListener);
  }
  onExpandClicked(mouseEvent) {
    if (isStopPropagationForZingGrid(mouseEvent)) {
      return;
    }
    stopPropagationForZingGrid(mouseEvent);
    this.onExpandOrContract(mouseEvent);
  }
  onExpandOrContract(e) {
    const rowNode = this.displayedGroupNode;
    const nextExpandState = !rowNode.expanded;
    if (!nextExpandState && rowNode.sticky) {
      this.scrollToStickyNode(rowNode);
    }
    rowNode.setExpanded(nextExpandState, e);
  }
  scrollToStickyNode(rowNode) {
    const gridBodyCtrl = this.ctrlsService.getGridBodyCtrl();
    const scrollFeature = gridBodyCtrl.getScrollFeature();
    scrollFeature.setVerticalScrollPosition(rowNode.rowTop - rowNode.stickyRowTop);
  }
  isExpandable() {
    if (this.showingValueForOpenedParent) {
      return true;
    }
    const rowNode = this.displayedGroupNode;
    const reducedLeafNode = this.columnModel.isPivotMode() && rowNode.leafGroup;
    const expandableGroup = rowNode.isExpandable() && !rowNode.footer && !reducedLeafNode;
    if (!expandableGroup) {
      return false;
    }
    const column = this.params.column;
    const displayingForOneColumnOnly = column != null && typeof column.getColDef().showRowGroup === 'string';
    if (displayingForOneColumnOnly) {
      const showing = this.isShowRowGroupForThisRow();
      return showing;
    }
    return true;
  }
  showExpandAndContractIcons() {
    const {
      params,
      displayedGroupNode: displayedGroup,
      columnModel
    } = this;
    const {
      node
    } = params;
    const isExpandable = this.isExpandable();
    if (isExpandable) {
      const expanded = this.showingValueForOpenedParent ? true : node.expanded;
      this.comp.setExpandedDisplayed(expanded);
      this.comp.setContractedDisplayed(!expanded);
    } else {
      this.comp.setExpandedDisplayed(false);
      this.comp.setContractedDisplayed(false);
    }
    const pivotMode = columnModel.isPivotMode();
    const pivotModeAndLeafGroup = pivotMode && displayedGroup.leafGroup;
    const addExpandableCss = isExpandable && !pivotModeAndLeafGroup;
    const isTotalFooterNode = node.footer && node.level === -1;
    this.comp.addOrRemoveCssClass('zing-cell-expandable', addExpandableCss);
    this.comp.addOrRemoveCssClass('zing-row-group', addExpandableCss);
    if (pivotMode) {
      this.comp.addOrRemoveCssClass('zing-pivot-leaf-group', pivotModeAndLeafGroup);
    } else if (!isTotalFooterNode) {
      this.comp.addOrRemoveCssClass('zing-row-group-leaf-indent', !addExpandableCss);
    }
  }
  onRowNodeIsExpandableChanged() {
    this.showExpandAndContractIcons();
    this.setIndent();
    this.refreshAriaExpanded();
  }
  setupIndent() {
    const node = this.params.node;
    const suppressPadding = this.params.suppressPadding;
    if (!suppressPadding) {
      this.addManagedListener(node, RowNode.EVENT_UI_LEVEL_CHANGED, this.setIndent.bind(this));
      this.setIndent();
    }
  }
  setIndent() {
    if (this.gridOptionsService.get('groupHideOpenParents')) {
      return;
    }
    const params = this.params;
    const rowNode = params.node;
    const fullWithRow = !!params.colDef;
    const treeData = this.gridOptionsService.get('treeData');
    const manyDimensionThisColumn = !fullWithRow || treeData || params.colDef.showRowGroup === true;
    const paddingCount = manyDimensionThisColumn ? rowNode.uiLevel : 0;
    if (this.indentClass) {
      this.comp.addOrRemoveCssClass(this.indentClass, false);
    }
    this.indentClass = 'zing-row-group-indent-' + paddingCount;
    this.comp.addOrRemoveCssClass(this.indentClass, true);
  }
  addFullWidthRowDraggerIfNeeded() {
    if (!this.params.fullWidth || !this.params.rowDrag) {
      return;
    }
    const rowDragComp = new RowDragComp(() => this.params.value, this.params.node);
    this.createManagedBean(rowDragComp, this.context);
    this.eGui.insertAdjacentElement('afterbegin', rowDragComp.getGui());
  }
  isUserWantsSelected() {
    const paramsCheckbox = this.params.checkbox;
    return typeof paramsCheckbox === 'function' || paramsCheckbox === true;
  }
  addCheckboxIfNeeded() {
    const rowNode = this.displayedGroupNode;
    const checkboxNeeded = this.isUserWantsSelected() && !rowNode.footer && !rowNode.rowPinned && !rowNode.detail;
    if (checkboxNeeded) {
      const cbSelectionComponent = new CheckboxSelectionComponent();
      this.getContext().createBean(cbSelectionComponent);
      cbSelectionComponent.init({
        rowNode: this.params.node,
        column: this.params.column,
        overrides: {
          isVisible: this.params.checkbox,
          callbackParams: this.params,
          removeHidden: true
        }
      });
      this.eCheckbox.appendChild(cbSelectionComponent.getGui());
      this.addDestroyFunc(() => this.getContext().destroyBean(cbSelectionComponent));
    }
    this.comp.setCheckboxVisible(checkboxNeeded);
  }
  onKeyDown(event) {
    const isEnterKey = event.key === KeyCode.ENTER;
    if (!isEnterKey || this.params.suppressEnterExpand) {
      return;
    }
    const cellEditable = this.params.column && this.params.column.isCellEditable(this.params.node);
    if (cellEditable) {
      return;
    }
    this.onExpandOrContract(event);
  }
  onCellDblClicked(mouseEvent) {
    if (isStopPropagationForZingGrid(mouseEvent)) {
      return;
    }
    const targetIsExpandIcon = isElementInEventPath(this.eExpanded, mouseEvent) || isElementInEventPath(this.eContracted, mouseEvent);
    if (!targetIsExpandIcon) {
      this.onExpandOrContract(mouseEvent);
    }
  }
}
__decorate([Autowired('expressionService')], GroupCellRendererCtrl.prototype, "expressionService", void 0);
__decorate([Autowired('valueFormatterService')], GroupCellRendererCtrl.prototype, "valueFormatterService", void 0);
__decorate([Autowired('columnModel')], GroupCellRendererCtrl.prototype, "columnModel", void 0);
__decorate([Autowired('userComponentFactory')], GroupCellRendererCtrl.prototype, "userComponentFactory", void 0);
__decorate([Autowired("ctrlsService")], GroupCellRendererCtrl.prototype, "ctrlsService", void 0);