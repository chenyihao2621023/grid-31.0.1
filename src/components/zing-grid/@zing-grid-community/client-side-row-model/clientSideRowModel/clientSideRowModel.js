var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, Bean, BeanStub, ChangedPath, Events, Optional, PostConstruct, ClientSideRowModelSteps, RowNode, RowHighlightPosition } from "@/components/zing-grid/@zing-grid-community/core/main.js";
import { ClientSideNodeManager } from "./clientSideNodeManager";
var RecursionType;
(function (RecursionType) {
  RecursionType[RecursionType["Normal"] = 0] = "Normal";
  RecursionType[RecursionType["AfterFilter"] = 1] = "AfterFilter";
  RecursionType[RecursionType["AfterFilterAndSort"] = 2] = "AfterFilterAndSort";
  RecursionType[RecursionType["PivotNodes"] = 3] = "PivotNodes";
})(RecursionType || (RecursionType = {}));
let ClientSideRowModel = class ClientSideRowModel extends BeanStub {
  constructor() {
    super(...arguments);
    this.onRowHeightChanged_debounced = _.debounce(this.onRowHeightChanged.bind(this), 100);
    this.rowsToDisplay = [];
    this.hasStarted = false;
    this.shouldSkipSettingDataOnStart = false;
  }
  init() {
    const refreshEverythingFunc = this.refreshModel.bind(this, {
      step: ClientSideRowModelSteps.EVERYTHING
    });
    const animate = !this.gridOptionsService.get('suppressAnimationFrame');
    const refreshEverythingAfterColsChangedFunc = this.refreshModel.bind(this, {
      step: ClientSideRowModelSteps.EVERYTHING,
      afterColumnsChanged: true,
      keepRenderedRows: true,
      animate
    });
    this.addManagedListener(this.eventService, Events.EVENT_NEW_COLUMNS_LOADED, refreshEverythingAfterColsChangedFunc);
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_ROW_GROUP_CHANGED, refreshEverythingFunc);
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_VALUE_CHANGED, this.onValueChanged.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PIVOT_CHANGED, this.refreshModel.bind(this, {
      step: ClientSideRowModelSteps.PIVOT
    }));
    this.addManagedListener(this.eventService, Events.EVENT_FILTER_CHANGED, this.onFilterChanged.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_SORT_CHANGED, this.onSortChanged.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PIVOT_MODE_CHANGED, refreshEverythingFunc);
    this.addManagedListener(this.eventService, Events.EVENT_GRID_STYLES_CHANGED, this.onGridStylesChanges.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_GRID_READY, () => this.onGridReady());
    this.addPropertyListeners();
    this.rootNode = new RowNode(this.beans);
    this.nodeManager = new ClientSideNodeManager(this.rootNode, this.gridOptionsService, this.eventService, this.columnModel, this.selectionService, this.beans);
  }
  addPropertyListeners() {
    const resetProps = new Set(['treeData', 'masterDetail']);
    const groupStageRefreshProps = new Set(['suppressParentsInRowNodes', 'groupDefaultExpanded', 'groupAllowUnbalanced', 'initialGroupOrderComparator', 'groupHideOpenParents', 'groupDisplayType']);
    const filterStageRefreshProps = new Set(['excludeChildrenWhenTreeDataFiltering']);
    const pivotStageRefreshProps = new Set(['removePivotHeaderRowWhenSingleValueColumn', 'pivotRowTotals', 'pivotColumnGroupTotals', 'suppressExpandablePivotGroups']);
    const aggregateStageRefreshProps = new Set(['getGroupRowAgg', 'alwaysAggregateAtRootLevel', 'groupIncludeTotalFooter', 'suppressAggFilteredOnly']);
    const sortStageRefreshProps = new Set(['postSortRows', 'groupDisplayType', 'accentedSort']);
    const filterAggStageRefreshProps = new Set([]);
    const flattenStageRefreshProps = new Set(['groupRemoveSingleChildren', 'groupRemoveLowestSingleChildren', 'groupIncludeFooter']);
    const allProps = [...resetProps, ...groupStageRefreshProps, ...filterStageRefreshProps, ...pivotStageRefreshProps, ...pivotStageRefreshProps, ...aggregateStageRefreshProps, ...sortStageRefreshProps, ...filterAggStageRefreshProps, ...flattenStageRefreshProps];
    this.addManagedPropertyListeners(allProps, params => {
      var _a;
      const properties = (_a = params.changeSet) === null || _a === void 0 ? void 0 : _a.properties;
      if (!properties) {
        return;
      }
      ;
      const arePropertiesImpacted = propSet => properties.some(prop => propSet.has(prop));
      if (arePropertiesImpacted(resetProps)) {
        this.setRowData(this.rootNode.allLeafChildren.map(child => child.data));
        return;
      }
      if (arePropertiesImpacted(groupStageRefreshProps)) {
        this.refreshModel({
          step: ClientSideRowModelSteps.EVERYTHING
        });
        return;
      }
      if (arePropertiesImpacted(filterStageRefreshProps)) {
        this.refreshModel({
          step: ClientSideRowModelSteps.FILTER
        });
        return;
      }
      if (arePropertiesImpacted(pivotStageRefreshProps)) {
        this.refreshModel({
          step: ClientSideRowModelSteps.PIVOT
        });
        return;
      }
      if (arePropertiesImpacted(aggregateStageRefreshProps)) {
        this.refreshModel({
          step: ClientSideRowModelSteps.AGGREGATE
        });
        return;
      }
      if (arePropertiesImpacted(sortStageRefreshProps)) {
        this.refreshModel({
          step: ClientSideRowModelSteps.SORT
        });
        return;
      }
      if (arePropertiesImpacted(filterAggStageRefreshProps)) {
        this.refreshModel({
          step: ClientSideRowModelSteps.FILTER_AGGREGATES
        });
        return;
      }
      if (arePropertiesImpacted(flattenStageRefreshProps)) {
        this.refreshModel({
          step: ClientSideRowModelSteps.MAP
        });
      }
    });
    this.addManagedPropertyListener('rowHeight', () => this.resetRowHeights());
  }
  start() {
    this.hasStarted = true;
    if (this.shouldSkipSettingDataOnStart) {
      this.dispatchUpdateEventsAndRefresh();
    } else {
      this.setInitialData();
    }
  }
  setInitialData() {
    const rowData = this.gridOptionsService.get('rowData');
    if (rowData) {
      this.shouldSkipSettingDataOnStart = true;
      this.setRowData(rowData);
    }
  }
  ensureRowHeightsValid(startPixel, endPixel, startLimitIndex, endLimitIndex) {
    let atLeastOneChange;
    let res = false;
    do {
      atLeastOneChange = false;
      const rowAtStartPixel = this.getRowIndexAtPixel(startPixel);
      const rowAtEndPixel = this.getRowIndexAtPixel(endPixel);
      const firstRow = Math.max(rowAtStartPixel, startLimitIndex);
      const lastRow = Math.min(rowAtEndPixel, endLimitIndex);
      for (let rowIndex = firstRow; rowIndex <= lastRow; rowIndex++) {
        const rowNode = this.getRow(rowIndex);
        if (rowNode.rowHeightEstimated) {
          const rowHeight = this.gridOptionsService.getRowHeightForNode(rowNode);
          rowNode.setRowHeight(rowHeight.height);
          atLeastOneChange = true;
          res = true;
        }
      }
      if (atLeastOneChange) {
        this.setRowTopAndRowIndex();
      }
    } while (atLeastOneChange);
    return res;
  }
  setRowTopAndRowIndex() {
    const defaultRowHeight = this.environment.getDefaultRowHeight();
    let nextRowTop = 0;
    const displayedRowsMapped = new Set();
    const allowEstimate = this.gridOptionsService.isDomLayout('normal');
    for (let i = 0; i < this.rowsToDisplay.length; i++) {
      const rowNode = this.rowsToDisplay[i];
      if (rowNode.id != null) {
        displayedRowsMapped.add(rowNode.id);
      }
      if (rowNode.rowHeight == null) {
        const rowHeight = this.gridOptionsService.getRowHeightForNode(rowNode, allowEstimate, defaultRowHeight);
        rowNode.setRowHeight(rowHeight.height, rowHeight.estimated);
      }
      rowNode.setRowTop(nextRowTop);
      rowNode.setRowIndex(i);
      nextRowTop += rowNode.rowHeight;
    }
    return displayedRowsMapped;
  }
  clearRowTopAndRowIndex(changedPath, displayedRowsMapped) {
    const changedPathActive = changedPath.isActive();
    const clearIfNotDisplayed = rowNode => {
      if (rowNode && rowNode.id != null && !displayedRowsMapped.has(rowNode.id)) {
        rowNode.clearRowTopAndRowIndex();
      }
    };
    const recurse = rowNode => {
      clearIfNotDisplayed(rowNode);
      clearIfNotDisplayed(rowNode.detailNode);
      clearIfNotDisplayed(rowNode.sibling);
      if (rowNode.hasChildren()) {
        if (rowNode.childrenAfterGroup) {
          const isRootNode = rowNode.level == -1;
          const skipChildren = changedPathActive && !isRootNode && !rowNode.expanded;
          if (!skipChildren) {
            rowNode.childrenAfterGroup.forEach(recurse);
          }
        }
      }
    };
    recurse(this.rootNode);
  }
  ensureRowsAtPixel(rowNodes, pixel, increment = 0) {
    const indexAtPixelNow = this.getRowIndexAtPixel(pixel);
    const rowNodeAtPixelNow = this.getRow(indexAtPixelNow);
    const animate = !this.gridOptionsService.get('suppressAnimationFrame');
    if (rowNodeAtPixelNow === rowNodes[0]) {
      return false;
    }
    rowNodes.forEach(rowNode => {
      _.removeFromArray(this.rootNode.allLeafChildren, rowNode);
    });
    rowNodes.forEach((rowNode, idx) => {
      _.insertIntoArray(this.rootNode.allLeafChildren, rowNode, Math.max(indexAtPixelNow + increment, 0) + idx);
    });
    this.refreshModel({
      step: ClientSideRowModelSteps.EVERYTHING,
      keepRenderedRows: true,
      keepEditingRows: true,
      animate
    });
    return true;
  }
  highlightRowAtPixel(rowNode, pixel) {
    const indexAtPixelNow = pixel != null ? this.getRowIndexAtPixel(pixel) : null;
    const rowNodeAtPixelNow = indexAtPixelNow != null ? this.getRow(indexAtPixelNow) : null;
    if (!rowNodeAtPixelNow || !rowNode || rowNodeAtPixelNow === rowNode || pixel == null) {
      if (this.lastHighlightedRow) {
        this.lastHighlightedRow.setHighlighted(null);
        this.lastHighlightedRow = null;
      }
      return;
    }
    const highlight = this.getHighlightPosition(pixel, rowNodeAtPixelNow);
    if (this.lastHighlightedRow && this.lastHighlightedRow !== rowNodeAtPixelNow) {
      this.lastHighlightedRow.setHighlighted(null);
      this.lastHighlightedRow = null;
    }
    rowNodeAtPixelNow.setHighlighted(highlight);
    this.lastHighlightedRow = rowNodeAtPixelNow;
  }
  getHighlightPosition(pixel, rowNode) {
    if (!rowNode) {
      const index = this.getRowIndexAtPixel(pixel);
      rowNode = this.getRow(index || 0);
      if (!rowNode) {
        return RowHighlightPosition.Below;
      }
    }
    const {
      rowTop,
      rowHeight
    } = rowNode;
    return pixel - rowTop < rowHeight / 2 ? RowHighlightPosition.Above : RowHighlightPosition.Below;
  }
  getLastHighlightedRowNode() {
    return this.lastHighlightedRow;
  }
  isLastRowIndexKnown() {
    return true;
  }
  getRowCount() {
    if (this.rowsToDisplay) {
      return this.rowsToDisplay.length;
    }
    return 0;
  }
  getTopLevelRowCount() {
    const showingRootNode = this.rowsToDisplay && this.rowsToDisplay[0] === this.rootNode;
    if (showingRootNode) {
      return 1;
    }
    const filteredChildren = this.rootNode.childrenAfterAggFilter;
    return filteredChildren ? filteredChildren.length : 0;
  }
  getTopLevelRowDisplayedIndex(topLevelIndex) {
    const showingRootNode = this.rowsToDisplay && this.rowsToDisplay[0] === this.rootNode;
    if (showingRootNode) {
      return topLevelIndex;
    }
    let rowNode = this.rootNode.childrenAfterSort[topLevelIndex];
    if (this.gridOptionsService.get('groupHideOpenParents')) {
      while (rowNode.expanded && rowNode.childrenAfterSort && rowNode.childrenAfterSort.length > 0) {
        rowNode = rowNode.childrenAfterSort[0];
      }
    }
    return rowNode.rowIndex;
  }
  getRowBounds(index) {
    if (_.missing(this.rowsToDisplay)) {
      return null;
    }
    const rowNode = this.rowsToDisplay[index];
    if (rowNode) {
      return {
        rowTop: rowNode.rowTop,
        rowHeight: rowNode.rowHeight
      };
    }
    return null;
  }
  onRowGroupOpened() {
    const animate = this.gridOptionsService.isAnimateRows();
    this.refreshModel({
      step: ClientSideRowModelSteps.MAP,
      keepRenderedRows: true,
      animate: animate
    });
  }
  onFilterChanged(event) {
    if (event.afterDataChange) {
      return;
    }
    const animate = this.gridOptionsService.isAnimateRows();
    const primaryOrQuickFilterChanged = event.columns.length === 0 || event.columns.some(col => col.isPrimary());
    const step = primaryOrQuickFilterChanged ? ClientSideRowModelSteps.FILTER : ClientSideRowModelSteps.FILTER_AGGREGATES;
    this.refreshModel({
      step: step,
      keepRenderedRows: true,
      animate: animate
    });
  }
  onSortChanged() {
    const animate = this.gridOptionsService.isAnimateRows();
    this.refreshModel({
      step: ClientSideRowModelSteps.SORT,
      keepRenderedRows: true,
      animate: animate,
      keepEditingRows: true
    });
  }
  getType() {
    return 'clientSide';
  }
  onValueChanged() {
    if (this.columnModel.isPivotActive()) {
      this.refreshModel({
        step: ClientSideRowModelSteps.PIVOT
      });
    } else {
      this.refreshModel({
        step: ClientSideRowModelSteps.AGGREGATE
      });
    }
  }
  createChangePath(rowNodeTransactions) {
    const noTransactions = _.missingOrEmpty(rowNodeTransactions);
    const changedPath = new ChangedPath(false, this.rootNode);
    if (noTransactions || this.gridOptionsService.get('treeData')) {
      changedPath.setInactive();
    }
    return changedPath;
  }
  isSuppressModelUpdateAfterUpdateTransaction(params) {
    if (!this.gridOptionsService.get('suppressModelUpdateAfterUpdateTransaction')) {
      return false;
    }
    if (params.rowNodeTransactions == null) {
      return false;
    }
    const transWithAddsOrDeletes = params.rowNodeTransactions.filter(tx => tx.add != null && tx.add.length > 0 || tx.remove != null && tx.remove.length > 0);
    const transactionsContainUpdatesOnly = transWithAddsOrDeletes == null || transWithAddsOrDeletes.length == 0;
    return transactionsContainUpdatesOnly;
  }
  buildRefreshModelParams(step) {
    let paramsStep = ClientSideRowModelSteps.EVERYTHING;
    const stepsMapped = {
      everything: ClientSideRowModelSteps.EVERYTHING,
      group: ClientSideRowModelSteps.EVERYTHING,
      filter: ClientSideRowModelSteps.FILTER,
      map: ClientSideRowModelSteps.MAP,
      aggregate: ClientSideRowModelSteps.AGGREGATE,
      sort: ClientSideRowModelSteps.SORT,
      pivot: ClientSideRowModelSteps.PIVOT
    };
    if (_.exists(step)) {
      paramsStep = stepsMapped[step];
    }
    if (_.missing(paramsStep)) {
      console.error(`ZING Grid: invalid step ${step}, available steps are ${Object.keys(stepsMapped).join(', ')}`);
      return undefined;
    }
    const animate = !this.gridOptionsService.get('suppressAnimationFrame');
    const modelParams = {
      step: paramsStep,
      keepRenderedRows: true,
      keepEditingRows: true,
      animate
    };
    return modelParams;
  }
  refreshModel(paramsOrStep) {
    if (!this.hasStarted) {
      return;
    }
    let params = typeof paramsOrStep === 'object' && "step" in paramsOrStep ? paramsOrStep : this.buildRefreshModelParams(paramsOrStep);
    if (!params) {
      return;
    }
    if (this.isSuppressModelUpdateAfterUpdateTransaction(params)) {
      return;
    }
    const changedPath = this.createChangePath(params.rowNodeTransactions);
    switch (params.step) {
      case ClientSideRowModelSteps.EVERYTHING:
        this.doRowGrouping(params.rowNodeTransactions, params.rowNodeOrder, changedPath, !!params.afterColumnsChanged);
      case ClientSideRowModelSteps.FILTER:
        this.doFilter(changedPath);
      case ClientSideRowModelSteps.PIVOT:
        this.doPivot(changedPath);
      case ClientSideRowModelSteps.AGGREGATE:
        this.doAggregate(changedPath);
      case ClientSideRowModelSteps.FILTER_AGGREGATES:
        this.doFilterAggregates(changedPath);
      case ClientSideRowModelSteps.SORT:
        this.doSort(params.rowNodeTransactions, changedPath);
      case ClientSideRowModelSteps.MAP:
        this.doRowsToDisplay();
    }
    const displayedNodesMapped = this.setRowTopAndRowIndex();
    this.clearRowTopAndRowIndex(changedPath, displayedNodesMapped);
    const event = {
      type: Events.EVENT_MODEL_UPDATED,
      animate: params.animate,
      keepRenderedRows: params.keepRenderedRows,
      newData: params.newData,
      newPage: false,
      keepUndoRedoStack: params.keepUndoRedoStack
    };
    this.eventService.dispatchEvent(event);
  }
  isEmpty() {
    const rowsMissing = _.missing(this.rootNode.allLeafChildren) || this.rootNode.allLeafChildren.length === 0;
    return _.missing(this.rootNode) || rowsMissing || !this.columnModel.isReady();
  }
  isRowsToRender() {
    return _.exists(this.rowsToDisplay) && this.rowsToDisplay.length > 0;
  }
  getNodesInRangeForSelection(firstInRange, lastInRange) {
    let started = !lastInRange;
    let finished = false;
    const result = [];
    const groupsSelectChildren = this.gridOptionsService.get('groupSelectsChildren');
    this.forEachNodeAfterFilterAndSort(rowNode => {
      if (finished) {
        return;
      }
      if (started) {
        if (rowNode === lastInRange || rowNode === firstInRange) {
          finished = true;
          if (rowNode.group && groupsSelectChildren) {
            result.push(...rowNode.allLeafChildren);
            return;
          }
        }
      }
      if (!started) {
        if (rowNode !== lastInRange && rowNode !== firstInRange) {
          return;
        }
        started = true;
      }
      const includeThisNode = !rowNode.group || !groupsSelectChildren;
      if (includeThisNode) {
        result.push(rowNode);
        return;
      }
    });
    return result;
  }
  setDatasource(datasource) {
    console.error('ZING Grid: should never call setDatasource on clientSideRowController');
  }
  getTopLevelNodes() {
    return this.rootNode ? this.rootNode.childrenAfterGroup : null;
  }
  getRootNode() {
    return this.rootNode;
  }
  getRow(index) {
    return this.rowsToDisplay[index];
  }
  isRowPresent(rowNode) {
    return this.rowsToDisplay.indexOf(rowNode) >= 0;
  }
  getRowIndexAtPixel(pixelToMatch) {
    if (this.isEmpty() || this.rowsToDisplay.length === 0) {
      return -1;
    }
    let bottomPointer = 0;
    let topPointer = this.rowsToDisplay.length - 1;
    if (pixelToMatch <= 0) {
      return 0;
    }
    const lastNode = _.last(this.rowsToDisplay);
    if (lastNode.rowTop <= pixelToMatch) {
      return this.rowsToDisplay.length - 1;
    }
    let oldBottomPointer = -1;
    let oldTopPointer = -1;
    while (true) {
      const midPointer = Math.floor((bottomPointer + topPointer) / 2);
      const currentRowNode = this.rowsToDisplay[midPointer];
      if (this.isRowInPixel(currentRowNode, pixelToMatch)) {
        return midPointer;
      }
      if (currentRowNode.rowTop < pixelToMatch) {
        bottomPointer = midPointer + 1;
      } else if (currentRowNode.rowTop > pixelToMatch) {
        topPointer = midPointer - 1;
      }
      const caughtInInfiniteLoop = oldBottomPointer === bottomPointer && oldTopPointer === topPointer;
      if (caughtInInfiniteLoop) {
        return midPointer;
      }
      oldBottomPointer = bottomPointer;
      oldTopPointer = topPointer;
    }
  }
  isRowInPixel(rowNode, pixelToMatch) {
    const topPixel = rowNode.rowTop;
    const bottomPixel = rowNode.rowTop + rowNode.rowHeight;
    const pixelInRow = topPixel <= pixelToMatch && bottomPixel > pixelToMatch;
    return pixelInRow;
  }
  forEachLeafNode(callback) {
    if (this.rootNode.allLeafChildren) {
      this.rootNode.allLeafChildren.forEach((rowNode, index) => callback(rowNode, index));
    }
  }
  forEachNode(callback, includeFooterNodes = false) {
    this.recursivelyWalkNodesAndCallback({
      nodes: [...(this.rootNode.childrenAfterGroup || [])],
      callback,
      recursionType: RecursionType.Normal,
      index: 0,
      includeFooterNodes
    });
  }
  forEachNodeAfterFilter(callback, includeFooterNodes = false) {
    this.recursivelyWalkNodesAndCallback({
      nodes: [...(this.rootNode.childrenAfterAggFilter || [])],
      callback,
      recursionType: RecursionType.AfterFilter,
      index: 0,
      includeFooterNodes
    });
  }
  forEachNodeAfterFilterAndSort(callback, includeFooterNodes = false) {
    this.recursivelyWalkNodesAndCallback({
      nodes: [...(this.rootNode.childrenAfterSort || [])],
      callback,
      recursionType: RecursionType.AfterFilterAndSort,
      index: 0,
      includeFooterNodes
    });
  }
  forEachPivotNode(callback, includeFooterNodes = false) {
    this.recursivelyWalkNodesAndCallback({
      nodes: [this.rootNode],
      callback,
      recursionType: RecursionType.PivotNodes,
      index: 0,
      includeFooterNodes
    });
  }
  recursivelyWalkNodesAndCallback(params) {
    var _a;
    const {
      nodes,
      callback,
      recursionType,
      includeFooterNodes
    } = params;
    let {
      index
    } = params;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      callback(node, index++);
      if (node.hasChildren() && !node.footer) {
        let nodeChildren = null;
        switch (recursionType) {
          case RecursionType.Normal:
            nodeChildren = node.childrenAfterGroup;
            break;
          case RecursionType.AfterFilter:
            nodeChildren = node.childrenAfterAggFilter;
            break;
          case RecursionType.AfterFilterAndSort:
            nodeChildren = node.childrenAfterSort;
            break;
          case RecursionType.PivotNodes:
            nodeChildren = !node.leafGroup ? node.childrenAfterSort : null;
            break;
        }
        if (nodeChildren) {
          index = this.recursivelyWalkNodesAndCallback({
            nodes: [...nodeChildren],
            callback,
            recursionType,
            index,
            includeFooterNodes
          });
        }
      }
    }
    const parentNode = (_a = nodes[0]) === null || _a === void 0 ? void 0 : _a.parent;
    if (!includeFooterNodes || !parentNode) return index;
    const isRootNode = parentNode === this.rootNode;
    if (isRootNode) {
      const totalFooters = this.gridOptionsService.get('groupIncludeTotalFooter');
      if (!totalFooters) return index;
    } else {
      const isGroupIncludeFooter = this.gridOptionsService.getGroupIncludeFooter();
      if (!isGroupIncludeFooter({
        node: parentNode
      })) return index;
    }
    parentNode.createFooter();
    callback(parentNode.sibling, index++);
    return index;
  }
  doAggregate(changedPath) {
    if (this.aggregationStage) {
      this.aggregationStage.execute({
        rowNode: this.rootNode,
        changedPath: changedPath
      });
    }
  }
  doFilterAggregates(changedPath) {
    if (this.filterAggregatesStage) {
      this.filterAggregatesStage.execute({
        rowNode: this.rootNode,
        changedPath: changedPath
      });
    } else {
      this.rootNode.childrenAfterAggFilter = this.rootNode.childrenAfterFilter;
    }
  }
  expandOrCollapseAll(expand) {
    const usingTreeData = this.gridOptionsService.get('treeData');
    const usingPivotMode = this.columnModel.isPivotActive();
    const recursiveExpandOrCollapse = rowNodes => {
      if (!rowNodes) {
        return;
      }
      rowNodes.forEach(rowNode => {
        const actionRow = () => {
          rowNode.expanded = expand;
          recursiveExpandOrCollapse(rowNode.childrenAfterGroup);
        };
        if (usingTreeData) {
          const hasChildren = _.exists(rowNode.childrenAfterGroup);
          if (hasChildren) {
            actionRow();
          }
          return;
        }
        if (usingPivotMode) {
          const notLeafGroup = !rowNode.leafGroup;
          if (notLeafGroup) {
            actionRow();
          }
          return;
        }
        const isRowGroup = rowNode.group;
        if (isRowGroup) {
          actionRow();
        }
      });
    };
    if (this.rootNode) {
      recursiveExpandOrCollapse(this.rootNode.childrenAfterGroup);
    }
    this.refreshModel({
      step: ClientSideRowModelSteps.MAP
    });
    const eventSource = expand ? 'expandAll' : 'collapseAll';
    const event = {
      type: Events.EVENT_EXPAND_COLLAPSE_ALL,
      source: eventSource
    };
    this.eventService.dispatchEvent(event);
  }
  doSort(rowNodeTransactions, changedPath) {
    this.sortStage.execute({
      rowNode: this.rootNode,
      rowNodeTransactions: rowNodeTransactions,
      changedPath: changedPath
    });
  }
  doRowGrouping(rowNodeTransactions, rowNodeOrder, changedPath, afterColumnsChanged) {
    if (this.groupStage) {
      if (rowNodeTransactions) {
        this.groupStage.execute({
          rowNode: this.rootNode,
          rowNodeTransactions: rowNodeTransactions,
          rowNodeOrder: rowNodeOrder,
          changedPath: changedPath
        });
      } else {
        this.groupStage.execute({
          rowNode: this.rootNode,
          changedPath: changedPath,
          afterColumnsChanged: afterColumnsChanged
        });
      }
      if (this.gridOptionsService.get('groupSelectsChildren')) {
        const selectionChanged = this.selectionService.updateGroupsFromChildrenSelections('rowGroupChanged', changedPath);
        if (selectionChanged) {
          const event = {
            type: Events.EVENT_SELECTION_CHANGED,
            source: 'rowGroupChanged'
          };
          this.eventService.dispatchEvent(event);
        }
      }
    } else {
      this.rootNode.childrenAfterGroup = this.rootNode.allLeafChildren;
      if (this.rootNode.sibling) {
        this.rootNode.sibling.childrenAfterGroup = this.rootNode.childrenAfterGroup;
      }
      this.rootNode.updateHasChildren();
    }
    this.eventService.dispatchEventOnce({
      type: Events.EVENT_ROW_COUNT_READY
    });
  }
  doFilter(changedPath) {
    this.filterStage.execute({
      rowNode: this.rootNode,
      changedPath: changedPath
    });
  }
  doPivot(changedPath) {
    if (this.pivotStage) {
      this.pivotStage.execute({
        rowNode: this.rootNode,
        changedPath: changedPath
      });
    }
  }
  getCopyOfNodesMap() {
    return this.nodeManager.getCopyOfNodesMap();
  }
  getRowNode(id) {
    const idIsGroup = typeof id == 'string' && id.indexOf(RowNode.ID_PREFIX_ROW_GROUP) == 0;
    if (idIsGroup) {
      let res = undefined;
      this.forEachNode(node => {
        if (node.id === id) {
          res = node;
        }
      });
      return res;
    }
    return this.nodeManager.getRowNode(id);
  }
  setRowData(rowData) {
    this.selectionService.reset('rowDataChanged');
    this.nodeManager.setRowData(rowData);
    if (this.hasStarted) {
      this.dispatchUpdateEventsAndRefresh();
    }
  }
  dispatchUpdateEventsAndRefresh() {
    const rowDataUpdatedEvent = {
      type: Events.EVENT_ROW_DATA_UPDATED
    };
    this.eventService.dispatchEvent(rowDataUpdatedEvent);
    this.refreshModel({
      step: ClientSideRowModelSteps.EVERYTHING,
      newData: true
    });
  }
  batchUpdateRowData(rowDataTransaction, callback) {
    if (this.applyAsyncTransactionsTimeout == null) {
      this.rowDataTransactionBatch = [];
      const waitMillis = this.gridOptionsService.getAsyncTransactionWaitMillis();
      this.applyAsyncTransactionsTimeout = window.setTimeout(() => {
        this.executeBatchUpdateRowData();
      }, waitMillis);
    }
    this.rowDataTransactionBatch.push({
      rowDataTransaction: rowDataTransaction,
      callback: callback
    });
  }
  flushAsyncTransactions() {
    if (this.applyAsyncTransactionsTimeout != null) {
      clearTimeout(this.applyAsyncTransactionsTimeout);
      this.executeBatchUpdateRowData();
    }
  }
  executeBatchUpdateRowData() {
    this.valueCache.onDataChanged();
    const callbackFuncsBound = [];
    const rowNodeTrans = [];
    let forceRowNodeOrder = false;
    if (this.rowDataTransactionBatch) {
      this.rowDataTransactionBatch.forEach(tranItem => {
        const rowNodeTran = this.nodeManager.updateRowData(tranItem.rowDataTransaction, undefined);
        rowNodeTrans.push(rowNodeTran);
        if (tranItem.callback) {
          callbackFuncsBound.push(tranItem.callback.bind(null, rowNodeTran));
        }
        if (typeof tranItem.rowDataTransaction.addIndex === 'number') {
          forceRowNodeOrder = true;
        }
      });
    }
    this.commonUpdateRowData(rowNodeTrans, undefined, forceRowNodeOrder);
    if (callbackFuncsBound.length > 0) {
      window.setTimeout(() => {
        callbackFuncsBound.forEach(func => func());
      }, 0);
    }
    if (rowNodeTrans.length > 0) {
      const event = {
        type: Events.EVENT_ASYNC_TRANSACTIONS_FLUSHED,
        results: rowNodeTrans
      };
      this.eventService.dispatchEvent(event);
    }
    this.rowDataTransactionBatch = null;
    this.applyAsyncTransactionsTimeout = undefined;
  }
  updateRowData(rowDataTran, rowNodeOrder) {
    this.valueCache.onDataChanged();
    const rowNodeTran = this.nodeManager.updateRowData(rowDataTran, rowNodeOrder);
    const forceRowNodeOrder = typeof rowDataTran.addIndex === 'number';
    this.commonUpdateRowData([rowNodeTran], rowNodeOrder, forceRowNodeOrder);
    return rowNodeTran;
  }
  createRowNodeOrder() {
    const suppressSortOrder = this.gridOptionsService.get('suppressMaintainUnsortedOrder');
    if (suppressSortOrder) {
      return;
    }
    const orderMap = {};
    if (this.rootNode && this.rootNode.allLeafChildren) {
      for (let index = 0; index < this.rootNode.allLeafChildren.length; index++) {
        const node = this.rootNode.allLeafChildren[index];
        orderMap[node.id] = index;
      }
    }
    return orderMap;
  }
  commonUpdateRowData(rowNodeTrans, rowNodeOrder, forceRowNodeOrder) {
    if (!this.hasStarted) {
      return;
    }
    const animate = !this.gridOptionsService.get('suppressAnimationFrame');
    if (forceRowNodeOrder) {
      rowNodeOrder = this.createRowNodeOrder();
    }
    const event = {
      type: Events.EVENT_ROW_DATA_UPDATED
    };
    this.eventService.dispatchEvent(event);
    this.refreshModel({
      step: ClientSideRowModelSteps.EVERYTHING,
      rowNodeTransactions: rowNodeTrans,
      rowNodeOrder: rowNodeOrder,
      keepRenderedRows: true,
      keepEditingRows: true,
      animate
    });
  }
  doRowsToDisplay() {
    this.rowsToDisplay = this.flattenStage.execute({
      rowNode: this.rootNode
    });
  }
  onRowHeightChanged() {
    this.refreshModel({
      step: ClientSideRowModelSteps.MAP,
      keepRenderedRows: true,
      keepEditingRows: true,
      keepUndoRedoStack: true
    });
  }
  onRowHeightChangedDebounced() {
    this.onRowHeightChanged_debounced();
  }
  resetRowHeights() {
    const atLeastOne = this.resetRowHeightsForAllRowNodes();
    this.rootNode.setRowHeight(this.rootNode.rowHeight, true);
    console.log(444, this.rootNode.rowHeight);
    if (this.rootNode.sibling) {
      this.rootNode.sibling.setRowHeight(this.rootNode.sibling.rowHeight, true);
    }
    if (atLeastOne) {
      this.onRowHeightChanged();
    }
  }
  resetRowHeightsForAllRowNodes() {
    let atLeastOne = false;
    this.forEachNode(rowNode => {
      rowNode.setRowHeight(rowNode.rowHeight, true);
      const detailNode = rowNode.detailNode;
      if (detailNode) {
        detailNode.setRowHeight(detailNode.rowHeight, true);
      }
      if (rowNode.sibling) {
        rowNode.sibling.setRowHeight(rowNode.sibling.rowHeight, true);
      }
      atLeastOne = true;
    });
    return atLeastOne;
  }
  onGridStylesChanges() {
    if (this.columnModel.isAutoRowHeightActive()) {
      return;
    }
    this.resetRowHeights();
  }
  onGridReady() {
    if (this.hasStarted) {
      return;
    }
    this.setInitialData();
  }
  isRowDataLoaded() {
    return this.nodeManager.hasData();
  }
};
__decorate([Autowired('columnModel')], ClientSideRowModel.prototype, "columnModel", void 0);
__decorate([Autowired('selectionService')], ClientSideRowModel.prototype, "selectionService", void 0);
__decorate([Autowired('filterManager')], ClientSideRowModel.prototype, "filterManager", void 0);
__decorate([Autowired('valueCache')], ClientSideRowModel.prototype, "valueCache", void 0);
__decorate([Autowired('beans')], ClientSideRowModel.prototype, "beans", void 0);
__decorate([Autowired('filterStage')], ClientSideRowModel.prototype, "filterStage", void 0);
__decorate([Autowired('sortStage')], ClientSideRowModel.prototype, "sortStage", void 0);
__decorate([Autowired('flattenStage')], ClientSideRowModel.prototype, "flattenStage", void 0);
__decorate([Optional('groupStage')], ClientSideRowModel.prototype, "groupStage", void 0);
__decorate([Optional('aggregationStage')], ClientSideRowModel.prototype, "aggregationStage", void 0);
__decorate([Optional('pivotStage')], ClientSideRowModel.prototype, "pivotStage", void 0);
__decorate([Optional('filterAggregatesStage')], ClientSideRowModel.prototype, "filterAggregatesStage", void 0);
__decorate([PostConstruct], ClientSideRowModel.prototype, "init", null);
ClientSideRowModel = __decorate([Bean('rowModel')], ClientSideRowModel);
export { ClientSideRowModel };