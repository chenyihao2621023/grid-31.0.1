import { BeanStub } from "../../context/beanStub";
import { RowNode } from "../../entities/rowNode";
import { RowHighlightPosition } from "../../interfaces/iRowNode";
import { Events } from "../../events";
import { RowContainerType } from "../../gridBodyComp/rowContainer/rowContainerCtrl";
import { ModuleNames } from "../../modules/moduleNames";
import { ModuleRegistry } from "../../modules/moduleRegistry";
import { setAriaExpanded, setAriaLabel, setAriaRowIndex, setAriaSelected } from "../../utils/aria";
import { isElementChildOfClass } from "../../utils/dom";
import { isStopPropagationForZingGrid } from "../../utils/event";
import { warnOnce, executeNextVMTurn } from "../../utils/function";
import { exists, makeNull } from "../../utils/generic";
import { escapeString } from "../../utils/string";
import { CellCtrl } from "../cell/cellCtrl";
import { RowDragComp } from "./rowDragComp";
var RowType;
(function (RowType) {
  RowType["Normal"] = "Normal";
  RowType["FullWidth"] = "FullWidth";
  RowType["FullWidthLoading"] = "FullWidthLoading";
  RowType["FullWidthGroup"] = "FullWidthGroup";
  RowType["FullWidthDetail"] = "FullWidthDetail";
})(RowType || (RowType = {}));
let instanceIdSequence = 0;
export class RowCtrl extends BeanStub {
  constructor(rowNode, beans, animateIn, useAnimationFrameForCreate, printLayout) {
    super();
    this.allRowGuis = [];
    this.active = true;
    this.centerCellCtrls = {
      list: [],
      map: {}
    };
    this.leftCellCtrls = {
      list: [],
      map: {}
    };
    this.rightCellCtrls = {
      list: [],
      map: {}
    };
    this.slideInAnimation = {
      left: false,
      center: false,
      right: false,
      fullWidth: false
    };
    this.fadeInAnimation = {
      left: false,
      center: false,
      right: false,
      fullWidth: false
    };
    this.rowDragComps = [];
    this.lastMouseDownOnDragger = false;
    this.emptyStyle = {};
    this.updateColumnListsPending = false;
    this.rowId = null;
    this.businessKeySanitised = null;
    this.beans = beans;
    this.gridOptionsService = beans.gridOptionsService;
    this.rowNode = rowNode;
    this.paginationPage = beans.paginationProxy.getCurrentPage();
    this.useAnimationFrameForCreate = useAnimationFrameForCreate;
    this.printLayout = printLayout;
    this.instanceId = rowNode.id + '-' + instanceIdSequence++;
    this.rowId = escapeString(rowNode.id);
    this.initRowBusinessKey();
    this.rowFocused = beans.focusService.isRowFocused(this.rowNode.rowIndex, this.rowNode.rowPinned);
    this.rowLevel = beans.rowCssClassCalculator.calculateRowLevel(this.rowNode);
    this.setRowType();
    this.setAnimateFlags(animateIn);
    this.rowStyles = this.processStylesFromGridOptions();
    if (this.isFullWidth() && !this.gridOptionsService.get('suppressCellFocus')) {
      this.tabIndex = -1;
    }
    this.addListeners();
  }
  initRowBusinessKey() {
    this.businessKeyForNodeFunc = this.gridOptionsService.get('getBusinessKeyForNode');
    this.updateRowBusinessKey();
  }
  updateRowBusinessKey() {
    if (typeof this.businessKeyForNodeFunc !== 'function') {
      return;
    }
    const businessKey = this.businessKeyForNodeFunc(this.rowNode);
    this.businessKeySanitised = escapeString(businessKey);
  }
  getRowId() {
    return this.rowId;
  }
  getRowStyles() {
    return this.rowStyles;
  }
  getTabIndex() {
    return this.tabIndex;
  }
  isSticky() {
    return this.rowNode.sticky;
  }
  getBeans() {
    return this.beans;
  }
  getInstanceId() {
    return this.instanceId;
  }
  setComp(rowComp, element, containerType) {
    const gui = {
      rowComp,
      element,
      containerType
    };
    this.allRowGuis.push(gui);
    if (containerType === RowContainerType.LEFT) {
      this.leftGui = gui;
    } else if (containerType === RowContainerType.RIGHT) {
      this.rightGui = gui;
    } else if (containerType === RowContainerType.FULL_WIDTH) {
      this.fullWidthGui = gui;
    } else {
      this.centerGui = gui;
    }
    this.initialiseRowComp(gui);
    if (this.rowType !== 'FullWidthLoading' && !this.rowNode.rowPinned) {
      this.beans.rowRenderer.dispatchFirstDataRenderedEvent();
    }
  }
  unsetComp(containerType) {
    this.allRowGuis = this.allRowGuis.filter(rowGui => rowGui.containerType !== containerType);
    switch (containerType) {
      case RowContainerType.LEFT:
        this.leftGui = undefined;
        break;
      case RowContainerType.RIGHT:
        this.rightGui = undefined;
        break;
      case RowContainerType.FULL_WIDTH:
        this.fullWidthGui = undefined;
        break;
      case RowContainerType.CENTER:
        this.centerGui = undefined;
        break;
      default:
    }
  }
  isCacheable() {
    return this.rowType === RowType.FullWidthDetail && this.gridOptionsService.get('keepDetailRows');
  }
  setCached(cached) {
    const displayValue = cached ? 'none' : '';
    this.allRowGuis.forEach(rg => rg.element.style.display = displayValue);
  }
  initialiseRowComp(gui) {
    const gos = this.gridOptionsService;
    this.listenOnDomOrder(gui);
    if (this.beans.columnModel.wasAutoRowHeightEverActive()) {
      this.rowNode.checkAutoHeights();
    }
    this.onRowHeightChanged(gui);
    this.updateRowIndexes(gui);
    this.setFocusedClasses(gui);
    this.setStylesFromGridOptions(false, gui);
    if (gos.isRowSelection() && this.rowNode.selectable) {
      this.onRowSelected(gui);
    }
    this.updateColumnLists(!this.useAnimationFrameForCreate);
    const comp = gui.rowComp;
    const initialRowClasses = this.getInitialRowClasses(gui.containerType);
    initialRowClasses.forEach(name => comp.addOrRemoveCssClass(name, true));
    this.executeSlideAndFadeAnimations(gui);
    if (this.rowNode.group) {
      setAriaExpanded(gui.element, this.rowNode.expanded == true);
    }
    this.setRowCompRowId(comp);
    this.setRowCompRowBusinessKey(comp);
    gos.setDomData(gui.element, RowCtrl.DOM_DATA_KEY_ROW_CTRL, this);
    this.addDestroyFunc(() => gos.setDomData(gui.element, RowCtrl.DOM_DATA_KEY_ROW_CTRL, null));
    if (this.useAnimationFrameForCreate) {
      this.beans.animationFrameService.createTask(this.addHoverFunctionality.bind(this, gui.element), this.rowNode.rowIndex, 'createTasksP2');
    } else {
      this.addHoverFunctionality(gui.element);
    }
    if (this.isFullWidth()) {
      this.setupFullWidth(gui);
    }
    if (gos.get('rowDragEntireRow')) {
      this.addRowDraggerToRow(gui);
    }
    if (this.useAnimationFrameForCreate) {
      this.beans.animationFrameService.addDestroyTask(() => {
        if (!this.isAlive()) {
          return;
        }
        gui.rowComp.addOrRemoveCssClass('zing-after-created', true);
      });
    }
    this.executeProcessRowPostCreateFunc();
  }
  setRowCompRowBusinessKey(comp) {
    if (this.businessKeySanitised == null) {
      return;
    }
    comp.setRowBusinessKey(this.businessKeySanitised);
  }
  getBusinessKey() {
    return this.businessKeySanitised;
  }
  setRowCompRowId(comp) {
    this.rowId = escapeString(this.rowNode.id);
    if (this.rowId == null) {
      return;
    }
    comp.setRowId(this.rowId);
  }
  executeSlideAndFadeAnimations(gui) {
    const {
      containerType
    } = gui;
    const shouldSlide = this.slideInAnimation[containerType];
    if (shouldSlide) {
      executeNextVMTurn(() => {
        this.onTopChanged();
      });
      this.slideInAnimation[containerType] = false;
    }
    const shouldFade = this.fadeInAnimation[containerType];
    if (shouldFade) {
      executeNextVMTurn(() => {
        gui.rowComp.addOrRemoveCssClass('zing-opacity-zero', false);
      });
      this.fadeInAnimation[containerType] = false;
    }
  }
  addRowDraggerToRow(gui) {
    if (this.gridOptionsService.get('enableRangeSelection')) {
      warnOnce('Setting `rowDragEntireRow: true` in the gridOptions doesn\'t work with `enableRangeSelection: true`');
      return;
    }
    const translate = this.beans.localeService.getLocaleTextFunc();
    const rowDragComp = new RowDragComp(() => `1 ${translate('rowDragRow', 'row')}`, this.rowNode, undefined, gui.element, undefined, true);
    const rowDragBean = this.createBean(rowDragComp, this.beans.context);
    this.rowDragComps.push(rowDragBean);
  }
  setupFullWidth(gui) {
    const pinned = this.getPinnedForContainer(gui.containerType);
    const params = this.createFullWidthParams(gui.element, pinned);
    if (this.rowType == RowType.FullWidthDetail) {
      if (!ModuleRegistry.__assertRegistered(ModuleNames.MasterDetailModule, "cell renderer 'zingDetailCellRenderer' (for master detail)", this.beans.context.getGridId())) {
        return;
      }
    }
    let compDetails;
    switch (this.rowType) {
      case RowType.FullWidthDetail:
        compDetails = this.beans.userComponentFactory.getFullWidthDetailCellRendererDetails(params);
        break;
      case RowType.FullWidthGroup:
        compDetails = this.beans.userComponentFactory.getFullWidthGroupCellRendererDetails(params);
        break;
      case RowType.FullWidthLoading:
        compDetails = this.beans.userComponentFactory.getFullWidthLoadingCellRendererDetails(params);
        break;
      default:
        compDetails = this.beans.userComponentFactory.getFullWidthCellRendererDetails(params);
        break;
    }
    gui.rowComp.showFullWidth(compDetails);
  }
  isPrintLayout() {
    return this.printLayout;
  }
  getFullWidthCellRenderer() {
    var _a, _b;
    return (_b = (_a = this.fullWidthGui) === null || _a === void 0 ? void 0 : _a.rowComp) === null || _b === void 0 ? void 0 : _b.getFullWidthCellRenderer();
  }
  getCellElement(column) {
    const cellCtrl = this.getCellCtrl(column);
    return cellCtrl ? cellCtrl.getGui() : null;
  }
  executeProcessRowPostCreateFunc() {
    const func = this.gridOptionsService.getCallback('processRowPostCreate');
    if (!func || !this.areAllContainersReady()) {
      return;
    }
    const params = {
      eRow: this.centerGui.element,
      ePinnedLeftRow: this.leftGui ? this.leftGui.element : undefined,
      ePinnedRightRow: this.rightGui ? this.rightGui.element : undefined,
      node: this.rowNode,
      rowIndex: this.rowNode.rowIndex,
      addRenderedRowListener: this.addEventListener.bind(this)
    };
    func(params);
  }
  areAllContainersReady() {
    const isLeftReady = !!this.leftGui || !this.beans.columnModel.isPinningLeft();
    const isCenterReady = !!this.centerGui;
    const isRightReady = !!this.rightGui || !this.beans.columnModel.isPinningRight();
    return isLeftReady && isCenterReady && isRightReady;
  }
  setRowType() {
    const isStub = this.rowNode.stub;
    const isFullWidthCell = this.rowNode.isFullWidthCell();
    const isDetailCell = this.gridOptionsService.get('masterDetail') && this.rowNode.detail;
    const pivotMode = this.beans.columnModel.isPivotMode();
    const isGroupRow = !!this.rowNode.group && !this.rowNode.footer;
    const isFullWidthGroup = isGroupRow && this.gridOptionsService.isGroupUseEntireRow(pivotMode);
    if (isStub) {
      this.rowType = RowType.FullWidthLoading;
    } else if (isDetailCell) {
      this.rowType = RowType.FullWidthDetail;
    } else if (isFullWidthCell) {
      this.rowType = RowType.FullWidth;
    } else if (isFullWidthGroup) {
      this.rowType = RowType.FullWidthGroup;
    } else {
      this.rowType = RowType.Normal;
    }
  }
  updateColumnLists(suppressAnimationFrame = false, useFlushSync = false) {
    if (this.isFullWidth()) {
      return;
    }
    const noAnimation = suppressAnimationFrame || this.gridOptionsService.get('suppressAnimationFrame') || this.printLayout;
    if (noAnimation) {
      this.updateColumnListsImpl(useFlushSync);
      return;
    }
    if (this.updateColumnListsPending) {
      return;
    }
    this.beans.animationFrameService.createTask(() => {
      if (!this.active) {
        return;
      }
      this.updateColumnListsImpl(true);
    }, this.rowNode.rowIndex, 'createTasksP1');
    this.updateColumnListsPending = true;
  }
  createCellCtrls(prev, cols, pinned = null) {
    const res = {
      list: [],
      map: {}
    };
    const addCell = (colInstanceId, cellCtrl) => {
      res.list.push(cellCtrl);
      res.map[colInstanceId] = cellCtrl;
    };
    cols.forEach(col => {
      const colInstanceId = col.getInstanceId();
      let cellCtrl = prev.map[colInstanceId];
      if (!cellCtrl) {
        cellCtrl = new CellCtrl(col, this.rowNode, this.beans, this);
      }
      addCell(colInstanceId, cellCtrl);
    });
    prev.list.forEach(prevCellCtrl => {
      const cellInResult = res.map[prevCellCtrl.getColumn().getInstanceId()] != null;
      if (cellInResult) {
        return;
      }
      const keepCell = !this.isCellEligibleToBeRemoved(prevCellCtrl, pinned);
      if (keepCell) {
        addCell(prevCellCtrl.getColumn().getInstanceId(), prevCellCtrl);
        return;
      }
      prevCellCtrl.destroy();
    });
    return res;
  }
  updateColumnListsImpl(useFlushSync) {
    this.updateColumnListsPending = false;
    this.createAllCellCtrls();
    this.setCellCtrls(useFlushSync);
  }
  setCellCtrls(useFlushSync) {
    this.allRowGuis.forEach(item => {
      const cellControls = this.getCellCtrlsForContainer(item.containerType);
      item.rowComp.setCellCtrls(cellControls, useFlushSync);
    });
  }
  getCellCtrlsForContainer(containerType) {
    switch (containerType) {
      case RowContainerType.LEFT:
        return this.leftCellCtrls.list;
      case RowContainerType.RIGHT:
        return this.rightCellCtrls.list;
      case RowContainerType.FULL_WIDTH:
        return [];
      case RowContainerType.CENTER:
        return this.centerCellCtrls.list;
      default:
        const exhaustiveCheck = containerType;
        throw new Error(`Unhandled case: ${exhaustiveCheck}`);
    }
  }
  createAllCellCtrls() {
    const columnModel = this.beans.columnModel;
    if (this.printLayout) {
      this.centerCellCtrls = this.createCellCtrls(this.centerCellCtrls, columnModel.getAllDisplayedColumns());
      this.leftCellCtrls = {
        list: [],
        map: {}
      };
      this.rightCellCtrls = {
        list: [],
        map: {}
      };
    } else {
      const centerCols = columnModel.getViewportCenterColumnsForRow(this.rowNode);
      this.centerCellCtrls = this.createCellCtrls(this.centerCellCtrls, centerCols);
      const leftCols = columnModel.getDisplayedLeftColumnsForRow(this.rowNode);
      this.leftCellCtrls = this.createCellCtrls(this.leftCellCtrls, leftCols, 'left');
      const rightCols = columnModel.getDisplayedRightColumnsForRow(this.rowNode);
      this.rightCellCtrls = this.createCellCtrls(this.rightCellCtrls, rightCols, 'right');
    }
  }
  isCellEligibleToBeRemoved(cellCtrl, nextContainerPinned) {
    const REMOVE_CELL = true;
    const KEEP_CELL = false;
    const column = cellCtrl.getColumn();
    if (column.getPinned() != nextContainerPinned) {
      return REMOVE_CELL;
    }
    const editing = cellCtrl.isEditing();
    const focused = this.beans.focusService.isCellFocused(cellCtrl.getCellPosition());
    const mightWantToKeepCell = editing || focused;
    if (mightWantToKeepCell) {
      const column = cellCtrl.getColumn();
      const displayedColumns = this.beans.columnModel.getAllDisplayedColumns();
      const cellStillDisplayed = displayedColumns.indexOf(column) >= 0;
      return cellStillDisplayed ? KEEP_CELL : REMOVE_CELL;
    }
    return REMOVE_CELL;
  }
  getDomOrder() {
    const isEnsureDomOrder = this.gridOptionsService.get('ensureDomOrder');
    return isEnsureDomOrder || this.gridOptionsService.isDomLayout('print');
  }
  listenOnDomOrder(gui) {
    const listener = () => {
      gui.rowComp.setDomOrder(this.getDomOrder());
    };
    this.addManagedPropertyListener('domLayout', listener);
    this.addManagedPropertyListener('ensureDomOrder', listener);
  }
  setAnimateFlags(animateIn) {
    if (this.isSticky() || !animateIn) {
      return;
    }
    const oldRowTopExists = exists(this.rowNode.oldRowTop);
    const pinningLeft = this.beans.columnModel.isPinningLeft();
    const pinningRight = this.beans.columnModel.isPinningRight();
    if (oldRowTopExists) {
      if (this.isFullWidth() && !this.gridOptionsService.get('embedFullWidthRows')) {
        this.slideInAnimation.fullWidth = true;
        return;
      }
      this.slideInAnimation.center = true;
      this.slideInAnimation.left = pinningLeft;
      this.slideInAnimation.right = pinningRight;
    } else {
      if (this.isFullWidth() && !this.gridOptionsService.get('embedFullWidthRows')) {
        this.fadeInAnimation.fullWidth = true;
        return;
      }
      this.fadeInAnimation.center = true;
      this.fadeInAnimation.left = pinningLeft;
      this.fadeInAnimation.right = pinningRight;
    }
  }
  isEditing() {
    return this.editingRow;
  }
  stopRowEditing(cancel) {
    this.stopEditing(cancel);
  }
  isFullWidth() {
    return this.rowType !== RowType.Normal;
  }
  getRowType() {
    return this.rowType;
  }
  refreshFullWidth() {
    const tryRefresh = (gui, pinned) => {
      if (!gui) {
        return true;
      }
      const cellRenderer = gui.rowComp.getFullWidthCellRenderer();
      if (!cellRenderer) {
        return false;
      }
      if (!cellRenderer.refresh) {
        return false;
      }
      const params = this.createFullWidthParams(gui.element, pinned);
      const refreshSucceeded = cellRenderer.refresh(params);
      return refreshSucceeded;
    };
    const fullWidthSuccess = tryRefresh(this.fullWidthGui, null);
    const centerSuccess = tryRefresh(this.centerGui, null);
    const leftSuccess = tryRefresh(this.leftGui, 'left');
    const rightSuccess = tryRefresh(this.rightGui, 'right');
    const allFullWidthRowsRefreshed = fullWidthSuccess && centerSuccess && leftSuccess && rightSuccess;
    return allFullWidthRowsRefreshed;
  }
  addListeners() {
    this.addManagedListener(this.rowNode, RowNode.EVENT_HEIGHT_CHANGED, () => this.onRowHeightChanged());
    this.addManagedListener(this.rowNode, RowNode.EVENT_ROW_SELECTED, () => this.onRowSelected());
    this.addManagedListener(this.rowNode, RowNode.EVENT_ROW_INDEX_CHANGED, this.onRowIndexChanged.bind(this));
    this.addManagedListener(this.rowNode, RowNode.EVENT_TOP_CHANGED, this.onTopChanged.bind(this));
    this.addManagedListener(this.rowNode, RowNode.EVENT_EXPANDED_CHANGED, this.updateExpandedCss.bind(this));
    this.addManagedListener(this.rowNode, RowNode.EVENT_HAS_CHILDREN_CHANGED, this.updateExpandedCss.bind(this));
    if (this.rowNode.detail) {
      this.addManagedListener(this.rowNode.parent, RowNode.EVENT_DATA_CHANGED, this.onRowNodeDataChanged.bind(this));
    }
    this.addManagedListener(this.rowNode, RowNode.EVENT_DATA_CHANGED, this.onRowNodeDataChanged.bind(this));
    this.addManagedListener(this.rowNode, RowNode.EVENT_CELL_CHANGED, this.onRowNodeCellChanged.bind(this));
    this.addManagedListener(this.rowNode, RowNode.EVENT_HIGHLIGHT_CHANGED, this.onRowNodeHighlightChanged.bind(this));
    this.addManagedListener(this.rowNode, RowNode.EVENT_DRAGGING_CHANGED, this.onRowNodeDraggingChanged.bind(this));
    this.addManagedListener(this.rowNode, RowNode.EVENT_UI_LEVEL_CHANGED, this.onUiLevelChanged.bind(this));
    const eventService = this.beans.eventService;
    this.addManagedListener(eventService, Events.EVENT_PAGINATION_PIXEL_OFFSET_CHANGED, this.onPaginationPixelOffsetChanged.bind(this));
    this.addManagedListener(eventService, Events.EVENT_HEIGHT_SCALE_CHANGED, this.onTopChanged.bind(this));
    this.addManagedListener(eventService, Events.EVENT_DISPLAYED_COLUMNS_CHANGED, this.onDisplayedColumnsChanged.bind(this));
    this.addManagedListener(eventService, Events.EVENT_VIRTUAL_COLUMNS_CHANGED, this.onVirtualColumnsChanged.bind(this));
    this.addManagedListener(eventService, Events.EVENT_CELL_FOCUSED, this.onCellFocused.bind(this));
    this.addManagedListener(eventService, Events.EVENT_CELL_FOCUS_CLEARED, this.onCellFocusCleared.bind(this));
    this.addManagedListener(eventService, Events.EVENT_PAGINATION_CHANGED, this.onPaginationChanged.bind(this));
    this.addManagedListener(eventService, Events.EVENT_MODEL_UPDATED, this.onModelUpdated.bind(this));
    this.addManagedListener(eventService, Events.EVENT_COLUMN_MOVED, this.onColumnMoved.bind(this));
    this.addDestroyFunc(() => {
      this.destroyBeans(this.rowDragComps, this.beans.context);
    });
    this.addManagedPropertyListeners(['rowDragEntireRow'], () => {
      const useRowDragEntireRow = this.gridOptionsService.get('rowDragEntireRow');
      if (useRowDragEntireRow) {
        this.allRowGuis.forEach(gui => {
          this.addRowDraggerToRow(gui);
        });
        return;
      }
      this.destroyBeans(this.rowDragComps, this.beans.context);
      this.rowDragComps = [];
    });
    this.addListenersForCellComps();
  }
  onColumnMoved() {
    this.updateColumnLists();
  }
  addListenersForCellComps() {
    this.addManagedListener(this.rowNode, RowNode.EVENT_ROW_INDEX_CHANGED, () => {
      this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onRowIndexChanged());
    });
    this.addManagedListener(this.rowNode, RowNode.EVENT_CELL_CHANGED, event => {
      this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.onCellChanged(event));
    });
  }
  onRowNodeDataChanged(event) {
    const fullWidthChanged = this.isFullWidth() !== !!this.rowNode.isFullWidthCell();
    if (fullWidthChanged) {
      this.beans.rowRenderer.redrawRow(this.rowNode);
      return;
    }
    if (this.isFullWidth()) {
      const refresh = this.refreshFullWidth();
      if (!refresh) {
        this.beans.rowRenderer.redrawRow(this.rowNode);
      }
      return;
    }
    this.getAllCellCtrls().forEach(cellCtrl => cellCtrl.refreshCell({
      suppressFlash: !event.update,
      newData: !event.update
    }));
    this.allRowGuis.forEach(gui => {
      this.setRowCompRowId(gui.rowComp);
      this.updateRowBusinessKey();
      this.setRowCompRowBusinessKey(gui.rowComp);
    });
    this.onRowSelected();
    this.postProcessCss();
  }
  onRowNodeCellChanged() {
    this.postProcessCss();
  }
  postProcessCss() {
    this.setStylesFromGridOptions(true);
    this.postProcessClassesFromGridOptions();
    this.postProcessRowClassRules();
    this.postProcessRowDragging();
  }
  onRowNodeHighlightChanged() {
    const highlighted = this.rowNode.highlighted;
    this.allRowGuis.forEach(gui => {
      const aboveOn = highlighted === RowHighlightPosition.Above;
      const belowOn = highlighted === RowHighlightPosition.Below;
      gui.rowComp.addOrRemoveCssClass('zing-row-highlight-above', aboveOn);
      gui.rowComp.addOrRemoveCssClass('zing-row-highlight-below', belowOn);
    });
  }
  onRowNodeDraggingChanged() {
    this.postProcessRowDragging();
  }
  postProcessRowDragging() {
    const dragging = this.rowNode.dragging;
    this.allRowGuis.forEach(gui => gui.rowComp.addOrRemoveCssClass('zing-row-dragging', dragging));
  }
  updateExpandedCss() {
    const expandable = this.rowNode.isExpandable();
    const expanded = this.rowNode.expanded == true;
    this.allRowGuis.forEach(gui => {
      gui.rowComp.addOrRemoveCssClass('zing-row-group', expandable);
      gui.rowComp.addOrRemoveCssClass('zing-row-group-expanded', expandable && expanded);
      gui.rowComp.addOrRemoveCssClass('zing-row-group-contracted', expandable && !expanded);
      setAriaExpanded(gui.element, expandable && expanded);
    });
  }
  onDisplayedColumnsChanged() {
    this.updateColumnLists(true);
    if (this.beans.columnModel.wasAutoRowHeightEverActive()) {
      this.rowNode.checkAutoHeights();
    }
  }
  onVirtualColumnsChanged() {
    this.updateColumnLists(false, true);
  }
  getRowPosition() {
    return {
      rowPinned: makeNull(this.rowNode.rowPinned),
      rowIndex: this.rowNode.rowIndex
    };
  }
  onKeyboardNavigate(keyboardEvent) {
    const currentFullWidthComp = this.allRowGuis.find(c => c.element.contains(keyboardEvent.target));
    const currentFullWidthContainer = currentFullWidthComp ? currentFullWidthComp.element : null;
    const isFullWidthContainerFocused = currentFullWidthContainer === keyboardEvent.target;
    if (!isFullWidthContainerFocused) {
      return;
    }
    const node = this.rowNode;
    const lastFocusedCell = this.beans.focusService.getFocusedCell();
    const cellPosition = {
      rowIndex: node.rowIndex,
      rowPinned: node.rowPinned,
      column: lastFocusedCell && lastFocusedCell.column
    };
    this.beans.navigationService.navigateToNextCell(keyboardEvent, keyboardEvent.key, cellPosition, true);
    keyboardEvent.preventDefault();
  }
  onTabKeyDown(keyboardEvent) {
    if (keyboardEvent.defaultPrevented || isStopPropagationForZingGrid(keyboardEvent)) {
      return;
    }
    const currentFullWidthComp = this.allRowGuis.find(c => c.element.contains(keyboardEvent.target));
    const currentFullWidthContainer = currentFullWidthComp ? currentFullWidthComp.element : null;
    const isFullWidthContainerFocused = currentFullWidthContainer === keyboardEvent.target;
    let nextEl = null;
    if (!isFullWidthContainerFocused) {
      nextEl = this.beans.focusService.findNextFocusableElement(currentFullWidthContainer, false, keyboardEvent.shiftKey);
    }
    if (this.isFullWidth() && isFullWidthContainerFocused || !nextEl) {
      this.beans.navigationService.onTabKeyDown(this, keyboardEvent);
    }
  }
  onFullWidthRowFocused(event) {
    var _a;
    const node = this.rowNode;
    const isFocused = !event ? false : this.isFullWidth() && event.rowIndex === node.rowIndex && event.rowPinned == node.rowPinned;
    const element = this.fullWidthGui ? this.fullWidthGui.element : (_a = this.centerGui) === null || _a === void 0 ? void 0 : _a.element;
    if (!element) {
      return;
    }
    element.classList.toggle('zing-full-width-focus', isFocused);
    if (isFocused) {
      element.focus({
        preventScroll: true
      });
    }
  }
  refreshCell(cellCtrl) {
    this.centerCellCtrls = this.removeCellCtrl(this.centerCellCtrls, cellCtrl);
    this.leftCellCtrls = this.removeCellCtrl(this.leftCellCtrls, cellCtrl);
    this.rightCellCtrls = this.removeCellCtrl(this.rightCellCtrls, cellCtrl);
    this.updateColumnLists();
  }
  removeCellCtrl(prev, cellCtrlToRemove) {
    const res = {
      list: [],
      map: {}
    };
    prev.list.forEach(cellCtrl => {
      if (cellCtrl === cellCtrlToRemove) {
        return;
      }
      res.list.push(cellCtrl);
      res.map[cellCtrl.getInstanceId()] = cellCtrl;
    });
    return res;
  }
  onMouseEvent(eventName, mouseEvent) {
    switch (eventName) {
      case 'dblclick':
        this.onRowDblClick(mouseEvent);
        break;
      case 'click':
        this.onRowClick(mouseEvent);
        break;
      case 'touchstart':
      case 'mousedown':
        this.onRowMouseDown(mouseEvent);
        break;
    }
  }
  createRowEvent(type, domEvent) {
    return {
      type: type,
      node: this.rowNode,
      data: this.rowNode.data,
      rowIndex: this.rowNode.rowIndex,
      rowPinned: this.rowNode.rowPinned,
      context: this.gridOptionsService.context,
      api: this.gridOptionsService.api,
      columnApi: this.gridOptionsService.columnApi,
      event: domEvent
    };
  }
  createRowEventWithSource(type, domEvent) {
    const event = this.createRowEvent(type, domEvent);
    event.source = this;
    return event;
  }
  onRowDblClick(mouseEvent) {
    if (isStopPropagationForZingGrid(mouseEvent)) {
      return;
    }
    const zingEvent = this.createRowEventWithSource(Events.EVENT_ROW_DOUBLE_CLICKED, mouseEvent);
    this.beans.eventService.dispatchEvent(zingEvent);
  }
  onRowMouseDown(mouseEvent) {
    this.lastMouseDownOnDragger = isElementChildOfClass(mouseEvent.target, 'zing-row-drag', 3);
    if (!this.isFullWidth()) {
      return;
    }
    const node = this.rowNode;
    const columnModel = this.beans.columnModel;
    if (this.beans.rangeService) {
      this.beans.rangeService.removeAllCellRanges();
    }
    this.beans.focusService.setFocusedCell({
      rowIndex: node.rowIndex,
      column: columnModel.getAllDisplayedColumns()[0],
      rowPinned: node.rowPinned,
      forceBrowserFocus: true
    });
  }
  onRowClick(mouseEvent) {
    const stop = isStopPropagationForZingGrid(mouseEvent) || this.lastMouseDownOnDragger;
    if (stop) {
      return;
    }
    const zingEvent = this.createRowEventWithSource(Events.EVENT_ROW_CLICKED, mouseEvent);
    this.beans.eventService.dispatchEvent(zingEvent);
    const isMultiKey = mouseEvent.ctrlKey || mouseEvent.metaKey;
    const isShiftKey = mouseEvent.shiftKey;
    const groupSelectsChildren = this.gridOptionsService.get('groupSelectsChildren');
    if (groupSelectsChildren && this.rowNode.group || !this.rowNode.selectable || this.rowNode.rowPinned || !this.gridOptionsService.isRowSelection() || this.gridOptionsService.get('suppressRowClickSelection')) {
      return;
    }
    const multiSelectOnClick = this.gridOptionsService.get('rowMultiSelectWithClick');
    const rowDeselectionWithCtrl = !this.gridOptionsService.get('suppressRowDeselection');
    const source = 'rowClicked';
    if (this.rowNode.isSelected()) {
      if (multiSelectOnClick) {
        this.rowNode.setSelectedParams({
          newValue: false,
          event: mouseEvent,
          source
        });
      } else if (isMultiKey) {
        if (rowDeselectionWithCtrl) {
          this.rowNode.setSelectedParams({
            newValue: false,
            event: mouseEvent,
            source
          });
        }
      } else {
        this.rowNode.setSelectedParams({
          newValue: true,
          clearSelection: !isShiftKey,
          rangeSelect: isShiftKey,
          event: mouseEvent,
          source
        });
      }
    } else {
      const clearSelection = multiSelectOnClick ? false : !isMultiKey;
      this.rowNode.setSelectedParams({
        newValue: true,
        clearSelection: clearSelection,
        rangeSelect: isShiftKey,
        event: mouseEvent,
        source
      });
    }
  }
  setupDetailRowAutoHeight(eDetailGui) {
    console.log(11);
    if (this.rowType !== RowType.FullWidthDetail) {
      return;
    }
    if (!this.gridOptionsService.get('detailRowAutoHeight')) {
      return;
    }
    const checkRowSizeFunc = () => {
      const clientHeight = eDetailGui.clientHeight;
      if (clientHeight != null && clientHeight > 0) {
        const updateRowHeightFunc = () => {
          this.rowNode.setRowHeight(clientHeight);
          if (this.beans.clientSideRowModel) {
            this.beans.clientSideRowModel.onRowHeightChanged();
          } else if (this.beans.serverSideRowModel) {
            this.beans.serverSideRowModel.onRowHeightChanged();
          }
        };
        this.beans.frameworkOverrides.setTimeout(updateRowHeightFunc, 0);
      }
    };
    const resizeObserverDestroyFunc = this.beans.resizeObserverService.observeResize(eDetailGui, checkRowSizeFunc);
    this.addDestroyFunc(resizeObserverDestroyFunc);
    checkRowSizeFunc();
  }
  createFullWidthParams(eRow, pinned) {
    const params = {
      fullWidth: true,
      data: this.rowNode.data,
      node: this.rowNode,
      value: this.rowNode.key,
      valueFormatted: this.rowNode.key,
      rowIndex: this.rowNode.rowIndex,
      api: this.gridOptionsService.api,
      columnApi: this.gridOptionsService.columnApi,
      context: this.gridOptionsService.context,
      eGridCell: eRow,
      eParentOfValue: eRow,
      pinned: pinned,
      addRenderedRowListener: this.addEventListener.bind(this),
      registerRowDragger: (rowDraggerElement, dragStartPixels, value, suppressVisibilityChange) => this.addFullWidthRowDragging(rowDraggerElement, dragStartPixels, value, suppressVisibilityChange)
    };
    return params;
  }
  addFullWidthRowDragging(rowDraggerElement, dragStartPixels, value = '', suppressVisibilityChange) {
    if (!this.isFullWidth()) {
      return;
    }
    const rowDragComp = new RowDragComp(() => value, this.rowNode, undefined, rowDraggerElement, dragStartPixels, suppressVisibilityChange);
    this.createManagedBean(rowDragComp, this.beans.context);
  }
  onUiLevelChanged() {
    const newLevel = this.beans.rowCssClassCalculator.calculateRowLevel(this.rowNode);
    if (this.rowLevel != newLevel) {
      const classToAdd = 'zing-row-level-' + newLevel;
      const classToRemove = 'zing-row-level-' + this.rowLevel;
      this.allRowGuis.forEach(gui => {
        gui.rowComp.addOrRemoveCssClass(classToAdd, true);
        gui.rowComp.addOrRemoveCssClass(classToRemove, false);
      });
    }
    this.rowLevel = newLevel;
  }
  isFirstRowOnPage() {
    return this.rowNode.rowIndex === this.beans.paginationProxy.getPageFirstRow();
  }
  isLastRowOnPage() {
    return this.rowNode.rowIndex === this.beans.paginationProxy.getPageLastRow();
  }
  onModelUpdated() {
    this.refreshFirstAndLastRowStyles();
  }
  refreshFirstAndLastRowStyles() {
    const newFirst = this.isFirstRowOnPage();
    const newLast = this.isLastRowOnPage();
    if (this.firstRowOnPage !== newFirst) {
      this.firstRowOnPage = newFirst;
      this.allRowGuis.forEach(gui => gui.rowComp.addOrRemoveCssClass('zing-row-first', newFirst));
    }
    if (this.lastRowOnPage !== newLast) {
      this.lastRowOnPage = newLast;
      this.allRowGuis.forEach(gui => gui.rowComp.addOrRemoveCssClass('zing-row-last', newLast));
    }
  }
  stopEditing(cancel = false) {
    if (this.stoppingRowEdit) {
      return;
    }
    const cellControls = this.getAllCellCtrls();
    const isRowEdit = this.editingRow;
    this.stoppingRowEdit = true;
    let fireRowEditEvent = false;
    for (const ctrl of cellControls) {
      const valueChanged = ctrl.stopEditing(cancel);
      if (isRowEdit && !cancel && !fireRowEditEvent && valueChanged) {
        fireRowEditEvent = true;
      }
    }
    if (fireRowEditEvent) {
      const event = this.createRowEvent(Events.EVENT_ROW_VALUE_CHANGED);
      this.beans.eventService.dispatchEvent(event);
    }
    if (isRowEdit) {
      this.setEditingRow(false);
    }
    this.stoppingRowEdit = false;
  }
  setInlineEditingCss(editing) {
    this.allRowGuis.forEach(gui => {
      gui.rowComp.addOrRemoveCssClass("zing-row-inline-editing", editing);
      gui.rowComp.addOrRemoveCssClass("zing-row-not-inline-editing", !editing);
    });
  }
  setEditingRow(value) {
    this.editingRow = value;
    this.allRowGuis.forEach(gui => gui.rowComp.addOrRemoveCssClass('zing-row-editing', value));
    const event = value ? this.createRowEvent(Events.EVENT_ROW_EDITING_STARTED) : this.createRowEvent(Events.EVENT_ROW_EDITING_STOPPED);
    this.beans.eventService.dispatchEvent(event);
  }
  startRowEditing(key = null, sourceRenderedCell = null, event = null) {
    if (this.editingRow) {
      return;
    }
    const atLeastOneEditing = this.getAllCellCtrls().reduce((prev, cellCtrl) => {
      const cellStartedEdit = cellCtrl === sourceRenderedCell;
      if (cellStartedEdit) {
        cellCtrl.startEditing(key, cellStartedEdit, event);
      } else {
        cellCtrl.startEditing(null, cellStartedEdit, event);
      }
      if (prev) {
        return true;
      }
      return cellCtrl.isEditing();
    }, false);
    if (atLeastOneEditing) {
      this.setEditingRow(true);
    }
  }
  getAllCellCtrls() {
    if (this.leftCellCtrls.list.length === 0 && this.rightCellCtrls.list.length === 0) {
      return this.centerCellCtrls.list;
    }
    const res = [...this.centerCellCtrls.list, ...this.leftCellCtrls.list, ...this.rightCellCtrls.list];
    return res;
  }
  postProcessClassesFromGridOptions() {
    const cssClasses = this.beans.rowCssClassCalculator.processClassesFromGridOptions(this.rowNode);
    if (!cssClasses || !cssClasses.length) {
      return;
    }
    cssClasses.forEach(classStr => {
      this.allRowGuis.forEach(c => c.rowComp.addOrRemoveCssClass(classStr, true));
    });
  }
  postProcessRowClassRules() {
    this.beans.rowCssClassCalculator.processRowClassRules(this.rowNode, className => {
      this.allRowGuis.forEach(gui => gui.rowComp.addOrRemoveCssClass(className, true));
    }, className => {
      this.allRowGuis.forEach(gui => gui.rowComp.addOrRemoveCssClass(className, false));
    });
  }
  setStylesFromGridOptions(updateStyles, gui) {
    if (updateStyles) {
      this.rowStyles = this.processStylesFromGridOptions();
    }
    this.forEachGui(gui, gui => gui.rowComp.setUserStyles(this.rowStyles));
  }
  getPinnedForContainer(rowContainerType) {
    const pinned = rowContainerType === RowContainerType.LEFT ? 'left' : rowContainerType === RowContainerType.RIGHT ? 'right' : null;
    return pinned;
  }
  getInitialRowClasses(rowContainerType) {
    const pinned = this.getPinnedForContainer(rowContainerType);
    const params = {
      rowNode: this.rowNode,
      rowFocused: this.rowFocused,
      fadeRowIn: this.fadeInAnimation[rowContainerType],
      rowIsEven: this.rowNode.rowIndex % 2 === 0,
      rowLevel: this.rowLevel,
      fullWidthRow: this.isFullWidth(),
      firstRowOnPage: this.isFirstRowOnPage(),
      lastRowOnPage: this.isLastRowOnPage(),
      printLayout: this.printLayout,
      expandable: this.rowNode.isExpandable(),
      pinned: pinned
    };
    return this.beans.rowCssClassCalculator.getInitialRowClasses(params);
  }
  processStylesFromGridOptions() {
    const rowStyle = this.gridOptionsService.get('rowStyle');
    if (rowStyle && typeof rowStyle === 'function') {
      console.warn('ZING Grid: rowStyle should be an object of key/value styles, not be a function, use getRowStyle() instead');
      return;
    }
    const rowStyleFunc = this.gridOptionsService.getCallback('getRowStyle');
    let rowStyleFuncResult;
    if (rowStyleFunc) {
      const params = {
        data: this.rowNode.data,
        node: this.rowNode,
        rowIndex: this.rowNode.rowIndex
      };
      rowStyleFuncResult = rowStyleFunc(params);
    }
    if (rowStyleFuncResult || rowStyle) {
      return Object.assign({}, rowStyle, rowStyleFuncResult);
    }
    return this.emptyStyle;
  }
  onRowSelected(gui) {
    const selected = !!this.rowNode.isSelected();
    this.forEachGui(gui, gui => {
      gui.rowComp.addOrRemoveCssClass('zing-row-selected', selected);
      setAriaSelected(gui.element, selected ? true : undefined);
      const ariaLabel = this.createAriaLabel();
      setAriaLabel(gui.element, ariaLabel == null ? '' : ariaLabel);
    });
  }
  createAriaLabel() {
    const selected = this.rowNode.isSelected();
    if (selected && this.gridOptionsService.get('suppressRowDeselection')) {
      return undefined;
    }
    const translate = this.beans.localeService.getLocaleTextFunc();
    const label = translate(selected ? 'ariaRowDeselect' : 'ariaRowSelect', `Press SPACE to ${selected ? 'deselect' : 'select'} this row.`);
    return label;
  }
  isUseAnimationFrameForCreate() {
    return this.useAnimationFrameForCreate;
  }
  addHoverFunctionality(eRow) {
    if (!this.active) {
      return;
    }
    this.addManagedListener(eRow, 'mouseenter', () => this.rowNode.onMouseEnter());
    this.addManagedListener(eRow, 'mouseleave', () => this.rowNode.onMouseLeave());
    this.addManagedListener(this.rowNode, RowNode.EVENT_MOUSE_ENTER, () => {
      if (!this.beans.dragService.isDragging() && !this.gridOptionsService.get('suppressRowHoverHighlight')) {
        eRow.classList.add('zing-row-hover');
        this.rowNode.setHovered(true);
      }
    });
    this.addManagedListener(this.rowNode, RowNode.EVENT_MOUSE_LEAVE, () => {
      eRow.classList.remove('zing-row-hover');
      this.rowNode.setHovered(false);
    });
  }
  roundRowTopToBounds(rowTop) {
    const gridBodyCon = this.beans.ctrlsService.getGridBodyCtrl();
    const range = gridBodyCon.getScrollFeature().getVScrollPosition();
    const minPixel = this.applyPaginationOffset(range.top, true) - 100;
    const maxPixel = this.applyPaginationOffset(range.bottom, true) + 100;
    return Math.min(Math.max(minPixel, rowTop), maxPixel);
  }
  getFrameworkOverrides() {
    return this.beans.frameworkOverrides;
  }
  forEachGui(gui, callback) {
    if (gui) {
      callback(gui);
    } else {
      this.allRowGuis.forEach(callback);
    }
  }
  onRowHeightChanged(gui) {
    if (this.rowNode.rowHeight == null) {
      return;
    }
    const rowHeight = this.rowNode.rowHeight;
    const defaultRowHeight = this.beans.environment.getDefaultRowHeight();
    const isHeightFromFunc = this.gridOptionsService.isGetRowHeightFunction();
    const heightFromFunc = isHeightFromFunc ? this.gridOptionsService.getRowHeightForNode(this.rowNode).height : undefined;
    const lineHeight = heightFromFunc ? `${Math.min(defaultRowHeight, heightFromFunc) - 2}px` : undefined;
    this.forEachGui(gui, gui => {
      gui.element.style.height = `${rowHeight}px`;
      if (lineHeight) {
        gui.element.style.setProperty('--zing-line-height', lineHeight);
      }
    });
  }
  addEventListener(eventType, listener) {
    super.addEventListener(eventType, listener);
  }
  removeEventListener(eventType, listener) {
    super.removeEventListener(eventType, listener);
  }
  destroyFirstPass() {
    this.active = false;
    if (this.gridOptionsService.isAnimateRows()) {
      this.setupRemoveAnimation();
    }
    this.rowNode.setHovered(false);
    const event = this.createRowEvent(Events.EVENT_VIRTUAL_ROW_REMOVED);
    this.dispatchEvent(event);
    this.beans.eventService.dispatchEvent(event);
    super.destroy();
  }
  setupRemoveAnimation() {
    if (this.isSticky()) {
      return;
    }
    const rowStillVisibleJustNotInViewport = this.rowNode.rowTop != null;
    if (rowStillVisibleJustNotInViewport) {
      const rowTop = this.roundRowTopToBounds(this.rowNode.rowTop);
      this.setRowTop(rowTop);
    } else {
      this.allRowGuis.forEach(gui => gui.rowComp.addOrRemoveCssClass('zing-opacity-zero', true));
    }
  }
  destroySecondPass() {
    this.allRowGuis.length = 0;
    this.stopEditing();
    const destroyCellCtrls = ctrls => {
      ctrls.list.forEach(c => c.destroy());
      return {
        list: [],
        map: {}
      };
    };
    this.centerCellCtrls = destroyCellCtrls(this.centerCellCtrls);
    this.leftCellCtrls = destroyCellCtrls(this.leftCellCtrls);
    this.rightCellCtrls = destroyCellCtrls(this.rightCellCtrls);
  }
  setFocusedClasses(gui) {
    this.forEachGui(gui, gui => {
      gui.rowComp.addOrRemoveCssClass('zing-row-focus', this.rowFocused);
      gui.rowComp.addOrRemoveCssClass('zing-row-no-focus', !this.rowFocused);
    });
  }
  onCellFocused() {
    this.onCellFocusChanged();
  }
  onCellFocusCleared() {
    this.onCellFocusChanged();
  }
  onCellFocusChanged() {
    const rowFocused = this.beans.focusService.isRowFocused(this.rowNode.rowIndex, this.rowNode.rowPinned);
    if (rowFocused !== this.rowFocused) {
      this.rowFocused = rowFocused;
      this.setFocusedClasses();
    }
    if (!rowFocused && this.editingRow) {
      this.stopEditing(false);
    }
  }
  onPaginationChanged() {
    const currentPage = this.beans.paginationProxy.getCurrentPage();
    if (this.paginationPage !== currentPage) {
      this.paginationPage = currentPage;
      this.onTopChanged();
    }
    this.refreshFirstAndLastRowStyles();
  }
  onTopChanged() {
    this.setRowTop(this.rowNode.rowTop);
  }
  onPaginationPixelOffsetChanged() {
    this.onTopChanged();
  }
  applyPaginationOffset(topPx, reverse = false) {
    if (this.rowNode.isRowPinned() || this.rowNode.sticky) {
      return topPx;
    }
    const pixelOffset = this.beans.paginationProxy.getPixelOffset();
    const multiplier = reverse ? 1 : -1;
    return topPx + pixelOffset * multiplier;
  }
  setRowTop(pixels) {
    if (this.printLayout) {
      return;
    }
    if (exists(pixels)) {
      const afterPaginationPixels = this.applyPaginationOffset(pixels);
      const skipScaling = this.rowNode.isRowPinned() || this.rowNode.sticky;
      const afterScalingPixels = skipScaling ? afterPaginationPixels : this.beans.rowContainerHeightService.getRealPixelPosition(afterPaginationPixels);
      const topPx = `${afterScalingPixels}px`;
      this.setRowTopStyle(topPx);
    }
  }
  getInitialRowTop(rowContainerType) {
    const suppressRowTransform = this.gridOptionsService.get('suppressRowTransform');
    return suppressRowTransform ? this.getInitialRowTopShared(rowContainerType) : undefined;
  }
  getInitialTransform(rowContainerType) {
    const suppressRowTransform = this.gridOptionsService.get('suppressRowTransform');
    return suppressRowTransform ? undefined : `translateY(${this.getInitialRowTopShared(rowContainerType)})`;
  }
  getInitialRowTopShared(rowContainerType) {
    if (this.printLayout) {
      return '';
    }
    let rowTop;
    if (this.isSticky()) {
      rowTop = this.rowNode.stickyRowTop;
    } else {
      const pixels = this.slideInAnimation[rowContainerType] ? this.roundRowTopToBounds(this.rowNode.oldRowTop) : this.rowNode.rowTop;
      const afterPaginationPixels = this.applyPaginationOffset(pixels);
      rowTop = this.rowNode.isRowPinned() ? afterPaginationPixels : this.beans.rowContainerHeightService.getRealPixelPosition(afterPaginationPixels);
    }
    return rowTop + 'px';
  }
  setRowTopStyle(topPx) {
    const suppressRowTransform = this.gridOptionsService.get('suppressRowTransform');
    this.allRowGuis.forEach(gui => suppressRowTransform ? gui.rowComp.setTop(topPx) : gui.rowComp.setTransform(`translateY(${topPx})`));
  }
  getRowNode() {
    return this.rowNode;
  }
  getCellCtrl(column) {
    let res = null;
    this.getAllCellCtrls().forEach(cellCtrl => {
      if (cellCtrl.getColumn() == column) {
        res = cellCtrl;
      }
    });
    if (res != null) {
      return res;
    }
    this.getAllCellCtrls().forEach(cellCtrl => {
      if (cellCtrl.getColSpanningList().indexOf(column) >= 0) {
        res = cellCtrl;
      }
    });
    return res;
  }
  onRowIndexChanged() {
    if (this.rowNode.rowIndex != null) {
      this.onCellFocusChanged();
      this.updateRowIndexes();
      this.postProcessCss();
    }
  }
  getRowIndex() {
    return this.rowNode.getRowIndexString();
  }
  updateRowIndexes(gui) {
    const rowIndexStr = this.rowNode.getRowIndexString();
    const headerRowCount = this.beans.headerNavigationService.getHeaderRowCount() + this.beans.filterManager.getHeaderRowCount();
    const rowIsEven = this.rowNode.rowIndex % 2 === 0;
    const ariaRowIndex = headerRowCount + this.rowNode.rowIndex + 1;
    this.forEachGui(gui, c => {
      c.rowComp.setRowIndex(rowIndexStr);
      c.rowComp.addOrRemoveCssClass('zing-row-even', rowIsEven);
      c.rowComp.addOrRemoveCssClass('zing-row-odd', !rowIsEven);
      setAriaRowIndex(c.element, ariaRowIndex);
    });
  }
  getPinnedLeftRowElement() {
    return this.leftGui ? this.leftGui.element : undefined;
  }
  getPinnedRightRowElement() {
    return this.rightGui ? this.rightGui.element : undefined;
  }
  getBodyRowElement() {
    return this.centerGui ? this.centerGui.element : undefined;
  }
  getFullWidthRowElement() {
    return this.fullWidthGui ? this.fullWidthGui.element : undefined;
  }
}
RowCtrl.DOM_DATA_KEY_ROW_CTRL = 'renderedRow';