var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { RowCtrl } from "./row/rowCtrl";
import { Events } from "../events";
import { Autowired, Bean, PostConstruct } from "../context/context";
import { BeanStub } from "../context/beanStub";
import { exists } from "../utils/generic";
import { getAllValuesInObject, iterateObject } from "../utils/object";
import { createArrayOfNumbers } from "../utils/number";
import { executeInAWhile } from "../utils/function";
import { CellCtrl } from "./cell/cellCtrl";
import { removeFromArray } from "../utils/array";
import { StickyRowFeature } from "./features/stickyRowFeature";
import { browserSupportsPreventScroll } from "../utils/browser";
let RowRenderer = class RowRenderer extends BeanStub {
  constructor() {
    super(...arguments);
    this.destroyFuncsForColumnListeners = [];
    this.rowCtrlsByRowIndex = {};
    this.zombieRowCtrls = {};
    this.allRowCtrls = [];
    this.topRowCtrls = [];
    this.bottomRowCtrls = [];
    this.refreshInProgress = false;
    this.dataFirstRenderedFired = false;
    this.setupRangeSelectionListeners = () => {
      const onRangeSelectionChanged = () => {
        this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onRangeSelectionChanged());
      };
      const onColumnMovedPinnedVisible = () => {
        this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.updateRangeBordersIfRangeCount());
      };
      const addRangeSelectionListeners = () => {
        this.eventService.addEventListener(Events.EVENT_RANGE_SELECTION_CHANGED, onRangeSelectionChanged);
        this.eventService.addEventListener(Events.EVENT_COLUMN_MOVED, onColumnMovedPinnedVisible);
        this.eventService.addEventListener(Events.EVENT_COLUMN_PINNED, onColumnMovedPinnedVisible);
        this.eventService.addEventListener(Events.EVENT_COLUMN_VISIBLE, onColumnMovedPinnedVisible);
      };
      const removeRangeSelectionListeners = () => {
        this.eventService.removeEventListener(Events.EVENT_RANGE_SELECTION_CHANGED, onRangeSelectionChanged);
        this.eventService.removeEventListener(Events.EVENT_COLUMN_MOVED, onColumnMovedPinnedVisible);
        this.eventService.removeEventListener(Events.EVENT_COLUMN_PINNED, onColumnMovedPinnedVisible);
        this.eventService.removeEventListener(Events.EVENT_COLUMN_VISIBLE, onColumnMovedPinnedVisible);
      };
      this.addDestroyFunc(() => removeRangeSelectionListeners());
      this.addManagedPropertyListener('enableRangeSelection', params => {
        const isEnabled = params.currentValue;
        if (isEnabled) {
          addRangeSelectionListeners();
        } else {
          removeRangeSelectionListeners();
        }
      });
      const rangeSelectionEnabled = this.gridOptionsService.get('enableRangeSelection');
      if (rangeSelectionEnabled) {
        addRangeSelectionListeners();
      }
    };
  }
  postConstruct() {
    this.ctrlsService.whenReady(() => {
      this.gridBodyCtrl = this.ctrlsService.getGridBodyCtrl();
      this.initialise();
    });
  }
  initialise() {
    this.addManagedListener(this.eventService, Events.EVENT_PAGINATION_CHANGED, this.onPageLoaded.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_PINNED_ROW_DATA_CHANGED, this.onPinnedRowDataChanged.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_DISPLAYED_COLUMNS_CHANGED, this.onDisplayedColumnsChanged.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_BODY_SCROLL, this.onBodyScroll.bind(this));
    this.addManagedListener(this.eventService, Events.EVENT_BODY_HEIGHT_CHANGED, this.redraw.bind(this));
    this.addManagedPropertyListeners(['domLayout', 'embedFullWidthRows'], () => this.onDomLayoutChanged());
    this.addManagedPropertyListeners(['suppressMaxRenderedRowRestriction', 'rowBuffer'], () => this.redraw());
    this.addManagedPropertyListeners(['suppressCellFocus', 'getBusinessKeyForNode', 'fullWidthCellRenderer', 'fullWidthCellRendererParams', 'rowStyle', 'getRowStyle', 'rowClass', 'getRowClass', 'rowClassRules', 'groupRowRenderer', 'groupRowRendererParams', 'loadingCellRenderer', 'loadingCellRendererParams', 'detailCellRenderer', 'detailCellRendererParams', 'enableRangeSelection', 'enableCellTextSelection'], () => this.redrawRows());
    if (this.gridOptionsService.isGroupRowsSticky()) {
      const rowModelType = this.rowModel.getType();
      if (rowModelType === 'clientSide' || rowModelType === 'serverSide') {
        this.stickyRowFeature = this.createManagedBean(new StickyRowFeature(this.createRowCon.bind(this), this.destroyRowCtrls.bind(this)));
      }
    }
    this.registerCellEventListeners();
    this.initialiseCache();
    this.printLayout = this.gridOptionsService.isDomLayout('print');
    this.embedFullWidthRows = this.printLayout || this.gridOptionsService.get('embedFullWidthRows');
    this.redrawAfterModelUpdate();
  }
  initialiseCache() {
    if (this.gridOptionsService.get('keepDetailRows')) {
      const countProp = this.getKeepDetailRowsCount();
      const count = countProp != null ? countProp : 3;
      this.cachedRowCtrls = new RowCtrlCache(count);
    }
  }
  getKeepDetailRowsCount() {
    return this.gridOptionsService.get('keepDetailRowsCount');
  }
  getStickyTopRowCtrls() {
    if (!this.stickyRowFeature) {
      return [];
    }
    return this.stickyRowFeature.getStickyRowCtrls();
  }
  updateAllRowCtrls() {
    const liveList = getAllValuesInObject(this.rowCtrlsByRowIndex);
    const isEnsureDomOrder = this.gridOptionsService.get('ensureDomOrder');
    const isPrintLayout = this.gridOptionsService.isDomLayout('print');
    if (isEnsureDomOrder || isPrintLayout) {
      liveList.sort((a, b) => a.getRowNode().rowIndex - b.getRowNode.rowIndex);
    }
    const zombieList = getAllValuesInObject(this.zombieRowCtrls);
    const cachedList = this.cachedRowCtrls ? this.cachedRowCtrls.getEntries() : [];
    if (zombieList.length > 0 || cachedList.length > 0) {
      this.allRowCtrls = [...liveList, ...zombieList, ...cachedList];
    } else {
      this.allRowCtrls = liveList;
    }
  }
  onCellFocusChanged(event) {
    this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onCellFocused(event));
    this.getFullWidthRowCtrls().forEach(rowCtrl => rowCtrl.onFullWidthRowFocused(event));
  }
  registerCellEventListeners() {
    this.addManagedListener(this.eventService, Events.EVENT_CELL_FOCUSED, event => {
      this.onCellFocusChanged(event);
    });
    this.addManagedListener(this.eventService, Events.EVENT_CELL_FOCUS_CLEARED, () => {
      this.onCellFocusChanged();
    });
    this.addManagedListener(this.eventService, Events.EVENT_FLASH_CELLS, event => {
      this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onFlashCells(event));
    });
    this.addManagedListener(this.eventService, Events.EVENT_COLUMN_HOVER_CHANGED, () => {
      this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onColumnHover());
    });
    this.addManagedListener(this.eventService, Events.EVENT_DISPLAYED_COLUMNS_CHANGED, () => {
      this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onDisplayedColumnsChanged());
    });
    this.addManagedListener(this.eventService, Events.EVENT_DISPLAYED_COLUMNS_WIDTH_CHANGED, () => {
      if (this.printLayout) {
        this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onLeftChanged());
      }
    });
    this.setupRangeSelectionListeners();
    this.refreshListenersToColumnsForCellComps();
    this.addManagedListener(this.eventService, Events.EVENT_GRID_COLUMNS_CHANGED, this.refreshListenersToColumnsForCellComps.bind(this));
    this.addDestroyFunc(this.removeGridColumnListeners.bind(this));
  }
  removeGridColumnListeners() {
    this.destroyFuncsForColumnListeners.forEach(func => func());
    this.destroyFuncsForColumnListeners.length = 0;
  }
  refreshListenersToColumnsForCellComps() {
    this.removeGridColumnListeners();
    const cols = this.columnModel.getAllGridColumns();
    cols.forEach(col => {
      const forEachCellWithThisCol = callback => {
        this.getAllCellCtrls().forEach(cellCtrl => {
          if (cellCtrl.getColumn() === col) {
            callback(cellCtrl);
          }
        });
      };
      const leftChangedListener = () => {
        forEachCellWithThisCol(cellCtrl => cellCtrl.onLeftChanged());
      };
      const widthChangedListener = () => {
        forEachCellWithThisCol(cellCtrl => cellCtrl.onWidthChanged());
      };
      const firstRightPinnedChangedListener = () => {
        forEachCellWithThisCol(cellCtrl => cellCtrl.onFirstRightPinnedChanged());
      };
      const lastLeftPinnedChangedListener = () => {
        forEachCellWithThisCol(cellCtrl => cellCtrl.onLastLeftPinnedChanged());
      };
      const colDefChangedListener = () => {
        forEachCellWithThisCol(cellCtrl => cellCtrl.onColDefChanged());
      };
      col.addEventListener('leftChanged', leftChangedListener);
      col.addEventListener('widthChanged', widthChangedListener);
      col.addEventListener('firstRightPinnedChanged', firstRightPinnedChangedListener);
      col.addEventListener('lastLeftPinnedChanged', lastLeftPinnedChangedListener);
      col.addEventListener('colDefChanged', colDefChangedListener);
      this.destroyFuncsForColumnListeners.push(() => {
        col.removeEventListener('leftChanged', leftChangedListener);
        col.removeEventListener('widthChanged', widthChangedListener);
        col.removeEventListener('firstRightPinnedChanged', firstRightPinnedChangedListener);
        col.removeEventListener('lastLeftPinnedChanged', lastLeftPinnedChangedListener);
        col.removeEventListener('colDefChanged', colDefChangedListener);
      });
    });
  }
  onDomLayoutChanged() {
    const printLayout = this.gridOptionsService.isDomLayout('print');
    const embedFullWidthRows = printLayout || this.gridOptionsService.get('embedFullWidthRows');
    const destroyRows = embedFullWidthRows !== this.embedFullWidthRows || this.printLayout !== printLayout;
    this.printLayout = printLayout;
    this.embedFullWidthRows = embedFullWidthRows;
    if (destroyRows) {
      this.redrawAfterModelUpdate({
        domLayoutChanged: true
      });
    }
  }
  datasourceChanged() {
    this.firstRenderedRow = 0;
    this.lastRenderedRow = -1;
    const rowIndexesToRemove = Object.keys(this.rowCtrlsByRowIndex);
    this.removeRowCtrls(rowIndexesToRemove);
  }
  onPageLoaded(event) {
    const params = {
      recycleRows: event.keepRenderedRows,
      animate: event.animate,
      newData: event.newData,
      newPage: event.newPage,
      onlyBody: true
    };
    this.redrawAfterModelUpdate(params);
  }
  getAllCellsForColumn(column) {
    const res = [];
    this.getAllRowCtrls().forEach(rowCtrl => {
      const eCell = rowCtrl.getCellElement(column);
      if (eCell) {
        res.push(eCell);
      }
    });
    return res;
  }
  refreshFloatingRowComps() {
    this.refreshFloatingRows(this.topRowCtrls, this.pinnedRowModel.getPinnedTopRowData());
    this.refreshFloatingRows(this.bottomRowCtrls, this.pinnedRowModel.getPinnedBottomRowData());
  }
  getTopRowCtrls() {
    return this.topRowCtrls;
  }
  getCentreRowCtrls() {
    return this.allRowCtrls;
  }
  getBottomRowCtrls() {
    return this.bottomRowCtrls;
  }
  refreshFloatingRows(rowComps, rowNodes) {
    rowComps.forEach(row => {
      row.destroyFirstPass();
      row.destroySecondPass();
    });
    rowComps.length = 0;
    if (!rowNodes) {
      return;
    }
    rowNodes.forEach(rowNode => {
      const rowCtrl = new RowCtrl(rowNode, this.beans, false, false, this.printLayout);
      rowComps.push(rowCtrl);
    });
  }
  onPinnedRowDataChanged() {
    const params = {
      recycleRows: true
    };
    this.redrawAfterModelUpdate(params);
  }
  redrawRow(rowNode, suppressEvent = false) {
    if (rowNode.sticky) {
      this.stickyRowFeature.refreshStickyNode(rowNode);
    } else {
      const destroyAndRecreateCtrl = dataStruct => {
        const ctrl = dataStruct[rowNode.rowIndex];
        if (!ctrl) {
          return;
        }
        if (ctrl.getRowNode() !== rowNode) {
          return;
        }
        ctrl.destroyFirstPass();
        ctrl.destroySecondPass();
        dataStruct[rowNode.rowIndex] = this.createRowCon(rowNode, false, false);
      };
      switch (rowNode.rowPinned) {
        case 'top':
          destroyAndRecreateCtrl(this.topRowCtrls);
        case 'bottom':
          destroyAndRecreateCtrl(this.bottomRowCtrls);
        default:
          destroyAndRecreateCtrl(this.rowCtrlsByRowIndex);
          this.updateAllRowCtrls();
      }
    }
    if (!suppressEvent) {
      this.dispatchDisplayedRowsChanged(false);
    }
  }
  redrawRows(rowNodes) {
    const partialRefresh = rowNodes != null;
    if (partialRefresh) {
      rowNodes === null || rowNodes === void 0 ? void 0 : rowNodes.forEach(node => this.redrawRow(node, true));
      this.dispatchDisplayedRowsChanged(false);
      return;
    }
    this.redrawAfterModelUpdate();
  }
  getCellToRestoreFocusToAfterRefresh(params) {
    const focusedCell = (params === null || params === void 0 ? void 0 : params.suppressKeepFocus) ? null : this.focusService.getFocusCellToUseAfterRefresh();
    if (focusedCell == null) {
      return null;
    }
    const eDocument = this.gridOptionsService.getDocument();
    const activeElement = eDocument.activeElement;
    const cellDomData = this.gridOptionsService.getDomData(activeElement, CellCtrl.DOM_DATA_KEY_CELL_CTRL);
    const rowDomData = this.gridOptionsService.getDomData(activeElement, RowCtrl.DOM_DATA_KEY_ROW_CTRL);
    const gridElementFocused = cellDomData || rowDomData;
    return gridElementFocused ? focusedCell : null;
  }
  redrawAfterModelUpdate(params = {}) {
    this.getLockOnRefresh();
    const focusedCell = this.getCellToRestoreFocusToAfterRefresh(params);
    this.updateContainerHeights();
    this.scrollToTopIfNewData(params);
    const recycleRows = !params.domLayoutChanged && !!params.recycleRows;
    const animate = params.animate && this.gridOptionsService.isAnimateRows();
    const rowsToRecycle = recycleRows ? this.getRowsToRecycle() : null;
    if (!recycleRows) {
      this.removeAllRowComps();
    }
    this.workOutFirstAndLastRowsToRender();
    if (this.stickyRowFeature) {
      this.stickyRowFeature.checkStickyRows();
    }
    this.recycleRows(rowsToRecycle, animate);
    this.gridBodyCtrl.updateRowCount();
    if (!params.onlyBody) {
      this.refreshFloatingRowComps();
    }
    this.dispatchDisplayedRowsChanged();
    if (focusedCell != null) {
      this.restoreFocusedCell(focusedCell);
    }
    this.releaseLockOnRefresh();
  }
  scrollToTopIfNewData(params) {
    const scrollToTop = params.newData || params.newPage;
    const suppressScrollToTop = this.gridOptionsService.get('suppressScrollOnNewData');
    if (scrollToTop && !suppressScrollToTop) {
      this.gridBodyCtrl.getScrollFeature().scrollToTop();
    }
  }
  updateContainerHeights() {
    if (this.printLayout) {
      this.rowContainerHeightService.setModelHeight(null);
      return;
    }
    let containerHeight = this.paginationProxy.getCurrentPageHeight();
    if (containerHeight === 0) {
      containerHeight = 1;
    }
    this.rowContainerHeightService.setModelHeight(containerHeight);
  }
  getLockOnRefresh() {
    if (this.refreshInProgress) {
      throw new Error("ZING Grid: cannot get grid to draw rows when it is in the middle of drawing rows. " + "Your code probably called a grid API method while the grid was in the render stage. To overcome " + "this, put the API call into a timeout, e.g. instead of api.redrawRows(), " + "call setTimeout(function() { api.redrawRows(); }, 0). To see what part of your code " + "that caused the refresh check this stacktrace.");
    }
    this.refreshInProgress = true;
  }
  releaseLockOnRefresh() {
    this.refreshInProgress = false;
  }
  isRefreshInProgress() {
    return this.refreshInProgress;
  }
  restoreFocusedCell(cellPosition) {
    if (cellPosition) {
      this.focusService.setRestoreFocusedCell(cellPosition);
      this.onCellFocusChanged({
        rowIndex: cellPosition.rowIndex,
        column: cellPosition.column,
        rowPinned: cellPosition.rowPinned,
        forceBrowserFocus: true,
        preventScrollOnBrowserFocus: true,
        api: this.beans.gridApi,
        columnApi: this.beans.columnApi,
        context: this.beans.gridOptionsService.context,
        type: 'mock'
      });
    }
  }
  stopEditing(cancel = false) {
    this.getAllRowCtrls().forEach(rowCtrl => {
      rowCtrl.stopEditing(cancel);
    });
  }
  getAllCellCtrls() {
    const res = [];
    const rowCtrls = this.getAllRowCtrls();
    const rowCtrlsLength = rowCtrls.length;
    for (let i = 0; i < rowCtrlsLength; i++) {
      const cellCtrls = rowCtrls[i].getAllCellCtrls();
      const cellCtrlsLength = cellCtrls.length;
      for (let j = 0; j < cellCtrlsLength; j++) {
        res.push(cellCtrls[j]);
      }
    }
    return res;
  }
  getAllRowCtrls() {
    const stickyRowCtrls = this.stickyRowFeature && this.stickyRowFeature.getStickyRowCtrls() || [];
    const res = [...this.topRowCtrls, ...this.bottomRowCtrls, ...stickyRowCtrls];
    for (const key of Object.keys(this.rowCtrlsByRowIndex)) {
      res.push(this.rowCtrlsByRowIndex[key]);
    }
    return res;
  }
  addRenderedRowListener(eventName, rowIndex, callback) {
    const rowComp = this.rowCtrlsByRowIndex[rowIndex];
    if (rowComp) {
      rowComp.addEventListener(eventName, callback);
    }
  }
  flashCells(params = {}) {
    const {
      flashDelay,
      fadeDelay
    } = params;
    this.getCellCtrls(params.rowNodes, params.columns).forEach(cellCtrl => cellCtrl.flashCell({
      flashDelay,
      fadeDelay
    }));
  }
  refreshCells(params = {}) {
    const refreshCellParams = {
      forceRefresh: params.force,
      newData: false,
      suppressFlash: params.suppressFlash
    };
    this.getCellCtrls(params.rowNodes, params.columns).forEach(cellCtrl => cellCtrl.refreshOrDestroyCell(refreshCellParams));
    if (params.rowNodes) {
      this.getRowCtrls(params.rowNodes).forEach(rowCtrl => {
        if (!rowCtrl.isFullWidth()) {
          return;
        }
        const refreshed = rowCtrl.refreshFullWidth();
        if (!refreshed) {
          this.redrawRow(rowCtrl.getRowNode(), true);
        }
      });
      this.dispatchDisplayedRowsChanged(false);
    }
  }
  getCellRendererInstances(params) {
    var _a;
    const cellRenderers = this.getCellCtrls(params.rowNodes, params.columns).map(cellCtrl => cellCtrl.getCellRenderer()).filter(renderer => renderer != null);
    if ((_a = params.columns) === null || _a === void 0 ? void 0 : _a.length) {
      return cellRenderers;
    }
    const fullWidthRenderers = [];
    const rowIdMap = this.mapRowNodes(params.rowNodes);
    this.getAllRowCtrls().forEach(rowCtrl => {
      if (rowIdMap && !this.isRowInMap(rowCtrl.getRowNode(), rowIdMap)) {
        return;
      }
      if (!rowCtrl.isFullWidth()) {
        return;
      }
      const fullWidthRenderer = rowCtrl.getFullWidthCellRenderer();
      if (fullWidthRenderer) {
        fullWidthRenderers.push(fullWidthRenderer);
      }
    });
    return [...fullWidthRenderers, ...cellRenderers];
  }
  getCellEditorInstances(params) {
    const res = [];
    this.getCellCtrls(params.rowNodes, params.columns).forEach(cellCtrl => {
      const cellEditor = cellCtrl.getCellEditor();
      if (cellEditor) {
        res.push(cellEditor);
      }
    });
    return res;
  }
  getEditingCells() {
    const res = [];
    this.getAllCellCtrls().forEach(cellCtrl => {
      if (cellCtrl.isEditing()) {
        const cellPosition = cellCtrl.getCellPosition();
        res.push(cellPosition);
      }
    });
    return res;
  }
  mapRowNodes(rowNodes) {
    if (!rowNodes) {
      return;
    }
    const res = {
      top: {},
      bottom: {},
      normal: {}
    };
    rowNodes.forEach(rowNode => {
      const id = rowNode.id;
      if (rowNode.rowPinned === 'top') {
        res.top[id] = rowNode;
      } else if (rowNode.rowPinned === 'bottom') {
        res.bottom[id] = rowNode;
      } else {
        res.normal[id] = rowNode;
      }
    });
    return res;
  }
  isRowInMap(rowNode, rowIdsMap) {
    const id = rowNode.id;
    const floating = rowNode.rowPinned;
    if (floating === 'bottom') {
      return rowIdsMap.bottom[id] != null;
    }
    if (floating === 'top') {
      return rowIdsMap.top[id] != null;
    }
    return rowIdsMap.normal[id] != null;
  }
  getRowCtrls(rowNodes) {
    const rowIdsMap = this.mapRowNodes(rowNodes);
    const allRowCtrls = this.getAllRowCtrls();
    if (!rowNodes || !rowIdsMap) {
      return allRowCtrls;
    }
    return allRowCtrls.filter(rowCtrl => {
      const rowNode = rowCtrl.getRowNode();
      return this.isRowInMap(rowNode, rowIdsMap);
    });
  }
  getCellCtrls(rowNodes, columns) {
    let colIdsMap;
    if (exists(columns)) {
      colIdsMap = {};
      columns.forEach(colKey => {
        const column = this.columnModel.getGridColumn(colKey);
        if (exists(column)) {
          colIdsMap[column.getId()] = true;
        }
      });
    }
    const res = [];
    this.getRowCtrls(rowNodes).forEach(rowCtrl => {
      rowCtrl.getAllCellCtrls().forEach(cellCtrl => {
        const colId = cellCtrl.getColumn().getId();
        const excludeColFromRefresh = colIdsMap && !colIdsMap[colId];
        if (excludeColFromRefresh) {
          return;
        }
        res.push(cellCtrl);
      });
    });
    return res;
  }
  destroy() {
    this.removeAllRowComps();
    super.destroy();
  }
  removeAllRowComps() {
    const rowIndexesToRemove = Object.keys(this.rowCtrlsByRowIndex);
    this.removeRowCtrls(rowIndexesToRemove);
  }
  getRowsToRecycle() {
    const stubNodeIndexes = [];
    iterateObject(this.rowCtrlsByRowIndex, (index, rowComp) => {
      const stubNode = rowComp.getRowNode().id == null;
      if (stubNode) {
        stubNodeIndexes.push(index);
      }
    });
    this.removeRowCtrls(stubNodeIndexes);
    const ctrlsByIdMap = {};
    iterateObject(this.rowCtrlsByRowIndex, (index, rowComp) => {
      const rowNode = rowComp.getRowNode();
      ctrlsByIdMap[rowNode.id] = rowComp;
    });
    this.rowCtrlsByRowIndex = {};
    return ctrlsByIdMap;
  }
  removeRowCtrls(rowsToRemove) {
    rowsToRemove.forEach(indexToRemove => {
      const rowCtrl = this.rowCtrlsByRowIndex[indexToRemove];
      if (rowCtrl) {
        rowCtrl.destroyFirstPass();
        rowCtrl.destroySecondPass();
      }
      delete this.rowCtrlsByRowIndex[indexToRemove];
    });
  }
  onBodyScroll(e) {
    if (e.direction !== 'vertical') {
      return;
    }
    this.redraw({
      afterScroll: true
    });
  }
  redraw(params = {}) {
    const {
      afterScroll
    } = params;
    let cellFocused;
    if (this.stickyRowFeature && browserSupportsPreventScroll()) {
      cellFocused = this.getCellToRestoreFocusToAfterRefresh() || undefined;
    }
    const oldFirstRow = this.firstRenderedRow;
    const oldLastRow = this.lastRenderedRow;
    this.workOutFirstAndLastRowsToRender();
    let hasStickyRowChanges = false;
    if (this.stickyRowFeature) {
      hasStickyRowChanges = this.stickyRowFeature.checkStickyRows();
    }
    const rangeChanged = this.firstRenderedRow !== oldFirstRow || this.lastRenderedRow !== oldLastRow;
    if (afterScroll && !hasStickyRowChanges && !rangeChanged) {
      return;
    }
    this.getLockOnRefresh();
    this.recycleRows(null, false, afterScroll);
    this.releaseLockOnRefresh();
    this.dispatchDisplayedRowsChanged(afterScroll);
    if (cellFocused != null) {
      const newFocusedCell = this.getCellToRestoreFocusToAfterRefresh();
      if (cellFocused != null && newFocusedCell == null) {
        this.animationFrameService.flushAllFrames();
        this.restoreFocusedCell(cellFocused);
      }
    }
  }
  removeRowCompsNotToDraw(indexesToDraw) {
    const indexesToDrawMap = {};
    indexesToDraw.forEach(index => indexesToDrawMap[index] = true);
    const existingIndexes = Object.keys(this.rowCtrlsByRowIndex);
    const indexesNotToDraw = existingIndexes.filter(index => !indexesToDrawMap[index]);
    this.removeRowCtrls(indexesNotToDraw);
  }
  calculateIndexesToDraw(rowsToRecycle) {
    let indexesToDraw = createArrayOfNumbers(this.firstRenderedRow, this.lastRenderedRow);
    const checkRowToDraw = (indexStr, rowComp) => {
      const index = rowComp.getRowNode().rowIndex;
      if (index == null) {
        return;
      }
      if (index < this.firstRenderedRow || index > this.lastRenderedRow) {
        if (this.doNotUnVirtualiseRow(rowComp)) {
          indexesToDraw.push(index);
        }
      }
    };
    iterateObject(this.rowCtrlsByRowIndex, checkRowToDraw);
    iterateObject(rowsToRecycle, checkRowToDraw);
    indexesToDraw.sort((a, b) => a - b);
    const ret = [];
    for (let i = 0; i < indexesToDraw.length; i++) {
      const currRow = indexesToDraw[i];
      const rowNode = this.paginationProxy.getRow(currRow);
      if (rowNode && !rowNode.sticky) {
        ret.push(currRow);
      }
    }
    return ret;
  }
  recycleRows(rowsToRecycle, animate = false, afterScroll = false) {
    const indexesToDraw = this.calculateIndexesToDraw(rowsToRecycle);
    this.removeRowCompsNotToDraw(indexesToDraw);
    if (this.printLayout) {
      animate = false;
    }
    const rowCtrls = [];
    indexesToDraw.forEach(rowIndex => {
      const rowCtrl = this.createOrUpdateRowCtrl(rowIndex, rowsToRecycle, animate, afterScroll);
      if (exists(rowCtrl)) {
        rowCtrls.push(rowCtrl);
      }
    });
    if (rowsToRecycle) {
      const useAnimationFrame = afterScroll && !this.gridOptionsService.get('suppressAnimationFrame') && !this.printLayout;
      if (useAnimationFrame) {
        this.beans.animationFrameService.addDestroyTask(() => {
          this.destroyRowCtrls(rowsToRecycle, animate);
          this.updateAllRowCtrls();
          this.dispatchDisplayedRowsChanged();
        });
      } else {
        this.destroyRowCtrls(rowsToRecycle, animate);
      }
    }
    this.updateAllRowCtrls();
  }
  dispatchDisplayedRowsChanged(afterScroll = false) {
    const event = {
      type: Events.EVENT_DISPLAYED_ROWS_CHANGED,
      afterScroll
    };
    this.eventService.dispatchEvent(event);
  }
  onDisplayedColumnsChanged() {
    const pinningLeft = this.columnModel.isPinningLeft();
    const pinningRight = this.columnModel.isPinningRight();
    const atLeastOneChanged = this.pinningLeft !== pinningLeft || pinningRight !== this.pinningRight;
    if (atLeastOneChanged) {
      this.pinningLeft = pinningLeft;
      this.pinningRight = pinningRight;
      if (this.embedFullWidthRows) {
        this.redrawFullWidthEmbeddedRows();
      }
    }
  }
  redrawFullWidthEmbeddedRows() {
    const rowsToRemove = [];
    this.getFullWidthRowCtrls().forEach(fullWidthCtrl => {
      const rowIndex = fullWidthCtrl.getRowNode().rowIndex;
      rowsToRemove.push(rowIndex.toString());
    });
    this.refreshFloatingRowComps();
    this.removeRowCtrls(rowsToRemove);
    this.redraw({
      afterScroll: true
    });
  }
  getFullWidthRowCtrls(rowNodes) {
    const rowNodesMap = this.mapRowNodes(rowNodes);
    return this.getAllRowCtrls().filter(rowCtrl => {
      if (!rowCtrl.isFullWidth()) {
        return false;
      }
      const rowNode = rowCtrl.getRowNode();
      if (rowNodesMap != null && !this.isRowInMap(rowNode, rowNodesMap)) {
        return false;
      }
      return true;
    });
  }
  createOrUpdateRowCtrl(rowIndex, rowsToRecycle, animate, afterScroll) {
    let rowNode;
    let rowCtrl = this.rowCtrlsByRowIndex[rowIndex];
    if (!rowCtrl) {
      rowNode = this.paginationProxy.getRow(rowIndex);
      if (exists(rowNode) && exists(rowsToRecycle) && rowsToRecycle[rowNode.id] && rowNode.alreadyRendered) {
        rowCtrl = rowsToRecycle[rowNode.id];
        rowsToRecycle[rowNode.id] = null;
      }
    }
    const creatingNewRowCtrl = !rowCtrl;
    if (creatingNewRowCtrl) {
      if (!rowNode) {
        rowNode = this.paginationProxy.getRow(rowIndex);
      }
      if (exists(rowNode)) {
        rowCtrl = this.createRowCon(rowNode, animate, afterScroll);
      } else {
        return;
      }
    }
    if (rowNode) {
      rowNode.alreadyRendered = true;
    }
    this.rowCtrlsByRowIndex[rowIndex] = rowCtrl;
    return rowCtrl;
  }
  destroyRowCtrls(rowCtrlsMap, animate) {
    const executeInAWhileFuncs = [];
    iterateObject(rowCtrlsMap, (nodeId, rowCtrl) => {
      if (!rowCtrl) {
        return;
      }
      if (this.cachedRowCtrls && rowCtrl.isCacheable()) {
        this.cachedRowCtrls.addRow(rowCtrl);
        return;
      }
      rowCtrl.destroyFirstPass();
      if (animate) {
        this.zombieRowCtrls[rowCtrl.getInstanceId()] = rowCtrl;
        executeInAWhileFuncs.push(() => {
          rowCtrl.destroySecondPass();
          delete this.zombieRowCtrls[rowCtrl.getInstanceId()];
        });
      } else {
        rowCtrl.destroySecondPass();
      }
    });
    if (animate) {
      executeInAWhileFuncs.push(() => {
        this.updateAllRowCtrls();
        this.dispatchDisplayedRowsChanged();
      });
      executeInAWhile(executeInAWhileFuncs);
    }
  }
  getRowBuffer() {
    return this.gridOptionsService.get('rowBuffer');
  }
  getRowBufferInPixels() {
    const rowsToBuffer = this.getRowBuffer();
    const defaultRowHeight = this.gridOptionsService.getRowHeightAsNumber();
    return rowsToBuffer * defaultRowHeight;
  }
  workOutFirstAndLastRowsToRender() {
    this.rowContainerHeightService.updateOffset();
    let newFirst;
    let newLast;
    if (!this.paginationProxy.isRowsToRender()) {
      newFirst = 0;
      newLast = -1;
    } else if (this.printLayout) {
      this.environment.refreshRowHeightVariable();
      newFirst = this.paginationProxy.getPageFirstRow();
      newLast = this.paginationProxy.getPageLastRow();
    } else {
      const bufferPixels = this.getRowBufferInPixels();
      const gridBodyCtrl = this.ctrlsService.getGridBodyCtrl();
      const suppressRowVirtualisation = this.gridOptionsService.get('suppressRowVirtualisation');
      let rowHeightsChanged = false;
      let firstPixel;
      let lastPixel;
      do {
        const paginationOffset = this.paginationProxy.getPixelOffset();
        const {
          pageFirstPixel,
          pageLastPixel
        } = this.paginationProxy.getCurrentPagePixelRange();
        const divStretchOffset = this.rowContainerHeightService.getDivStretchOffset();
        const bodyVRange = gridBodyCtrl.getScrollFeature().getVScrollPosition();
        const bodyTopPixel = bodyVRange.top;
        const bodyBottomPixel = bodyVRange.bottom;
        if (suppressRowVirtualisation) {
          firstPixel = pageFirstPixel + divStretchOffset;
          lastPixel = pageLastPixel + divStretchOffset;
        } else {
          firstPixel = Math.max(bodyTopPixel + paginationOffset - bufferPixels, pageFirstPixel) + divStretchOffset;
          lastPixel = Math.min(bodyBottomPixel + paginationOffset + bufferPixels, pageLastPixel) + divStretchOffset;
        }
        this.firstVisibleVPixel = Math.max(bodyTopPixel + paginationOffset, pageFirstPixel) + divStretchOffset;
        rowHeightsChanged = this.ensureAllRowsInRangeHaveHeightsCalculated(firstPixel, lastPixel);
      } while (rowHeightsChanged);
      let firstRowIndex = this.paginationProxy.getRowIndexAtPixel(firstPixel);
      let lastRowIndex = this.paginationProxy.getRowIndexAtPixel(lastPixel);
      const pageFirstRow = this.paginationProxy.getPageFirstRow();
      const pageLastRow = this.paginationProxy.getPageLastRow();
      if (firstRowIndex < pageFirstRow) {
        firstRowIndex = pageFirstRow;
      }
      if (lastRowIndex > pageLastRow) {
        lastRowIndex = pageLastRow;
      }
      newFirst = firstRowIndex;
      newLast = lastRowIndex;
    }
    const rowLayoutNormal = this.gridOptionsService.isDomLayout('normal');
    const suppressRowCountRestriction = this.gridOptionsService.get('suppressMaxRenderedRowRestriction');
    const rowBufferMaxSize = Math.max(this.getRowBuffer(), 500);
    if (rowLayoutNormal && !suppressRowCountRestriction) {
      if (newLast - newFirst > rowBufferMaxSize) {
        newLast = newFirst + rowBufferMaxSize;
      }
    }
    const firstDiffers = newFirst !== this.firstRenderedRow;
    const lastDiffers = newLast !== this.lastRenderedRow;
    if (firstDiffers || lastDiffers) {
      this.firstRenderedRow = newFirst;
      this.lastRenderedRow = newLast;
      const event = {
        type: Events.EVENT_VIEWPORT_CHANGED,
        firstRow: newFirst,
        lastRow: newLast
      };
      this.eventService.dispatchEvent(event);
    }
  }
  dispatchFirstDataRenderedEvent() {
    if (this.dataFirstRenderedFired) {
      return;
    }
    this.dataFirstRenderedFired = true;
    const event = {
      type: Events.EVENT_FIRST_DATA_RENDERED,
      firstRow: this.firstRenderedRow,
      lastRow: this.lastRenderedRow
    };
    window.requestAnimationFrame(() => {
      this.beans.eventService.dispatchEvent(event);
    });
  }
  ensureAllRowsInRangeHaveHeightsCalculated(topPixel, bottomPixel) {
    const res = this.paginationProxy.ensureRowHeightsValid(topPixel, bottomPixel, -1, -1);
    if (res) {
      this.updateContainerHeights();
    }
    return res;
  }
  getFirstVisibleVerticalPixel() {
    return this.firstVisibleVPixel;
  }
  getFirstVirtualRenderedRow() {
    return this.firstRenderedRow;
  }
  getLastVirtualRenderedRow() {
    return this.lastRenderedRow;
  }
  doNotUnVirtualiseRow(rowComp) {
    const REMOVE_ROW = false;
    const KEEP_ROW = true;
    const rowNode = rowComp.getRowNode();
    const rowHasFocus = this.focusService.isRowNodeFocused(rowNode);
    const rowIsEditing = rowComp.isEditing();
    const rowIsDetail = rowNode.detail;
    const mightWantToKeepRow = rowHasFocus || rowIsEditing || rowIsDetail;
    if (!mightWantToKeepRow) {
      return REMOVE_ROW;
    }
    const rowNodePresent = this.paginationProxy.isRowPresent(rowNode);
    return rowNodePresent ? KEEP_ROW : REMOVE_ROW;
  }
  createRowCon(rowNode, animate, afterScroll) {
    const rowCtrlFromCache = this.cachedRowCtrls ? this.cachedRowCtrls.getRow(rowNode) : null;
    if (rowCtrlFromCache) {
      return rowCtrlFromCache;
    }
    const suppressAnimationFrame = this.gridOptionsService.get('suppressAnimationFrame');
    const useAnimationFrameForCreate = afterScroll && !suppressAnimationFrame && !this.printLayout;
    const res = new RowCtrl(rowNode, this.beans, animate, useAnimationFrameForCreate, this.printLayout);
    return res;
  }
  getRenderedNodes() {
    const renderedRows = this.rowCtrlsByRowIndex;
    return Object.keys(renderedRows).map(key => renderedRows[key].getRowNode());
  }
  getRowByPosition(rowPosition) {
    let rowCtrl;
    const {
      rowIndex
    } = rowPosition;
    switch (rowPosition.rowPinned) {
      case 'top':
        rowCtrl = this.topRowCtrls[rowIndex];
        break;
      case 'bottom':
        rowCtrl = this.bottomRowCtrls[rowIndex];
        break;
      default:
        rowCtrl = this.rowCtrlsByRowIndex[rowIndex];
        if (!rowCtrl) {
          rowCtrl = this.getStickyTopRowCtrls().find(ctrl => ctrl.getRowNode().rowIndex === rowIndex) || null;
        }
        break;
    }
    return rowCtrl;
  }
  getRowNode(gridRow) {
    switch (gridRow.rowPinned) {
      case 'top':
        return this.pinnedRowModel.getPinnedTopRowData()[gridRow.rowIndex];
      case 'bottom':
        return this.pinnedRowModel.getPinnedBottomRowData()[gridRow.rowIndex];
      default:
        return this.rowModel.getRow(gridRow.rowIndex);
    }
  }
  isRangeInRenderedViewport(startIndex, endIndex) {
    const parentClosed = startIndex == null || endIndex == null;
    if (parentClosed) {
      return false;
    }
    const blockAfterViewport = startIndex > this.lastRenderedRow;
    const blockBeforeViewport = endIndex < this.firstRenderedRow;
    const blockInsideViewport = !blockBeforeViewport && !blockAfterViewport;
    return blockInsideViewport;
  }
};
__decorate([Autowired("animationFrameService")], RowRenderer.prototype, "animationFrameService", void 0);
__decorate([Autowired("paginationProxy")], RowRenderer.prototype, "paginationProxy", void 0);
__decorate([Autowired("columnModel")], RowRenderer.prototype, "columnModel", void 0);
__decorate([Autowired("pinnedRowModel")], RowRenderer.prototype, "pinnedRowModel", void 0);
__decorate([Autowired("rowModel")], RowRenderer.prototype, "rowModel", void 0);
__decorate([Autowired("focusService")], RowRenderer.prototype, "focusService", void 0);
__decorate([Autowired("beans")], RowRenderer.prototype, "beans", void 0);
__decorate([Autowired("rowContainerHeightService")], RowRenderer.prototype, "rowContainerHeightService", void 0);
__decorate([Autowired("ctrlsService")], RowRenderer.prototype, "ctrlsService", void 0);
__decorate([PostConstruct], RowRenderer.prototype, "postConstruct", null);
RowRenderer = __decorate([Bean("rowRenderer")], RowRenderer);
export { RowRenderer };
class RowCtrlCache {
  constructor(maxCount) {
    this.entriesMap = {};
    this.entriesList = [];
    this.maxCount = maxCount;
  }
  addRow(rowCtrl) {
    this.entriesMap[rowCtrl.getRowNode().id] = rowCtrl;
    this.entriesList.push(rowCtrl);
    rowCtrl.setCached(true);
    if (this.entriesList.length > this.maxCount) {
      const rowCtrlToDestroy = this.entriesList[0];
      rowCtrlToDestroy.destroyFirstPass();
      rowCtrlToDestroy.destroySecondPass();
      this.removeFromCache(rowCtrlToDestroy);
    }
  }
  getRow(rowNode) {
    if (rowNode == null || rowNode.id == null) {
      return null;
    }
    const res = this.entriesMap[rowNode.id];
    if (!res) {
      return null;
    }
    this.removeFromCache(res);
    res.setCached(false);
    const rowNodeMismatch = res.getRowNode() != rowNode;
    return rowNodeMismatch ? null : res;
  }
  removeFromCache(rowCtrl) {
    const rowNodeId = rowCtrl.getRowNode().id;
    delete this.entriesMap[rowNodeId];
    removeFromArray(this.entriesList, rowCtrl);
  }
  getEntries() {
    return this.entriesList;
  }
}