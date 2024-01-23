var __decorate = this && this.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
    r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
    d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Autowired, Bean, Optional, PostConstruct } from "./context/context";
import { ExcelFactoryMode } from "./interfaces/iExcelCreator";
import { ModuleNames } from "./modules/moduleNames";
import { ModuleRegistry } from "./modules/moduleRegistry";
import { exists, missing } from "./utils/generic";
import { iterateObject, removeAllReferences } from "./utils/object";
import { Events } from './eventKeys';
import { warnOnce } from "./utils/function";
export function unwrapUserComp(comp) {
  const compAsAny = comp;
  const isProxy = compAsAny != null && compAsAny.getFrameworkComponentInstance != null;
  return isProxy ? compAsAny.getFrameworkComponentInstance() : comp;
}
let GridApi = class GridApi {
  constructor() {
    this.detailGridInfoMap = {};
    this.destroyCalled = false;
  }
  init() {
    switch (this.rowModel.getType()) {
      case 'clientSide':
        this.clientSideRowModel = this.rowModel;
        break;
      case 'infinite':
        this.infiniteRowModel = this.rowModel;
        break;
      case 'serverSide':
        this.serverSideRowModel = this.rowModel;
        break;
    }
    this.ctrlsService.whenReady(() => {
      this.gridBodyCtrl = this.ctrlsService.getGridBodyCtrl();
    });
  }
  __getAlignedGridService() {
    return this.alignedGridsService;
  }
  __getContext() {
    return this.context;
  }
  getGridId() {
    return this.context.getGridId();
  }
  addDetailGridInfo(id, gridInfo) {
    this.detailGridInfoMap[id] = gridInfo;
  }
  removeDetailGridInfo(id) {
    this.detailGridInfoMap[id] = undefined;
  }
  getDetailGridInfo(id) {
    return this.detailGridInfoMap[id];
  }
  forEachDetailGridInfo(callback) {
    let index = 0;
    iterateObject(this.detailGridInfoMap, (id, gridInfo) => {
      if (exists(gridInfo)) {
        callback(gridInfo, index);
        index++;
      }
    });
  }
  getDataAsCsv(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.CsvExportModule, 'api.getDataAsCsv', this.context.getGridId())) {
      return this.csvCreator.getDataAsCsv(params);
    }
  }
  exportDataAsCsv(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.CsvExportModule, 'api.exportDataAsCSv', this.context.getGridId())) {
      this.csvCreator.exportDataAsCsv(params);
    }
  }
  assertNotExcelMultiSheet(method, params) {
    if (!ModuleRegistry.__assertRegistered(ModuleNames.ExcelExportModule, 'api.' + method, this.context.getGridId())) {
      return false;
    }
    if (this.excelCreator.getFactoryMode() === ExcelFactoryMode.MULTI_SHEET) {
      console.warn("ZING Grid: The Excel Exporter is currently on Multi Sheet mode. End that operation by calling 'api.getMultipleSheetAsExcel()' or 'api.exportMultipleSheetsAsExcel()'");
      return false;
    }
    return true;
  }
  getDataAsExcel(params) {
    if (this.assertNotExcelMultiSheet('getDataAsExcel', params)) {
      return this.excelCreator.getDataAsExcel(params);
    }
  }
  exportDataAsExcel(params) {
    if (this.assertNotExcelMultiSheet('exportDataAsExcel', params)) {
      this.excelCreator.exportDataAsExcel(params);
    }
  }
  getSheetDataForExcel(params) {
    if (!ModuleRegistry.__assertRegistered(ModuleNames.ExcelExportModule, 'api.getSheetDataForExcel', this.context.getGridId())) {
      return;
    }
    this.excelCreator.setFactoryMode(ExcelFactoryMode.MULTI_SHEET);
    return this.excelCreator.getSheetDataForExcel(params);
  }
  getMultipleSheetsAsExcel(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.ExcelExportModule, 'api.getMultipleSheetsAsExcel', this.context.getGridId())) {
      return this.excelCreator.getMultipleSheetsAsExcel(params);
    }
  }
  exportMultipleSheetsAsExcel(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.ExcelExportModule, 'api.exportMultipleSheetsAsExcel', this.context.getGridId())) {
      return this.excelCreator.exportMultipleSheetsAsExcel(params);
    }
  }
  setGridAriaProperty(property, value) {
    if (!property) {
      return;
    }
    const eGrid = this.ctrlsService.getGridBodyCtrl().getGui();
    const ariaProperty = `aria-${property}`;
    if (value === null) {
      eGrid.removeAttribute(ariaProperty);
    } else {
      eGrid.setAttribute(ariaProperty, value);
    }
  }
  logMissingRowModel(apiMethod, ...requiredRowModels) {
    console.error(`ZING Grid: api.${apiMethod} can only be called when gridOptions.rowModelType is ${requiredRowModels.join(' or ')}`);
  }
  getPinnedTopRowCount() {
    return this.pinnedRowModel.getPinnedTopRowCount();
  }
  getPinnedBottomRowCount() {
    return this.pinnedRowModel.getPinnedBottomRowCount();
  }
  getPinnedTopRow(index) {
    return this.pinnedRowModel.getPinnedTopRow(index);
  }
  getPinnedBottomRow(index) {
    return this.pinnedRowModel.getPinnedBottomRow(index);
  }
  expireValueCache() {
    this.valueCache.expire();
  }
  getVerticalPixelRange() {
    return this.gridBodyCtrl.getScrollFeature().getVScrollPosition();
  }
  getHorizontalPixelRange() {
    return this.gridBodyCtrl.getScrollFeature().getHScrollPosition();
  }
  refreshCells(params = {}) {
    this.rowRenderer.refreshCells(params);
  }
  flashCells(params = {}) {
    this.rowRenderer.flashCells(params);
  }
  redrawRows(params = {}) {
    const rowNodes = params ? params.rowNodes : undefined;
    this.rowRenderer.redrawRows(rowNodes);
  }
  refreshHeader() {
    this.ctrlsService.getHeaderRowContainerCtrls().forEach(c => c.refresh());
  }
  isAnyFilterPresent() {
    return this.filterManager.isAnyFilterPresent();
  }
  isColumnFilterPresent() {
    return this.filterManager.isColumnFilterPresent() || this.filterManager.isAggregateFilterPresent();
  }
  isQuickFilterPresent() {
    return this.filterManager.isQuickFilterPresent();
  }
  getModel() {
    return this.rowModel;
  }
  setRowNodeExpanded(rowNode, expanded, expandParents) {
    this.expansionService.setRowNodeExpanded(rowNode, expanded, expandParents);
  }
  onGroupExpandedOrCollapsed() {
    if (missing(this.clientSideRowModel)) {
      this.logMissingRowModel('onGroupExpandedOrCollapsed', 'clientSide');
      return;
    }
    this.expansionService.onGroupExpandedOrCollapsed();
  }
  refreshClientSideRowModel(step) {
    if (missing(this.clientSideRowModel)) {
      this.logMissingRowModel('refreshClientSideRowModel', 'clientSide');
      return;
    }
    this.clientSideRowModel.refreshModel(step);
  }
  isAnimationFrameQueueEmpty() {
    return this.animationFrameService.isQueueEmpty();
  }
  flushAllAnimationFrames() {
    this.animationFrameService.flushAllFrames();
  }
  getRowNode(id) {
    return this.rowModel.getRowNode(id);
  }
  getSizesForCurrentTheme() {
    return {
      rowHeight: this.gos.getRowHeightAsNumber(),
      headerHeight: this.columnModel.getHeaderHeight()
    };
  }
  expandAll() {
    if (this.clientSideRowModel || this.serverSideRowModel) {
      this.expansionService.expandAll(true);
    } else {
      this.logMissingRowModel('expandAll', 'clientSide', 'serverSide');
    }
  }
  collapseAll() {
    if (this.clientSideRowModel || this.serverSideRowModel) {
      this.expansionService.expandAll(false);
    } else {
      this.logMissingRowModel('collapseAll', 'clientSide', 'serverSide');
    }
  }
  addRenderedRowListener(eventName, rowIndex, callback) {
    this.rowRenderer.addRenderedRowListener(eventName, rowIndex, callback);
  }
  getQuickFilter() {
    return this.gos.get('quickFilterText');
  }
  getAdvancedFilterModel() {
    if (ModuleRegistry.__assertRegistered(ModuleNames.AdvancedFilterModule, 'api.getAdvancedFilterModel', this.context.getGridId())) {
      return this.filterManager.getAdvancedFilterModel();
    }
    return null;
  }
  setAdvancedFilterModel(advancedFilterModel) {
    this.filterManager.setAdvancedFilterModel(advancedFilterModel);
  }
  showAdvancedFilterBuilder() {
    if (ModuleRegistry.__assertRegistered(ModuleNames.AdvancedFilterModule, 'api.setAdvancedFilterModel', this.context.getGridId())) {
      this.filterManager.showAdvancedFilterBuilder('api');
    }
  }
  setNodesSelected(params) {
    const allNodesValid = params.nodes.every(node => {
      if (node.rowPinned) {
        console.warn('ZING Grid: cannot select pinned rows');
        return false;
      }
      if (node.id === undefined) {
        console.warn('ZING Grid: cannot select node until id for node is known');
        return false;
      }
      return true;
    });
    if (!allNodesValid) {
      return;
    }
    const {
      nodes,
      source,
      newValue
    } = params;
    const nodesAsRowNode = nodes;
    this.selectionService.setNodesSelected({
      nodes: nodesAsRowNode,
      source: source !== null && source !== void 0 ? source : 'api',
      newValue
    });
  }
  selectAll(source = 'apiSelectAll') {
    this.selectionService.selectAllRowNodes({
      source
    });
  }
  deselectAll(source = 'apiSelectAll') {
    this.selectionService.deselectAllRowNodes({
      source
    });
  }
  selectAllFiltered(source = 'apiSelectAllFiltered') {
    this.selectionService.selectAllRowNodes({
      source,
      justFiltered: true
    });
  }
  deselectAllFiltered(source = 'apiSelectAllFiltered') {
    this.selectionService.deselectAllRowNodes({
      source,
      justFiltered: true
    });
  }
  getServerSideSelectionState() {
    if (missing(this.serverSideRowModel)) {
      this.logMissingRowModel('getServerSideSelectionState', 'serverSide');
      return null;
    }
    return this.selectionService.getSelectionState();
  }
  setServerSideSelectionState(state) {
    if (missing(this.serverSideRowModel)) {
      this.logMissingRowModel('setServerSideSelectionState', 'serverSide');
      return;
    }
    this.selectionService.setSelectionState(state, 'api');
  }
  selectAllOnCurrentPage(source = 'apiSelectAllCurrentPage') {
    this.selectionService.selectAllRowNodes({
      source,
      justCurrentPage: true
    });
  }
  deselectAllOnCurrentPage(source = 'apiSelectAllCurrentPage') {
    this.selectionService.deselectAllRowNodes({
      source,
      justCurrentPage: true
    });
  }
  showLoadingOverlay() {
    this.overlayService.showLoadingOverlay();
  }
  showNoRowsOverlay() {
    this.overlayService.showNoRowsOverlay();
  }
  hideOverlay() {
    this.overlayService.hideOverlay();
  }
  getSelectedNodes() {
    return this.selectionService.getSelectedNodes();
  }
  getSelectedRows() {
    return this.selectionService.getSelectedRows();
  }
  getBestCostNodeSelection() {
    if (missing(this.clientSideRowModel)) {
      this.logMissingRowModel('getBestCostNodeSelection', 'clientSide');
      return;
    }
    return this.selectionService.getBestCostNodeSelection();
  }
  getRenderedNodes() {
    return this.rowRenderer.getRenderedNodes();
  }
  ensureColumnVisible(key, position = 'auto') {
    this.gridBodyCtrl.getScrollFeature().ensureColumnVisible(key, position);
  }
  ensureIndexVisible(index, position) {
    this.gridBodyCtrl.getScrollFeature().ensureIndexVisible(index, position);
  }
  ensureNodeVisible(nodeSelector, position = null) {
    this.gridBodyCtrl.getScrollFeature().ensureNodeVisible(nodeSelector, position);
  }
  forEachLeafNode(callback) {
    if (missing(this.clientSideRowModel)) {
      this.logMissingRowModel('forEachLeafNode', 'clientSide');
      return;
    }
    this.clientSideRowModel.forEachLeafNode(callback);
  }
  forEachNode(callback, includeFooterNodes) {
    this.rowModel.forEachNode(callback, includeFooterNodes);
  }
  forEachNodeAfterFilter(callback) {
    if (missing(this.clientSideRowModel)) {
      this.logMissingRowModel('forEachNodeAfterFilter', 'clientSide');
      return;
    }
    this.clientSideRowModel.forEachNodeAfterFilter(callback);
  }
  forEachNodeAfterFilterAndSort(callback) {
    if (missing(this.clientSideRowModel)) {
      this.logMissingRowModel('forEachNodeAfterFilterAndSort', 'clientSide');
      return;
    }
    this.clientSideRowModel.forEachNodeAfterFilterAndSort(callback);
  }
  getFilterInstance(key, callback) {
    return this.filterManager.getFilterInstance(key, callback);
  }
  destroyFilter(key) {
    const column = this.columnModel.getPrimaryColumn(key);
    if (column) {
      return this.filterManager.destroyFilter(column, 'api');
    }
  }
  getStatusPanel(key) {
    if (!ModuleRegistry.__assertRegistered(ModuleNames.StatusBarModule, 'api.getStatusPanel', this.context.getGridId())) {
      return;
    }
    const comp = this.statusBarService.getStatusPanel(key);
    return unwrapUserComp(comp);
  }
  getColumnDef(key) {
    const column = this.columnModel.getPrimaryColumn(key);
    if (column) {
      return column.getColDef();
    }
    return null;
  }
  getColumnDefs() {
    return this.columnModel.getColumnDefs();
  }
  onFilterChanged(source = 'api') {
    this.filterManager.onFilterChanged({
      source
    });
  }
  onSortChanged() {
    this.sortController.onSortChanged('api');
  }
  setFilterModel(model) {
    this.filterManager.setFilterModel(model);
  }
  getFilterModel() {
    return this.filterManager.getFilterModel();
  }
  getFocusedCell() {
    return this.focusService.getFocusedCell();
  }
  clearFocusedCell() {
    return this.focusService.clearFocusedCell();
  }
  setFocusedCell(rowIndex, colKey, rowPinned) {
    this.focusService.setFocusedCell({
      rowIndex,
      column: colKey,
      rowPinned,
      forceBrowserFocus: true
    });
  }
  addRowDropZone(params) {
    this.gridBodyCtrl.getRowDragFeature().addRowDropZone(params);
  }
  removeRowDropZone(params) {
    const activeDropTarget = this.dragAndDropService.findExternalZone(params);
    if (activeDropTarget) {
      this.dragAndDropService.removeDropTarget(activeDropTarget);
    }
  }
  getRowDropZoneParams(events) {
    return this.gridBodyCtrl.getRowDragFeature().getRowDropZone(events);
  }
  assertSideBarLoaded(apiMethod) {
    return ModuleRegistry.__assertRegistered(ModuleNames.SideBarModule, 'api.' + apiMethod, this.context.getGridId());
  }
  isSideBarVisible() {
    return this.assertSideBarLoaded('isSideBarVisible') && this.sideBarService.getSideBarComp().isDisplayed();
  }
  setSideBarVisible(show) {
    if (this.assertSideBarLoaded('setSideBarVisible')) {
      this.sideBarService.getSideBarComp().setDisplayed(show);
    }
  }
  setSideBarPosition(position) {
    if (this.assertSideBarLoaded('setSideBarPosition')) {
      this.sideBarService.getSideBarComp().setSideBarPosition(position);
    }
  }
  openToolPanel(key) {
    if (this.assertSideBarLoaded('openToolPanel')) {
      this.sideBarService.getSideBarComp().openToolPanel(key, 'api');
    }
  }
  closeToolPanel() {
    if (this.assertSideBarLoaded('closeToolPanel')) {
      this.sideBarService.getSideBarComp().close('api');
    }
  }
  getOpenedToolPanel() {
    if (this.assertSideBarLoaded('getOpenedToolPanel')) {
      return this.sideBarService.getSideBarComp().openedItem();
    }
    return null;
  }
  refreshToolPanel() {
    if (this.assertSideBarLoaded('refreshToolPanel')) {
      this.sideBarService.getSideBarComp().refresh();
    }
  }
  isToolPanelShowing() {
    return this.assertSideBarLoaded('isToolPanelShowing') && this.sideBarService.getSideBarComp().isToolPanelShowing();
  }
  getToolPanelInstance(id) {
    if (this.assertSideBarLoaded('getToolPanelInstance')) {
      const comp = this.sideBarService.getSideBarComp().getToolPanelInstance(id);
      return unwrapUserComp(comp);
    }
  }
  getSideBar() {
    if (this.assertSideBarLoaded('getSideBar')) {
      return this.sideBarService.getSideBarComp().getDef();
    }
    return undefined;
  }
  resetRowHeights() {
    if (exists(this.clientSideRowModel)) {
      if (this.columnModel.isAutoRowHeightActive()) {
        console.warn('ZING Grid: calling gridApi.resetRowHeights() makes no sense when using Auto Row Height.');
        return;
      }
      this.clientSideRowModel.resetRowHeights();
    }
  }
  setRowCount(rowCount, maxRowFound) {
    if (this.serverSideRowModel) {
      if (this.columnModel.isRowGroupEmpty()) {
        this.serverSideRowModel.setRowCount(rowCount, maxRowFound);
        return;
      }
      console.error('ZING Grid: setRowCount cannot be used while using row grouping.');
      return;
    }
    if (this.infiniteRowModel) {
      this.infiniteRowModel.setRowCount(rowCount, maxRowFound);
      return;
    }
    this.logMissingRowModel('setRowCount', 'infinite', 'serverSide');
  }
  onRowHeightChanged() {
    if (this.clientSideRowModel) {
      this.clientSideRowModel.onRowHeightChanged();
    } else if (this.serverSideRowModel) {
      this.serverSideRowModel.onRowHeightChanged();
    }
  }
  getValue(colKey, rowNode) {
    let column = this.columnModel.getPrimaryColumn(colKey);
    if (missing(column)) {
      column = this.columnModel.getGridColumn(colKey);
    }
    if (missing(column)) {
      return null;
    }
    return this.valueService.getValue(column, rowNode);
  }
  addEventListener(eventType, listener) {
    this.apiEventService.addEventListener(eventType, listener);
  }
  addGlobalListener(listener) {
    this.apiEventService.addGlobalListener(listener);
  }
  removeEventListener(eventType, listener) {
    this.apiEventService.removeEventListener(eventType, listener);
  }
  removeGlobalListener(listener) {
    this.apiEventService.removeGlobalListener(listener);
  }
  dispatchEvent(event) {
    this.eventService.dispatchEvent(event);
  }
  destroy() {
    const preDestroyLink = `See ${this.frameworkOverrides.getDocLink('grid-lifecycle/#grid-pre-destroyed')}`;
    if (this.destroyCalled) {
      return;
    }
    const event = {
      type: Events.EVENT_GRID_PRE_DESTROYED,
      state: this.getState()
    };
    this.dispatchEvent(event);
    this.destroyCalled = true;
    const gridCtrl = this.ctrlsService.getGridCtrl();
    if (gridCtrl) {
      gridCtrl.destroyGridUi();
    }
    this.context.destroy();
    removeAllReferences(this, ['isDestroyed'], preDestroyLink);
  }
  isDestroyed() {
    return this.destroyCalled;
  }
  resetQuickFilter() {
    this.filterManager.resetQuickFilterCache();
  }
  getCellRanges() {
    if (this.rangeService) {
      return this.rangeService.getCellRanges();
    }
    ModuleRegistry.__assertRegistered(ModuleNames.RangeSelectionModule, 'api.getCellRanges', this.context.getGridId());
    return null;
  }
  addCellRange(params) {
    if (this.rangeService) {
      this.rangeService.addCellRange(params);
      return;
    }
    ModuleRegistry.__assertRegistered(ModuleNames.RangeSelectionModule, 'api.addCellRange', this.context.getGridId());
  }
  clearRangeSelection() {
    if (this.rangeService) {
      this.rangeService.removeAllCellRanges();
    }
    ModuleRegistry.__assertRegistered(ModuleNames.RangeSelectionModule, 'gridApi.clearRangeSelection', this.context.getGridId());
  }
  undoCellEditing() {
    this.undoRedoService.undo('api');
  }
  redoCellEditing() {
    this.undoRedoService.redo('api');
  }
  getCurrentUndoSize() {
    return this.undoRedoService.getCurrentUndoStackSize();
  }
  getCurrentRedoSize() {
    return this.undoRedoService.getCurrentRedoStackSize();
  }
  getChartModels() {
    if (ModuleRegistry.__assertRegistered(ModuleNames.GridChartsModule, 'api.getChartModels', this.context.getGridId())) {
      return this.chartService.getChartModels();
    }
  }
  getChartRef(chartId) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.GridChartsModule, 'api.getChartRef', this.context.getGridId())) {
      return this.chartService.getChartRef(chartId);
    }
  }
  getChartImageDataURL(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.GridChartsModule, 'api.getChartImageDataURL', this.context.getGridId())) {
      return this.chartService.getChartImageDataURL(params);
    }
  }
  downloadChart(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.GridChartsModule, 'api.downloadChart', this.context.getGridId())) {
      return this.chartService.downloadChart(params);
    }
  }
  openChartToolPanel(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.GridChartsModule, 'api.openChartToolPanel', this.context.getGridId())) {
      return this.chartService.openChartToolPanel(params);
    }
  }
  closeChartToolPanel(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.GridChartsModule, 'api.closeChartToolPanel', this.context.getGridId())) {
      return this.chartService.closeChartToolPanel(params.chartId);
    }
  }
  createRangeChart(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.GridChartsModule, 'api.createRangeChart', this.context.getGridId())) {
      return this.chartService.createRangeChart(params);
    }
  }
  createPivotChart(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.GridChartsModule, 'api.createPivotChart', this.context.getGridId())) {
      return this.chartService.createPivotChart(params);
    }
  }
  createCrossFilterChart(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.GridChartsModule, 'api.createCrossFilterChart', this.context.getGridId())) {
      return this.chartService.createCrossFilterChart(params);
    }
  }
  updateChart(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.GridChartsModule, 'api.updateChart', this.context.getGridId())) {
      this.chartService.updateChart(params);
    }
  }
  restoreChart(chartModel, chartContainer) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.GridChartsModule, 'api.restoreChart', this.context.getGridId())) {
      return this.chartService.restoreChart(chartModel, chartContainer);
    }
  }
  copyToClipboard(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.ClipboardModule, 'api.copyToClipboard', this.context.getGridId())) {
      this.clipboardService.copyToClipboard(params);
    }
  }
  cutToClipboard(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.ClipboardModule, 'api.cutToClipboard', this.context.getGridId())) {
      this.clipboardService.cutToClipboard(params, 'api');
    }
  }
  copySelectedRowsToClipboard(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.ClipboardModule, 'api.copySelectedRowsToClipboard', this.context.getGridId())) {
      this.clipboardService.copySelectedRowsToClipboard(params);
    }
  }
  copySelectedRangeToClipboard(params) {
    if (ModuleRegistry.__assertRegistered(ModuleNames.ClipboardModule, 'api.copySelectedRangeToClipboard', this.context.getGridId())) {
      this.clipboardService.copySelectedRangeToClipboard(params);
    }
  }
  copySelectedRangeDown() {
    if (ModuleRegistry.__assertRegistered(ModuleNames.ClipboardModule, 'api.copySelectedRangeDown', this.context.getGridId())) {
      this.clipboardService.copyRangeDown();
    }
  }
  pasteFromClipboard() {
    if (ModuleRegistry.__assertRegistered(ModuleNames.ClipboardModule, 'api.pasteFromClipboard', this.context.getGridId())) {
      this.clipboardService.pasteFromClipboard();
    }
  }
  showColumnMenuAfterButtonClick(colKey, buttonElement) {
    const column = this.columnModel.getGridColumn(colKey);
    this.menuFactory.showMenuAfterButtonClick(column, buttonElement, 'columnMenu');
  }
  showColumnMenuAfterMouseClick(colKey, mouseEvent) {
    let column = this.columnModel.getGridColumn(colKey);
    if (!column) {
      column = this.columnModel.getPrimaryColumn(colKey);
    }
    if (!column) {
      console.error(`ZING Grid: column '${colKey}' not found`);
      return;
    }
    this.menuFactory.showMenuAfterMouseEvent(column, mouseEvent);
  }
  hidePopupMenu() {
    if (this.contextMenuFactory) {
      this.contextMenuFactory.hideActiveMenu();
    }
    this.menuFactory.hideActiveMenu();
  }
  tabToNextCell(event) {
    return this.navigationService.tabToNextCell(false, event);
  }
  tabToPreviousCell(event) {
    return this.navigationService.tabToNextCell(true, event);
  }
  getCellRendererInstances(params = {}) {
    const res = this.rowRenderer.getCellRendererInstances(params);
    const unwrapped = res.map(unwrapUserComp);
    return unwrapped;
  }
  getCellEditorInstances(params = {}) {
    const res = this.rowRenderer.getCellEditorInstances(params);
    const unwrapped = res.map(unwrapUserComp);
    return unwrapped;
  }
  getEditingCells() {
    return this.rowRenderer.getEditingCells();
  }
  stopEditing(cancel = false) {
    this.rowRenderer.stopEditing(cancel);
  }
  startEditingCell(params) {
    const column = this.columnModel.getGridColumn(params.colKey);
    if (!column) {
      console.warn(`ZING Grid: no column found for ${params.colKey}`);
      return;
    }
    const cellPosition = {
      rowIndex: params.rowIndex,
      rowPinned: params.rowPinned || null,
      column: column
    };
    const notPinned = params.rowPinned == null;
    if (notPinned) {
      this.gridBodyCtrl.getScrollFeature().ensureIndexVisible(params.rowIndex);
    }
    const cell = this.navigationService.getCellByPosition(cellPosition);
    if (!cell) {
      return;
    }
    if (!this.focusService.isCellFocused(cellPosition)) {
      this.focusService.setFocusedCell(cellPosition);
    }
    cell.startRowOrCellEdit(params.key);
  }
  addAggFunc(key, aggFunc) {
    if (this.aggFuncService) {
      this.aggFuncService.addAggFunc(key, aggFunc);
    }
  }
  addAggFuncs(aggFuncs) {
    if (this.aggFuncService) {
      this.aggFuncService.addAggFuncs(aggFuncs);
    }
  }
  clearAggFuncs() {
    if (this.aggFuncService) {
      this.aggFuncService.clear();
    }
  }
  applyServerSideTransaction(transaction) {
    if (!this.serverSideTransactionManager) {
      this.logMissingRowModel('applyServerSideTransaction', 'serverSide');
      return;
    }
    return this.serverSideTransactionManager.applyTransaction(transaction);
  }
  applyServerSideTransactionAsync(transaction, callback) {
    if (!this.serverSideTransactionManager) {
      this.logMissingRowModel('applyServerSideTransactionAsync', 'serverSide');
      return;
    }
    return this.serverSideTransactionManager.applyTransactionAsync(transaction, callback);
  }
  applyServerSideRowData(params) {
    var _a, _b;
    const startRow = (_a = params.startRow) !== null && _a !== void 0 ? _a : 0;
    const route = (_b = params.route) !== null && _b !== void 0 ? _b : [];
    if (startRow < 0) {
      console.warn(`ZING Grid: invalid value ${params.startRow} for startRow, the value should be >= 0`);
      return;
    }
    if (this.serverSideRowModel) {
      this.serverSideRowModel.applyRowData(params.successParams, startRow, route);
    } else {
      this.logMissingRowModel('setServerSideDatasource', 'serverSide');
    }
  }
  retryServerSideLoads() {
    if (!this.serverSideRowModel) {
      this.logMissingRowModel('retryServerSideLoads', 'serverSide');
      return;
    }
    this.serverSideRowModel.retryLoads();
  }
  flushServerSideAsyncTransactions() {
    if (!this.serverSideTransactionManager) {
      this.logMissingRowModel('flushServerSideAsyncTransactions', 'serverSide');
      return;
    }
    return this.serverSideTransactionManager.flushAsyncTransactions();
  }
  applyTransaction(rowDataTransaction) {
    if (!this.clientSideRowModel) {
      this.logMissingRowModel('applyTransaction', 'clientSide');
      return;
    }
    return this.clientSideRowModel.updateRowData(rowDataTransaction);
  }
  applyTransactionAsync(rowDataTransaction, callback) {
    if (!this.clientSideRowModel) {
      this.logMissingRowModel('applyTransactionAsync', 'clientSide');
      return;
    }
    this.clientSideRowModel.batchUpdateRowData(rowDataTransaction, callback);
  }
  flushAsyncTransactions() {
    if (!this.clientSideRowModel) {
      this.logMissingRowModel('flushAsyncTransactions', 'clientSide');
      return;
    }
    this.clientSideRowModel.flushAsyncTransactions();
  }
  refreshInfiniteCache() {
    if (this.infiniteRowModel) {
      this.infiniteRowModel.refreshCache();
    } else {
      this.logMissingRowModel('refreshInfiniteCache', 'infinite');
    }
  }
  purgeInfiniteCache() {
    if (this.infiniteRowModel) {
      this.infiniteRowModel.purgeCache();
    } else {
      this.logMissingRowModel('purgeInfiniteCache', 'infinite');
    }
  }
  refreshServerSide(params) {
    if (!this.serverSideRowModel) {
      this.logMissingRowModel('refreshServerSide', 'serverSide');
      return;
    }
    this.serverSideRowModel.refreshStore(params);
  }
  getServerSideGroupLevelState() {
    if (!this.serverSideRowModel) {
      this.logMissingRowModel('getServerSideGroupLevelState', 'serverSide');
      return [];
    }
    return this.serverSideRowModel.getStoreState();
  }
  getInfiniteRowCount() {
    if (this.infiniteRowModel) {
      return this.infiniteRowModel.getRowCount();
    } else {
      this.logMissingRowModel('getInfiniteRowCount', 'infinite');
    }
  }
  isLastRowIndexKnown() {
    if (this.infiniteRowModel) {
      return this.infiniteRowModel.isLastRowIndexKnown();
    } else {
      this.logMissingRowModel('isLastRowIndexKnown', 'infinite');
    }
  }
  getCacheBlockState() {
    return this.rowNodeBlockLoader.getBlockState();
  }
  getFirstDisplayedRow() {
    return this.rowRenderer.getFirstVirtualRenderedRow();
  }
  getLastDisplayedRow() {
    return this.rowRenderer.getLastVirtualRenderedRow();
  }
  getDisplayedRowAtIndex(index) {
    return this.rowModel.getRow(index);
  }
  getDisplayedRowCount() {
    return this.rowModel.getRowCount();
  }
  paginationIsLastPageFound() {
    return this.paginationProxy.isLastPageFound();
  }
  paginationGetPageSize() {
    return this.paginationProxy.getPageSize();
  }
  paginationGetCurrentPage() {
    return this.paginationProxy.getCurrentPage();
  }
  paginationGetTotalPages() {
    return this.paginationProxy.getTotalPages();
  }
  paginationGetRowCount() {
    return this.paginationProxy.getMasterRowCount();
  }
  paginationGoToNextPage() {
    this.paginationProxy.goToNextPage();
  }
  paginationGoToPreviousPage() {
    this.paginationProxy.goToPreviousPage();
  }
  paginationGoToFirstPage() {
    this.paginationProxy.goToFirstPage();
  }
  paginationGoToLastPage() {
    this.paginationProxy.goToLastPage();
  }
  paginationGoToPage(page) {
    this.paginationProxy.goToPage(page);
  }
  sizeColumnsToFit(paramsOrGridWidth) {
    if (typeof paramsOrGridWidth === 'number') {
      this.columnModel.sizeColumnsToFit(paramsOrGridWidth, 'api');
    } else {
      this.gridBodyCtrl.sizeColumnsToFit(paramsOrGridWidth);
    }
  }
  setColumnGroupOpened(group, newValue) {
    this.columnModel.setColumnGroupOpened(group, newValue, 'api');
  }
  getColumnGroup(name, instanceId) {
    return this.columnModel.getColumnGroup(name, instanceId);
  }
  getProvidedColumnGroup(name) {
    return this.columnModel.getProvidedColumnGroup(name);
  }
  getDisplayNameForColumn(column, location) {
    return this.columnModel.getDisplayNameForColumn(column, location) || '';
  }
  getDisplayNameForColumnGroup(columnGroup, location) {
    return this.columnModel.getDisplayNameForColumnGroup(columnGroup, location) || '';
  }
  getColumn(key) {
    return this.columnModel.getPrimaryColumn(key);
  }
  getColumns() {
    return this.columnModel.getAllPrimaryColumns();
  }
  applyColumnState(params) {
    return this.columnModel.applyColumnState(params, 'api');
  }
  getColumnState() {
    return this.columnModel.getColumnState();
  }
  resetColumnState() {
    this.columnModel.resetColumnState('api');
  }
  getColumnGroupState() {
    return this.columnModel.getColumnGroupState();
  }
  setColumnGroupState(stateItems) {
    this.columnModel.setColumnGroupState(stateItems, 'api');
  }
  resetColumnGroupState() {
    this.columnModel.resetColumnGroupState('api');
  }
  isPinning() {
    return this.columnModel.isPinningLeft() || this.columnModel.isPinningRight();
  }
  isPinningLeft() {
    return this.columnModel.isPinningLeft();
  }
  isPinningRight() {
    return this.columnModel.isPinningRight();
  }
  getDisplayedColAfter(col) {
    return this.columnModel.getDisplayedColAfter(col);
  }
  getDisplayedColBefore(col) {
    return this.columnModel.getDisplayedColBefore(col);
  }
  setColumnVisible(key, visible) {
    this.columnModel.setColumnVisible(key, visible, 'api');
  }
  setColumnsVisible(keys, visible) {
    this.columnModel.setColumnsVisible(keys, visible, 'api');
  }
  setColumnPinned(key, pinned) {
    this.columnModel.setColumnPinned(key, pinned, 'api');
  }
  setColumnsPinned(keys, pinned) {
    this.columnModel.setColumnsPinned(keys, pinned, 'api');
  }
  getAllGridColumns() {
    return this.columnModel.getAllGridColumns();
  }
  getDisplayedLeftColumns() {
    return this.columnModel.getDisplayedLeftColumns();
  }
  getDisplayedCenterColumns() {
    return this.columnModel.getDisplayedCenterColumns();
  }
  getDisplayedRightColumns() {
    return this.columnModel.getDisplayedRightColumns();
  }
  getAllDisplayedColumns() {
    return this.columnModel.getAllDisplayedColumns();
  }
  getAllDisplayedVirtualColumns() {
    return this.columnModel.getViewportColumns();
  }
  moveColumn(key, toIndex) {
    this.columnModel.moveColumn(key, toIndex, 'api');
  }
  moveColumnByIndex(fromIndex, toIndex) {
    this.columnModel.moveColumnByIndex(fromIndex, toIndex, 'api');
  }
  moveColumns(columnsToMoveKeys, toIndex) {
    this.columnModel.moveColumns(columnsToMoveKeys, toIndex, 'api');
  }
  moveRowGroupColumn(fromIndex, toIndex) {
    this.columnModel.moveRowGroupColumn(fromIndex, toIndex);
  }
  setColumnAggFunc(key, aggFunc) {
    this.columnModel.setColumnAggFunc(key, aggFunc);
  }
  setColumnWidth(key, newWidth, finished = true, source) {
    this.columnModel.setColumnWidths([{
      key,
      newWidth
    }], false, finished, source);
  }
  setColumnWidths(columnWidths, finished = true, source) {
    this.columnModel.setColumnWidths(columnWidths, false, finished, source);
  }
  isPivotMode() {
    return this.columnModel.isPivotMode();
  }
  getPivotResultColumn(pivotKeys, valueColKey) {
    return this.columnModel.getSecondaryPivotColumn(pivotKeys, valueColKey);
  }
  setValueColumns(colKeys) {
    this.columnModel.setValueColumns(colKeys, 'api');
  }
  getValueColumns() {
    return this.columnModel.getValueColumns();
  }
  removeValueColumn(colKey) {
    this.columnModel.removeValueColumn(colKey, 'api');
  }
  removeValueColumns(colKeys) {
    this.columnModel.removeValueColumns(colKeys, 'api');
  }
  addValueColumn(colKey) {
    this.columnModel.addValueColumn(colKey, 'api');
  }
  addValueColumns(colKeys) {
    this.columnModel.addValueColumns(colKeys, 'api');
  }
  setRowGroupColumns(colKeys) {
    this.columnModel.setRowGroupColumns(colKeys, 'api');
  }
  removeRowGroupColumn(colKey) {
    this.columnModel.removeRowGroupColumn(colKey, 'api');
  }
  removeRowGroupColumns(colKeys) {
    this.columnModel.removeRowGroupColumns(colKeys, 'api');
  }
  addRowGroupColumn(colKey) {
    this.columnModel.addRowGroupColumn(colKey, 'api');
  }
  addRowGroupColumns(colKeys) {
    this.columnModel.addRowGroupColumns(colKeys, 'api');
  }
  getRowGroupColumns() {
    return this.columnModel.getRowGroupColumns();
  }
  setPivotColumns(colKeys) {
    this.columnModel.setPivotColumns(colKeys, 'api');
  }
  removePivotColumn(colKey) {
    this.columnModel.removePivotColumn(colKey, 'api');
  }
  removePivotColumns(colKeys) {
    this.columnModel.removePivotColumns(colKeys, 'api');
  }
  addPivotColumn(colKey) {
    this.columnModel.addPivotColumn(colKey, 'api');
  }
  addPivotColumns(colKeys) {
    this.columnModel.addPivotColumns(colKeys, 'api');
  }
  getPivotColumns() {
    return this.columnModel.getPivotColumns();
  }
  getLeftDisplayedColumnGroups() {
    return this.columnModel.getDisplayedTreeLeft();
  }
  getCenterDisplayedColumnGroups() {
    return this.columnModel.getDisplayedTreeCentre();
  }
  getRightDisplayedColumnGroups() {
    return this.columnModel.getDisplayedTreeRight();
  }
  getAllDisplayedColumnGroups() {
    return this.columnModel.getAllDisplayedTrees();
  }
  autoSizeColumn(key, skipHeader) {
    return this.columnModel.autoSizeColumn(key, skipHeader, 'api');
  }
  autoSizeColumns(keys, skipHeader) {
    this.columnModel.autoSizeColumns({
      columns: keys,
      skipHeader: skipHeader
    });
  }
  autoSizeAllColumns(skipHeader) {
    this.columnModel.autoSizeAllColumns(skipHeader, 'api');
  }
  setPivotResultColumns(colDefs) {
    this.columnModel.setSecondaryColumns(colDefs, 'api');
  }
  getPivotResultColumns() {
    return this.columnModel.getSecondaryColumns();
  }
  getState() {
    return this.stateService.getState();
  }
  getGridOption(key) {
    return this.gos.get(key);
  }
  setGridOption(key, value) {
    this.updateGridOptions({
      [key]: value
    });
  }
  updateGridOptions(options) {
    this.gos.updateGridOptions({
      options
    });
  }
  __internalUpdateGridOptions(options) {
    this.gos.updateGridOptions({
      options,
      source: 'gridOptionsUpdated'
    });
  }
  deprecatedUpdateGridOption(key, value) {
    warnOnce(`set${key.charAt(0).toUpperCase()}${key.slice(1, key.length)} is deprecated. Please use 'api.setGridOption('${key}', newValue)' or 'api.updateGridOptions({ ${key}: newValue })' instead.`);
    this.setGridOption(key, value);
  }
  setPivotMode(pivotMode) {
    this.deprecatedUpdateGridOption('pivotMode', pivotMode);
  }
  setPinnedTopRowData(rows) {
    this.deprecatedUpdateGridOption('pinnedTopRowData', rows);
  }
  setPinnedBottomRowData(rows) {
    this.deprecatedUpdateGridOption('pinnedBottomRowData', rows);
  }
  setPopupParent(ePopupParent) {
    this.deprecatedUpdateGridOption('popupParent', ePopupParent);
  }
  setSuppressModelUpdateAfterUpdateTransaction(value) {
    this.deprecatedUpdateGridOption('suppressModelUpdateAfterUpdateTransaction', value);
  }
  setDataTypeDefinitions(dataTypeDefinitions) {
    this.deprecatedUpdateGridOption('dataTypeDefinitions', dataTypeDefinitions);
  }
  setPagination(value) {
    this.deprecatedUpdateGridOption('pagination', value);
  }
  paginationSetPageSize(size) {
    this.deprecatedUpdateGridOption('paginationPageSize', size);
  }
  setSideBar(def) {
    this.deprecatedUpdateGridOption('sideBar', def);
  }
  setSuppressClipboardPaste(value) {
    this.deprecatedUpdateGridOption('suppressClipboardPaste', value);
  }
  setGroupRemoveSingleChildren(value) {
    this.deprecatedUpdateGridOption('groupRemoveSingleChildren', value);
  }
  setGroupRemoveLowestSingleChildren(value) {
    this.deprecatedUpdateGridOption('groupRemoveLowestSingleChildren', value);
  }
  setGroupDisplayType(value) {
    this.deprecatedUpdateGridOption('groupDisplayType', value);
  }
  setGroupIncludeFooter(value) {
    this.deprecatedUpdateGridOption('groupIncludeFooter', value);
  }
  setGroupIncludeTotalFooter(value) {
    this.deprecatedUpdateGridOption('groupIncludeTotalFooter', value);
  }
  setRowClass(className) {
    this.deprecatedUpdateGridOption('rowClass', className);
  }
  setDeltaSort(enable) {
    this.deprecatedUpdateGridOption('deltaSort', enable);
  }
  setSuppressRowDrag(value) {
    this.deprecatedUpdateGridOption('suppressRowDrag', value);
  }
  setSuppressMoveWhenRowDragging(value) {
    this.deprecatedUpdateGridOption('suppressMoveWhenRowDragging', value);
  }
  setSuppressRowClickSelection(value) {
    this.deprecatedUpdateGridOption('suppressRowClickSelection', value);
  }
  setEnableAdvancedFilter(enabled) {
    this.deprecatedUpdateGridOption('enableAdvancedFilter', enabled);
  }
  setIncludeHiddenColumnsInAdvancedFilter(value) {
    this.deprecatedUpdateGridOption('includeHiddenColumnsInAdvancedFilter', value);
  }
  setAdvancedFilterParent(advancedFilterParent) {
    this.deprecatedUpdateGridOption('advancedFilterParent', advancedFilterParent);
  }
  setAdvancedFilterBuilderParams(params) {
    this.deprecatedUpdateGridOption('advancedFilterBuilderParams', params);
  }
  setQuickFilter(newFilter) {
    warnOnce(`setQuickFilter is deprecated. Please use 'api.setGridOption('quickFilterText', newValue)' or 'api.updateGridOptions({ quickFilterText: newValue })' instead.`);
    this.gos.updateGridOptions({
      options: {
        quickFilterText: newFilter
      }
    });
  }
  setExcludeHiddenColumnsFromQuickFilter(value) {
    this.deprecatedUpdateGridOption('includeHiddenColumnsInQuickFilter', !value);
  }
  setIncludeHiddenColumnsInQuickFilter(value) {
    this.deprecatedUpdateGridOption('includeHiddenColumnsInQuickFilter', value);
  }
  setQuickFilterParser(quickFilterParser) {
    this.deprecatedUpdateGridOption('quickFilterParser', quickFilterParser);
  }
  setQuickFilterMatcher(quickFilterMatcher) {
    this.deprecatedUpdateGridOption('quickFilterMatcher', quickFilterMatcher);
  }
  setAlwaysShowHorizontalScroll(show) {
    this.deprecatedUpdateGridOption('alwaysShowHorizontalScroll', show);
  }
  setAlwaysShowVerticalScroll(show) {
    this.deprecatedUpdateGridOption('alwaysShowVerticalScroll', show);
  }
  setFunctionsReadOnly(readOnly) {
    this.deprecatedUpdateGridOption('functionsReadOnly', readOnly);
  }
  setColumnDefs(colDefs, source = "api") {
    warnOnce(`setColumnDefs is deprecated. Please use 'api.setGridOption('columnDefs', newValue)' or 'api.updateGridOptions({ columnDefs: newValue })' instead.`);
    this.gos.updateGridOptions({
      options: {
        columnDefs: colDefs
      },
      source: source
    });
  }
  setAutoGroupColumnDef(colDef, source = "api") {
    warnOnce(`setAutoGroupColumnDef is deprecated. Please use 'api.setGridOption('autoGroupColumnDef', newValue)' or 'api.updateGridOptions({ autoGroupColumnDef: newValue })' instead.`);
    this.gos.updateGridOptions({
      options: {
        autoGroupColumnDef: colDef
      },
      source: source
    });
  }
  setDefaultColDef(colDef, source = "api") {
    warnOnce(`setDefaultColDef is deprecated. Please use 'api.setGridOption('defaultColDef', newValue)' or 'api.updateGridOptions({ defaultColDef: newValue })' instead.`);
    this.gos.updateGridOptions({
      options: {
        defaultColDef: colDef
      },
      source: source
    });
  }
  setColumnTypes(columnTypes, source = "api") {
    warnOnce(`setColumnTypes is deprecated. Please use 'api.setGridOption('columnTypes', newValue)' or 'api.updateGridOptions({ columnTypes: newValue })' instead.`);
    this.gos.updateGridOptions({
      options: {
        columnTypes: columnTypes
      },
      source: source
    });
  }
  setTreeData(newTreeData) {
    this.deprecatedUpdateGridOption('treeData', newTreeData);
  }
  setServerSideDatasource(datasource) {
    this.deprecatedUpdateGridOption('serverSideDatasource', datasource);
  }
  setCacheBlockSize(blockSize) {
    this.deprecatedUpdateGridOption('cacheBlockSize', blockSize);
  }
  setDatasource(datasource) {
    this.deprecatedUpdateGridOption('datasource', datasource);
  }
  setViewportDatasource(viewportDatasource) {
    this.deprecatedUpdateGridOption('viewportDatasource', viewportDatasource);
  }
  setRowData(rowData) {
    this.deprecatedUpdateGridOption('rowData', rowData);
  }
  setEnableCellTextSelection(selectable) {
    this.deprecatedUpdateGridOption('enableCellTextSelection', selectable);
  }
  setHeaderHeight(headerHeight) {
    this.deprecatedUpdateGridOption('headerHeight', headerHeight);
  }
  setDomLayout(domLayout) {
    this.deprecatedUpdateGridOption('domLayout', domLayout);
  }
  setFillHandleDirection(direction) {
    this.deprecatedUpdateGridOption('fillHandleDirection', direction);
  }
  setGroupHeaderHeight(headerHeight) {
    this.deprecatedUpdateGridOption('groupHeaderHeight', headerHeight);
  }
  setFloatingFiltersHeight(headerHeight) {
    this.deprecatedUpdateGridOption('floatingFiltersHeight', headerHeight);
  }
  setPivotHeaderHeight(headerHeight) {
    this.deprecatedUpdateGridOption('pivotHeaderHeight', headerHeight);
  }
  setPivotGroupHeaderHeight(headerHeight) {
    this.deprecatedUpdateGridOption('pivotGroupHeaderHeight', headerHeight);
  }
  setAnimateRows(animateRows) {
    this.deprecatedUpdateGridOption('animateRows', animateRows);
  }
  setIsExternalFilterPresent(isExternalFilterPresentFunc) {
    this.deprecatedUpdateGridOption('isExternalFilterPresent', isExternalFilterPresentFunc);
  }
  setDoesExternalFilterPass(doesExternalFilterPassFunc) {
    this.deprecatedUpdateGridOption('doesExternalFilterPass', doesExternalFilterPassFunc);
  }
  setNavigateToNextCell(navigateToNextCellFunc) {
    this.deprecatedUpdateGridOption('navigateToNextCell', navigateToNextCellFunc);
  }
  setTabToNextCell(tabToNextCellFunc) {
    this.deprecatedUpdateGridOption('tabToNextCell', tabToNextCellFunc);
  }
  setTabToNextHeader(tabToNextHeaderFunc) {
    this.deprecatedUpdateGridOption('tabToNextHeader', tabToNextHeaderFunc);
  }
  setNavigateToNextHeader(navigateToNextHeaderFunc) {
    this.deprecatedUpdateGridOption('navigateToNextHeader', navigateToNextHeaderFunc);
  }
  setRowGroupPanelShow(rowGroupPanelShow) {
    this.deprecatedUpdateGridOption('rowGroupPanelShow', rowGroupPanelShow);
  }
  setGetGroupRowAgg(getGroupRowAggFunc) {
    this.deprecatedUpdateGridOption('getGroupRowAgg', getGroupRowAggFunc);
  }
  setGetBusinessKeyForNode(getBusinessKeyForNodeFunc) {
    this.deprecatedUpdateGridOption('getBusinessKeyForNode', getBusinessKeyForNodeFunc);
  }
  setGetChildCount(getChildCountFunc) {
    this.deprecatedUpdateGridOption('getChildCount', getChildCountFunc);
  }
  setProcessRowPostCreate(processRowPostCreateFunc) {
    this.deprecatedUpdateGridOption('processRowPostCreate', processRowPostCreateFunc);
  }
  setGetRowId(getRowIdFunc) {
    warnOnce(`getRowId is a static property and can no longer be updated.`);
  }
  setGetRowClass(rowClassFunc) {
    this.deprecatedUpdateGridOption('getRowClass', rowClassFunc);
  }
  setIsFullWidthRow(isFullWidthRowFunc) {
    this.deprecatedUpdateGridOption('isFullWidthRow', isFullWidthRowFunc);
  }
  setIsRowSelectable(isRowSelectableFunc) {
    this.deprecatedUpdateGridOption('isRowSelectable', isRowSelectableFunc);
  }
  setIsRowMaster(isRowMasterFunc) {
    this.deprecatedUpdateGridOption('isRowMaster', isRowMasterFunc);
  }
  setPostSortRows(postSortRowsFunc) {
    this.deprecatedUpdateGridOption('postSortRows', postSortRowsFunc);
  }
  setGetDocument(getDocumentFunc) {
    this.deprecatedUpdateGridOption('getDocument', getDocumentFunc);
  }
  setGetContextMenuItems(getContextMenuItemsFunc) {
    this.deprecatedUpdateGridOption('getContextMenuItems', getContextMenuItemsFunc);
  }
  setGetMainMenuItems(getMainMenuItemsFunc) {
    this.deprecatedUpdateGridOption('getMainMenuItems', getMainMenuItemsFunc);
  }
  setProcessCellForClipboard(processCellForClipboardFunc) {
    this.deprecatedUpdateGridOption('processCellForClipboard', processCellForClipboardFunc);
  }
  setSendToClipboard(sendToClipboardFunc) {
    this.deprecatedUpdateGridOption('sendToClipboard', sendToClipboardFunc);
  }
  setProcessCellFromClipboard(processCellFromClipboardFunc) {
    this.deprecatedUpdateGridOption('processCellFromClipboard', processCellFromClipboardFunc);
  }
  setProcessPivotResultColDef(processPivotResultColDefFunc) {
    this.deprecatedUpdateGridOption('processPivotResultColDef', processPivotResultColDefFunc);
  }
  setProcessPivotResultColGroupDef(processPivotResultColGroupDefFunc) {
    this.deprecatedUpdateGridOption('processPivotResultColGroupDef', processPivotResultColGroupDefFunc);
  }
  setPostProcessPopup(postProcessPopupFunc) {
    this.deprecatedUpdateGridOption('postProcessPopup', postProcessPopupFunc);
  }
  setInitialGroupOrderComparator(initialGroupOrderComparatorFunc) {
    this.deprecatedUpdateGridOption('initialGroupOrderComparator', initialGroupOrderComparatorFunc);
  }
  setGetChartToolbarItems(getChartToolbarItemsFunc) {
    this.deprecatedUpdateGridOption('getChartToolbarItems', getChartToolbarItemsFunc);
  }
  setPaginationNumberFormatter(paginationNumberFormatterFunc) {
    this.deprecatedUpdateGridOption('paginationNumberFormatter', paginationNumberFormatterFunc);
  }
  setGetServerSideGroupLevelParams(getServerSideGroupLevelParamsFunc) {
    this.deprecatedUpdateGridOption('getServerSideGroupLevelParams', getServerSideGroupLevelParamsFunc);
  }
  setIsServerSideGroupOpenByDefault(isServerSideGroupOpenByDefaultFunc) {
    this.deprecatedUpdateGridOption('isServerSideGroupOpenByDefault', isServerSideGroupOpenByDefaultFunc);
  }
  setIsApplyServerSideTransaction(isApplyServerSideTransactionFunc) {
    this.deprecatedUpdateGridOption('isApplyServerSideTransaction', isApplyServerSideTransactionFunc);
  }
  setIsServerSideGroup(isServerSideGroupFunc) {
    this.deprecatedUpdateGridOption('isServerSideGroup', isServerSideGroupFunc);
  }
  setGetServerSideGroupKey(getServerSideGroupKeyFunc) {
    this.deprecatedUpdateGridOption('getServerSideGroupKey', getServerSideGroupKeyFunc);
  }
  setGetRowStyle(rowStyleFunc) {
    this.deprecatedUpdateGridOption('getRowStyle', rowStyleFunc);
  }
  setGetRowHeight(rowHeightFunc) {
    this.deprecatedUpdateGridOption('getRowHeight', rowHeightFunc);
  }
};
__decorate([Optional('csvCreator')], GridApi.prototype, "csvCreator", void 0);
__decorate([Optional('excelCreator')], GridApi.prototype, "excelCreator", void 0);
__decorate([Autowired('rowRenderer')], GridApi.prototype, "rowRenderer", void 0);
__decorate([Autowired('navigationService')], GridApi.prototype, "navigationService", void 0);
__decorate([Autowired('filterManager')], GridApi.prototype, "filterManager", void 0);
__decorate([Autowired('columnModel')], GridApi.prototype, "columnModel", void 0);
__decorate([Autowired('selectionService')], GridApi.prototype, "selectionService", void 0);
__decorate([Autowired('gridOptionsService')], GridApi.prototype, "gos", void 0);
__decorate([Autowired('valueService')], GridApi.prototype, "valueService", void 0);
__decorate([Autowired('alignedGridsService')], GridApi.prototype, "alignedGridsService", void 0);
__decorate([Autowired('eventService')], GridApi.prototype, "eventService", void 0);
__decorate([Autowired('pinnedRowModel')], GridApi.prototype, "pinnedRowModel", void 0);
__decorate([Autowired('context')], GridApi.prototype, "context", void 0);
__decorate([Autowired('rowModel')], GridApi.prototype, "rowModel", void 0);
__decorate([Autowired('sortController')], GridApi.prototype, "sortController", void 0);
__decorate([Autowired('paginationProxy')], GridApi.prototype, "paginationProxy", void 0);
__decorate([Autowired('focusService')], GridApi.prototype, "focusService", void 0);
__decorate([Autowired('dragAndDropService')], GridApi.prototype, "dragAndDropService", void 0);
__decorate([Optional('rangeService')], GridApi.prototype, "rangeService", void 0);
__decorate([Optional('clipboardService')], GridApi.prototype, "clipboardService", void 0);
__decorate([Optional('aggFuncService')], GridApi.prototype, "aggFuncService", void 0);
__decorate([Autowired('menuFactory')], GridApi.prototype, "menuFactory", void 0);
__decorate([Optional('contextMenuFactory')], GridApi.prototype, "contextMenuFactory", void 0);
__decorate([Autowired('valueCache')], GridApi.prototype, "valueCache", void 0);
__decorate([Autowired('animationFrameService')], GridApi.prototype, "animationFrameService", void 0);
__decorate([Optional('statusBarService')], GridApi.prototype, "statusBarService", void 0);
__decorate([Optional('chartService')], GridApi.prototype, "chartService", void 0);
__decorate([Optional('undoRedoService')], GridApi.prototype, "undoRedoService", void 0);
__decorate([Optional('rowNodeBlockLoader')], GridApi.prototype, "rowNodeBlockLoader", void 0);
__decorate([Optional('ssrmTransactionManager')], GridApi.prototype, "serverSideTransactionManager", void 0);
__decorate([Autowired('ctrlsService')], GridApi.prototype, "ctrlsService", void 0);
__decorate([Autowired('overlayService')], GridApi.prototype, "overlayService", void 0);
__decorate([Optional('sideBarService')], GridApi.prototype, "sideBarService", void 0);
__decorate([Autowired('stateService')], GridApi.prototype, "stateService", void 0);
__decorate([Autowired('expansionService')], GridApi.prototype, "expansionService", void 0);
__decorate([Autowired('apiEventService')], GridApi.prototype, "apiEventService", void 0);
__decorate([Autowired('frameworkOverrides')], GridApi.prototype, "frameworkOverrides", void 0);
__decorate([PostConstruct], GridApi.prototype, "init", null);
GridApi = __decorate([Bean('gridApi')], GridApi);
export { GridApi };