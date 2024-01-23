import { Events } from "../events";
import { EventService } from "../eventService";
import { debounce } from "../utils/function";
import { exists, missing, missingOrEmpty } from "../utils/generic";
import { getAllKeysInObjects } from "../utils/object";
export class RowNode {
  constructor(beans) {
    this.rowIndex = null;
    this.key = null;
    this.childrenMapped = {};
    this.displayed = false;
    this.rowTop = null;
    this.oldRowTop = null;
    this.selectable = true;
    this.__objectId = RowNode.OBJECT_ID_SEQUENCE++;
    this.__autoHeights = {};
    this.alreadyRendered = false;
    this.highlighted = null;
    this.hovered = false;
    this.selected = false;
    this.beans = beans;
  }
  setData(data) {
    this.setDataCommon(data, false);
  }
  updateData(data) {
    this.setDataCommon(data, true);
  }
  setDataCommon(data, update) {
    const oldData = this.data;
    this.data = data;
    this.beans.valueCache.onDataChanged();
    this.updateDataOnDetailNode();
    this.checkRowSelectable();
    this.resetQuickFilterAggregateText();
    const event = this.createDataChangedEvent(data, oldData, update);
    this.dispatchLocalEvent(event);
  }
  updateDataOnDetailNode() {
    if (this.detailNode) {
      this.detailNode.data = this.data;
    }
  }
  createDataChangedEvent(newData, oldData, update) {
    return {
      type: RowNode.EVENT_DATA_CHANGED,
      node: this,
      oldData: oldData,
      newData: newData,
      update: update
    };
  }
  createLocalRowEvent(type) {
    return {
      type: type,
      node: this
    };
  }
  getRowIndexString() {
    if (this.rowPinned === 'top') {
      return 't-' + this.rowIndex;
    }
    if (this.rowPinned === 'bottom') {
      return 'b-' + this.rowIndex;
    }
    return this.rowIndex.toString();
  }
  createDaemonNode() {
    const oldNode = new RowNode(this.beans);
    oldNode.id = this.id;
    oldNode.data = this.data;
    oldNode.__daemon = true;
    oldNode.selected = this.selected;
    oldNode.level = this.level;
    return oldNode;
  }
  setDataAndId(data, id) {
    const oldNode = exists(this.id) ? this.createDaemonNode() : null;
    const oldData = this.data;
    this.data = data;
    this.updateDataOnDetailNode();
    this.setId(id);
    this.checkRowSelectable();
    this.beans.selectionService.syncInRowNode(this, oldNode);
    const event = this.createDataChangedEvent(data, oldData, false);
    this.dispatchLocalEvent(event);
  }
  checkRowSelectable() {
    const isRowSelectableFunc = this.beans.gridOptionsService.get('isRowSelectable');
    this.setRowSelectable(isRowSelectableFunc ? isRowSelectableFunc(this) : true);
  }
  setRowSelectable(newVal, suppressSelectionUpdate) {
    if (this.selectable !== newVal) {
      this.selectable = newVal;
      if (this.eventService) {
        this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_SELECTABLE_CHANGED));
      }
      if (suppressSelectionUpdate) {
        return;
      }
      const isGroupSelectsChildren = this.beans.gridOptionsService.get('groupSelectsChildren');
      if (isGroupSelectsChildren) {
        const selected = this.calculateSelectedFromChildren();
        this.setSelectedParams({
          newValue: selected !== null && selected !== void 0 ? selected : false,
          source: 'selectableChanged'
        });
        return;
      }
      if (this.isSelected() && !this.selectable) {
        this.setSelectedParams({
          newValue: false,
          source: 'selectableChanged'
        });
      }
    }
  }
  setId(id) {
    const getRowIdFunc = this.beans.gridOptionsService.getCallback('getRowId');
    if (getRowIdFunc) {
      if (this.data) {
        const parentKeys = this.getGroupKeys(true);
        this.id = getRowIdFunc({
          data: this.data,
          parentKeys: parentKeys.length > 0 ? parentKeys : undefined,
          level: this.level
        });
        if (this.id !== null && typeof this.id === 'string' && this.id.startsWith(RowNode.ID_PREFIX_ROW_GROUP)) {
          console.error(`ZING Grid: Row IDs cannot start with ${RowNode.ID_PREFIX_ROW_GROUP}, this is a reserved prefix for ZING Grid's row grouping feature.`);
        }
        if (this.id !== null && typeof this.id !== 'string') {
          this.id = '' + this.id;
        }
      } else {
        this.id = undefined;
      }
    } else {
      this.id = id;
    }
  }
  getGroupKeys(excludeSelf = false) {
    const keys = [];
    let pointer = this;
    if (excludeSelf) {
      pointer = pointer.parent;
    }
    while (pointer && pointer.level >= 0) {
      keys.push(pointer.key);
      pointer = pointer.parent;
    }
    keys.reverse();
    return keys;
  }
  isPixelInRange(pixel) {
    if (!exists(this.rowTop) || !exists(this.rowHeight)) {
      return false;
    }
    return pixel >= this.rowTop && pixel < this.rowTop + this.rowHeight;
  }
  setFirstChild(firstChild) {
    if (this.firstChild === firstChild) {
      return;
    }
    this.firstChild = firstChild;
    if (this.eventService) {
      this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_FIRST_CHILD_CHANGED));
    }
  }
  setLastChild(lastChild) {
    if (this.lastChild === lastChild) {
      return;
    }
    this.lastChild = lastChild;
    if (this.eventService) {
      this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_LAST_CHILD_CHANGED));
    }
  }
  setChildIndex(childIndex) {
    if (this.childIndex === childIndex) {
      return;
    }
    this.childIndex = childIndex;
    if (this.eventService) {
      this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_CHILD_INDEX_CHANGED));
    }
  }
  setRowTop(rowTop) {
    this.oldRowTop = this.rowTop;
    if (this.rowTop === rowTop) {
      return;
    }
    this.rowTop = rowTop;
    if (this.eventService) {
      this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_TOP_CHANGED));
    }
    this.setDisplayed(rowTop !== null);
  }
  clearRowTopAndRowIndex() {
    this.oldRowTop = null;
    this.setRowTop(null);
    this.setRowIndex(null);
  }
  setDisplayed(displayed) {
    if (this.displayed === displayed) {
      return;
    }
    this.displayed = displayed;
    if (this.eventService) {
      this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_DISPLAYED_CHANGED));
    }
  }
  setDragging(dragging) {
    if (this.dragging === dragging) {
      return;
    }
    this.dragging = dragging;
    if (this.eventService) {
      this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_DRAGGING_CHANGED));
    }
  }
  setHighlighted(highlighted) {
    if (highlighted === this.highlighted) {
      return;
    }
    this.highlighted = highlighted;
    if (this.eventService) {
      this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_HIGHLIGHT_CHANGED));
    }
  }
  setHovered(hovered) {
    if (this.hovered === hovered) {
      return;
    }
    this.hovered = hovered;
  }
  isHovered() {
    return this.hovered;
  }
  setAllChildrenCount(allChildrenCount) {
    if (this.allChildrenCount === allChildrenCount) {
      return;
    }
    this.allChildrenCount = allChildrenCount;
    if (this.eventService) {
      this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_ALL_CHILDREN_COUNT_CHANGED));
    }
  }
  setMaster(master) {
    if (this.master === master) {
      return;
    }
    if (this.master && !master) {
      this.expanded = false;
    }
    this.master = master;
    if (this.eventService) {
      this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_MASTER_CHANGED));
    }
  }
  setGroup(group) {
    if (this.group === group) {
      return;
    }
    if (this.group && !group) {
      this.expanded = false;
    }
    this.group = group;
    this.updateHasChildren();
    if (this.eventService) {
      this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_GROUP_CHANGED));
    }
  }
  setRowHeight(rowHeight, estimated = false) {
    this.rowHeight = rowHeight;
    this.rowHeightEstimated = estimated;
    if (this.eventService) {
      this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_HEIGHT_CHANGED));
    }
  }
  setRowAutoHeight(cellHeight, column) {
    if (!this.__autoHeights) {
      this.__autoHeights = {};
    }
    this.__autoHeights[column.getId()] = cellHeight;
    if (cellHeight != null) {
      if (this.checkAutoHeightsDebounced == null) {
        this.checkAutoHeightsDebounced = debounce(this.checkAutoHeights.bind(this), 1);
      }
      this.checkAutoHeightsDebounced();
    }
  }
  checkAutoHeights() {
    let notAllPresent = false;
    let nonePresent = true;
    let newRowHeight = 0;
    const autoHeights = this.__autoHeights;
    if (autoHeights == null) {
      return;
    }
    const displayedAutoHeightCols = this.beans.columnModel.getAllDisplayedAutoHeightCols();
    displayedAutoHeightCols.forEach(col => {
      let cellHeight = autoHeights[col.getId()];
      if (cellHeight == null) {
        if (this.beans.columnModel.isColSpanActive()) {
          let activeColsForRow = [];
          switch (col.getPinned()) {
            case 'left':
              activeColsForRow = this.beans.columnModel.getDisplayedLeftColumnsForRow(this);
              break;
            case 'right':
              activeColsForRow = this.beans.columnModel.getDisplayedRightColumnsForRow(this);
              break;
            case null:
              activeColsForRow = this.beans.columnModel.getViewportCenterColumnsForRow(this);
              break;
          }
          if (activeColsForRow.includes(col)) {
            notAllPresent = true;
            return;
          }
          cellHeight = -1;
        } else {
          notAllPresent = true;
          return;
        }
      } else {
        nonePresent = false;
      }
      if (cellHeight > newRowHeight) {
        newRowHeight = cellHeight;
      }
    });
    if (notAllPresent) {
      return;
    }
    if (nonePresent || newRowHeight < 10) {
      newRowHeight = this.beans.gridOptionsService.getRowHeightForNode(this).height;
    }
    if (newRowHeight == this.rowHeight) {
      return;
    }
    this.setRowHeight(newRowHeight);
    const rowModel = this.beans.rowModel;
    if (rowModel.onRowHeightChangedDebounced) {
      rowModel.onRowHeightChangedDebounced();
    }
  }
  setRowIndex(rowIndex) {
    if (this.rowIndex === rowIndex) {
      return;
    }
    this.rowIndex = rowIndex;
    if (this.eventService) {
      this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_ROW_INDEX_CHANGED));
    }
  }
  setUiLevel(uiLevel) {
    if (this.uiLevel === uiLevel) {
      return;
    }
    this.uiLevel = uiLevel;
    if (this.eventService) {
      this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_UI_LEVEL_CHANGED));
    }
  }
  setExpanded(expanded, e) {
    if (this.expanded === expanded) {
      return;
    }
    this.expanded = expanded;
    if (this.eventService) {
      this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_EXPANDED_CHANGED));
    }
    const event = Object.assign({}, this.createGlobalRowEvent(Events.EVENT_ROW_GROUP_OPENED), {
      expanded,
      event: e || null
    });
    this.beans.rowNodeEventThrottle.dispatchExpanded(event);
    if (this.sibling) {
      this.beans.rowRenderer.refreshCells({
        rowNodes: [this]
      });
    }
  }
  createGlobalRowEvent(type) {
    return {
      type: type,
      node: this,
      data: this.data,
      rowIndex: this.rowIndex,
      rowPinned: this.rowPinned,
      context: this.beans.gridOptionsService.context,
      api: this.beans.gridOptionsService.api,
      columnApi: this.beans.gridOptionsService.columnApi
    };
  }
  dispatchLocalEvent(event) {
    if (this.eventService) {
      this.eventService.dispatchEvent(event);
    }
  }
  setDataValue(colKey, newValue, eventSource) {
    const getColumnFromKey = () => {
      var _a;
      if (typeof colKey !== 'string') {
        return colKey;
      }
      return (_a = this.beans.columnModel.getGridColumn(colKey)) !== null && _a !== void 0 ? _a : this.beans.columnModel.getPrimaryColumn(colKey);
    };
    const column = getColumnFromKey();
    const oldValue = this.getValueFromValueService(column);
    if (this.beans.gridOptionsService.get('readOnlyEdit')) {
      this.dispatchEventForSaveValueReadOnly(column, oldValue, newValue, eventSource);
      return false;
    }
    const valueChanged = this.beans.valueService.setValue(this, column, newValue, eventSource);
    this.dispatchCellChangedEvent(column, newValue, oldValue);
    this.checkRowSelectable();
    return valueChanged;
  }
  getValueFromValueService(column) {
    const lockedClosedGroup = this.leafGroup && this.beans.columnModel.isPivotMode();
    const isOpenGroup = this.group && this.expanded && !this.footer && !lockedClosedGroup;
    const getGroupIncludeFooter = this.beans.gridOptionsService.getGroupIncludeFooter();
    const groupFootersEnabled = getGroupIncludeFooter({
      node: this
    });
    const groupAlwaysShowAggData = this.beans.gridOptionsService.get('groupSuppressBlankHeader');
    const ignoreAggData = isOpenGroup && groupFootersEnabled && !groupAlwaysShowAggData;
    const value = this.beans.valueService.getValue(column, this, false, ignoreAggData);
    return value;
  }
  dispatchEventForSaveValueReadOnly(column, oldValue, newValue, eventSource) {
    const event = {
      type: Events.EVENT_CELL_EDIT_REQUEST,
      event: null,
      rowIndex: this.rowIndex,
      rowPinned: this.rowPinned,
      column: column,
      colDef: column.getColDef(),
      context: this.beans.gridOptionsService.context,
      api: this.beans.gridOptionsService.api,
      columnApi: this.beans.gridOptionsService.columnApi,
      data: this.data,
      node: this,
      oldValue,
      newValue,
      value: newValue,
      source: eventSource
    };
    this.beans.eventService.dispatchEvent(event);
  }
  setGroupValue(colKey, newValue) {
    const column = this.beans.columnModel.getGridColumn(colKey);
    if (missing(this.groupData)) {
      this.groupData = {};
    }
    const columnId = column.getColId();
    const oldValue = this.groupData[columnId];
    if (oldValue === newValue) {
      return;
    }
    this.groupData[columnId] = newValue;
    this.dispatchCellChangedEvent(column, newValue, oldValue);
  }
  setAggData(newAggData) {
    const colIds = getAllKeysInObjects([this.aggData, newAggData]);
    const oldAggData = this.aggData;
    this.aggData = newAggData;
    if (this.eventService) {
      colIds.forEach(colId => {
        const value = this.aggData ? this.aggData[colId] : undefined;
        const oldValue = oldAggData ? oldAggData[colId] : undefined;
        if (value === oldValue) {
          return;
        }
        const column = this.beans.columnModel.lookupGridColumn(colId);
        if (!column) {
          return;
        }
        this.dispatchCellChangedEvent(column, value, oldValue);
      });
    }
  }
  updateHasChildren() {
    let newValue = this.group && !this.footer || this.childrenAfterGroup && this.childrenAfterGroup.length > 0;
    const isSsrm = this.beans.gridOptionsService.isRowModelType('serverSide');
    if (isSsrm) {
      const isTreeData = this.beans.gridOptionsService.get('treeData');
      const isGroupFunc = this.beans.gridOptionsService.get('isServerSideGroup');
      newValue = !this.stub && !this.footer && (isTreeData ? !!isGroupFunc && isGroupFunc(this.data) : !!this.group);
    }
    if (newValue !== this.__hasChildren) {
      this.__hasChildren = !!newValue;
      if (this.eventService) {
        this.eventService.dispatchEvent(this.createLocalRowEvent(RowNode.EVENT_HAS_CHILDREN_CHANGED));
      }
    }
  }
  hasChildren() {
    if (this.__hasChildren == null) {
      this.updateHasChildren();
    }
    return this.__hasChildren;
  }
  isEmptyRowGroupNode() {
    return this.group && missingOrEmpty(this.childrenAfterGroup);
  }
  dispatchCellChangedEvent(column, newValue, oldValue) {
    const cellChangedEvent = {
      type: RowNode.EVENT_CELL_CHANGED,
      node: this,
      column: column,
      newValue: newValue,
      oldValue: oldValue
    };
    this.dispatchLocalEvent(cellChangedEvent);
  }
  resetQuickFilterAggregateText() {
    this.quickFilterAggregateText = null;
  }
  isExpandable() {
    if (this.footer) {
      return false;
    }
    if (this.beans.columnModel.isPivotMode()) {
      return this.hasChildren() && !this.leafGroup;
    }
    return this.hasChildren() || !!this.master;
  }
  isSelected() {
    if (this.footer) {
      return this.sibling.isSelected();
    }
    return this.selected;
  }
  depthFirstSearch(callback) {
    if (this.childrenAfterGroup) {
      this.childrenAfterGroup.forEach(child => child.depthFirstSearch(callback));
    }
    callback(this);
  }
  calculateSelectedFromChildren() {
    var _a;
    let atLeastOneSelected = false;
    let atLeastOneDeSelected = false;
    let atLeastOneMixed = false;
    if (!((_a = this.childrenAfterGroup) === null || _a === void 0 ? void 0 : _a.length)) {
      return this.selectable ? this.selected : null;
    }
    for (let i = 0; i < this.childrenAfterGroup.length; i++) {
      const child = this.childrenAfterGroup[i];
      let childState = child.isSelected();
      if (!child.selectable) {
        const selectable = child.calculateSelectedFromChildren();
        if (selectable === null) {
          continue;
        }
        childState = selectable;
      }
      switch (childState) {
        case true:
          atLeastOneSelected = true;
          break;
        case false:
          atLeastOneDeSelected = true;
          break;
        default:
          atLeastOneMixed = true;
          break;
      }
    }
    if (atLeastOneMixed || atLeastOneSelected && atLeastOneDeSelected) {
      return undefined;
    }
    if (atLeastOneSelected) {
      return true;
    }
    if (atLeastOneDeSelected) {
      return false;
    }
    if (!this.selectable) {
      return null;
    }
    return this.selected;
  }
  setSelectedInitialValue(selected) {
    this.selected = selected;
  }
  selectThisNode(newValue, e, source = 'api') {
    const selectionNotAllowed = !this.selectable && newValue;
    const selectionNotChanged = this.selected === newValue;
    if (selectionNotAllowed || selectionNotChanged) {
      return false;
    }
    this.selected = newValue;
    if (this.eventService) {
      this.dispatchLocalEvent(this.createLocalRowEvent(RowNode.EVENT_ROW_SELECTED));
      const sibling = this.sibling;
      if (sibling && sibling.footer) {
        sibling.dispatchLocalEvent(sibling.createLocalRowEvent(RowNode.EVENT_ROW_SELECTED));
      }
    }
    const event = Object.assign(Object.assign({}, this.createGlobalRowEvent(Events.EVENT_ROW_SELECTED)), {
      event: e || null,
      source
    });
    this.beans.eventService.dispatchEvent(event);
    return true;
  }
  setSelected(newValue, clearSelection = false, source = 'api') {
    if (typeof source === 'boolean') {
      console.warn('ZING Grid: since version v30, rowNode.setSelected() property `suppressFinishActions` has been removed, please use `gridApi.setNodesSelected()` for bulk actions, and the event `source` property for ignoring events instead.');
      return;
    }
    this.setSelectedParams({
      newValue,
      clearSelection,
      rangeSelect: false,
      source
    });
  }
  setSelectedParams(params) {
    if (this.rowPinned) {
      console.warn('ZING Grid: cannot select pinned rows');
      return 0;
    }
    if (this.id === undefined) {
      console.warn('ZING Grid: cannot select node until id for node is known');
      return 0;
    }
    return this.beans.selectionService.setNodesSelected(Object.assign(Object.assign({}, params), {
      nodes: [this.footer ? this.sibling : this]
    }));
  }
  isRowPinned() {
    return this.rowPinned === 'top' || this.rowPinned === 'bottom';
  }
  isParentOfNode(potentialParent) {
    let parentNode = this.parent;
    while (parentNode) {
      if (parentNode === potentialParent) {
        return true;
      }
      parentNode = parentNode.parent;
    }
    return false;
  }
  addEventListener(eventType, listener) {
    if (!this.eventService) {
      this.eventService = new EventService();
    }
    this.eventService.addEventListener(eventType, listener);
  }
  removeEventListener(eventType, listener) {
    if (!this.eventService) {
      return;
    }
    this.eventService.removeEventListener(eventType, listener);
    if (this.eventService.noRegisteredListenersExist()) {
      this.eventService = null;
    }
  }
  onMouseEnter() {
    this.dispatchLocalEvent(this.createLocalRowEvent(RowNode.EVENT_MOUSE_ENTER));
  }
  onMouseLeave() {
    this.dispatchLocalEvent(this.createLocalRowEvent(RowNode.EVENT_MOUSE_LEAVE));
  }
  getFirstChildOfFirstChild(rowGroupColumn) {
    let currentRowNode = this;
    let isCandidate = true;
    let foundFirstChildPath = false;
    let nodeToSwapIn = null;
    while (isCandidate && !foundFirstChildPath) {
      const parentRowNode = currentRowNode.parent;
      const firstChild = exists(parentRowNode) && currentRowNode.firstChild;
      if (firstChild) {
        if (parentRowNode.rowGroupColumn === rowGroupColumn) {
          foundFirstChildPath = true;
          nodeToSwapIn = parentRowNode;
        }
      } else {
        isCandidate = false;
      }
      currentRowNode = parentRowNode;
    }
    return foundFirstChildPath ? nodeToSwapIn : null;
  }
  isFullWidthCell() {
    if (this.detail) {
      return true;
    }
    const isFullWidthCellFunc = this.beans.gridOptionsService.getCallback('isFullWidthRow');
    return isFullWidthCellFunc ? isFullWidthCellFunc({
      rowNode: this
    }) : false;
  }
  getRoute() {
    if (this.key == null) {
      return;
    }
    const res = [];
    let pointer = this;
    while (pointer.key != null) {
      res.push(pointer.key);
      pointer = pointer.parent;
    }
    return res.reverse();
  }
  createFooter() {
    if (this.sibling) {
      return;
    }
    const ignoredProperties = new Set(['eventService', '__objectId', 'sticky']);
    const footerNode = new RowNode(this.beans);
    Object.keys(this).forEach(key => {
      if (ignoredProperties.has(key)) {
        return;
      }
      footerNode[key] = this[key];
    });
    footerNode.footer = true;
    footerNode.setRowTop(null);
    footerNode.setRowIndex(null);
    footerNode.oldRowTop = null;
    footerNode.id = 'rowGroupFooter_' + this.id;
    footerNode.sibling = this;
    this.sibling = footerNode;
  }
  destroyFooter() {
    if (!this.sibling) {
      return;
    }
    this.sibling.setRowTop(null);
    this.sibling.setRowIndex(null);
    this.sibling = undefined;
  }
}
RowNode.ID_PREFIX_ROW_GROUP = 'row-group-';
RowNode.ID_PREFIX_TOP_PINNED = 't-';
RowNode.ID_PREFIX_BOTTOM_PINNED = 'b-';
RowNode.OBJECT_ID_SEQUENCE = 0;
RowNode.EVENT_ROW_SELECTED = 'rowSelected';
RowNode.EVENT_DATA_CHANGED = 'dataChanged';
RowNode.EVENT_CELL_CHANGED = 'cellChanged';
RowNode.EVENT_ALL_CHILDREN_COUNT_CHANGED = 'allChildrenCountChanged';
RowNode.EVENT_MASTER_CHANGED = 'masterChanged';
RowNode.EVENT_GROUP_CHANGED = 'groupChanged';
RowNode.EVENT_MOUSE_ENTER = 'mouseEnter';
RowNode.EVENT_MOUSE_LEAVE = 'mouseLeave';
RowNode.EVENT_HEIGHT_CHANGED = 'heightChanged';
RowNode.EVENT_TOP_CHANGED = 'topChanged';
RowNode.EVENT_DISPLAYED_CHANGED = 'displayedChanged';
RowNode.EVENT_FIRST_CHILD_CHANGED = 'firstChildChanged';
RowNode.EVENT_LAST_CHILD_CHANGED = 'lastChildChanged';
RowNode.EVENT_CHILD_INDEX_CHANGED = 'childIndexChanged';
RowNode.EVENT_ROW_INDEX_CHANGED = 'rowIndexChanged';
RowNode.EVENT_EXPANDED_CHANGED = 'expandedChanged';
RowNode.EVENT_HAS_CHILDREN_CHANGED = 'hasChildrenChanged';
RowNode.EVENT_SELECTABLE_CHANGED = 'selectableChanged';
RowNode.EVENT_UI_LEVEL_CHANGED = 'uiLevelChanged';
RowNode.EVENT_HIGHLIGHT_CHANGED = 'rowHighlightChanged';
RowNode.EVENT_DRAGGING_CHANGED = 'draggingChanged';